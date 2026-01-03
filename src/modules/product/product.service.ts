import { Injectable, Inject, Logger } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterProductDto } from './dto/filter-product.pdo';
import { CategoryService } from '../category/category.service';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { INVENTORY_CLIENT, INVENTORY_EVENTS, INVENTORY_PATTERNS } from '../../messaging';
import { ApiResponse } from './types/api-response';
import { ServiceError } from '../../common/exceptions';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryService: CategoryService,
    @Inject(INVENTORY_CLIENT) private readonly inventoryClient: ClientProxy,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ApiResponse<any>> {
    const { categoryId, categoryName, quentity, ...productData } = createProductDto;

    // Step 1: Resolve category
    const finalCategoryId = await this.resolveCategoryId(categoryId, categoryName);
    
    // Check if category resolution returned error
    if (finalCategoryId instanceof ServiceError) {
      return finalCategoryId;
    }

    // Step 2: Create product
    const product = await this.createProductInDb(productData, finalCategoryId);
    this.logger.log(`Product created successfully: ${product.id}`);

    // Step 3: Create inventory if quantity is provided
    if (quentity !== undefined && quentity !== null && quentity > 0) {
      return this.createProductWithInventory(product, quentity);
    }

    // Return product without inventory
    return {
      success: true,
      message: 'Product created successfully',
      data: { product },
    };
  }

  private async resolveCategoryId(categoryId?: string, categoryName?: string): Promise<string | ServiceError> {
    if (categoryId) {
      return this.validateCategoryExists(categoryId);
    }

    if (categoryName) {
      return this.getOrCreateCategory(categoryName);
    }

    return new ServiceError(
      'VALIDATION_ERROR',
      'Either categoryId or categoryName must be provided',
      400,
      'catalog-service',
      { provided: { categoryId, categoryName } }
    );
  }

  private async validateCategoryExists(categoryId: string): Promise<string | ServiceError> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return new ServiceError(
        'NOT_FOUND',
        `Category with ID ${categoryId} not found`,
        404,
        'catalog-service',
        { resource: 'Category', identifier: categoryId }
      );
    }

    return categoryId;
  }

  private async getOrCreateCategory(categoryName: string): Promise<string | ServiceError> {
    let category = await this.prisma.category.findUnique({
      where: { name: categoryName },
    });

    if (!category) {
      this.logger.log(`Creating new category: ${categoryName}`);
      const result = await this.categoryService.create({
        name: categoryName,
        description: `Auto-created category for ${categoryName}`,
      });
      
      // Check if category creation returned error
      if (result instanceof ServiceError) {
        return result;
      }
      
      category = result.data;
    }

    return category.id;
  }

  private async createProductInDb(productData: any, categoryId: string): Promise<any> {
    return this.prisma.product.create({
      data: {
        ...productData,
        categoryId,
      },
      include: {
        category: true,
      },
    });
  }

  private async createProductWithInventory(product: any, quantity: number): Promise<ApiResponse<any> | ServiceError> {
    try {
      this.logger.log(`Requesting inventory creation for product ${product.id}`);

      const inventoryResponse = await this.requestInventoryCreation(product.id, quantity);

      if (inventoryResponse?.data) {
        this.logger.log(`Inventory created: SKU ${inventoryResponse.data.sku}`);

        return {
          success: true,
          message: 'Product and inventory created successfully',
          data: {
            product,
            inventory: inventoryResponse.data,
          },
        };
      }

      this.logger.warn(`Unexpected response from inventory service for product ${product.id}`);

      return {
        success: true,
        message: 'Product created, inventory status unknown',
        data: { product },
        warning: 'Inventory service response was invalid',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create inventory for product ${product.id}: ${error.message}`,
        error.stack
      );

      // Attempt rollback
      const rollbackSuccess = await this.rollbackProductCreation(product.id);

      if (rollbackSuccess) {
        this.logger.log(`Product ${product.id} rolled back successfully due to inventory creation failure`);
        
        return new ServiceError(
          'SERVICE_UNAVAILABLE',
          `Inventory creation failed: ${error.message}. Product was rolled back.`,
          503,
          'catalog-service',
          { service: 'Inventory Service' }
        );
      } else {
        this.logger.error(`Failed to rollback product ${product.id}. Manual cleanup required!`);
        
        return new ServiceError(
          'INTERNAL_SERVER_ERROR',
          'Failed to create inventory and rollback transaction',
          500,
          'catalog-service',
          {
            productId: product.id,
            requiresManualCleanup: true,
            inventoryError: error.message,
          }
        );
      }
    }
  }

  private async requestInventoryCreation(productId: string, quantity: number): Promise<any> {
    const inventoryData = {
      sku: `PROD-${productId}`,
      quantity,
      reserved: 0,
    };

    return lastValueFrom(
      this.inventoryClient.send(INVENTORY_PATTERNS.CREATE, inventoryData),
      { defaultValue: null }
    );
  }

  private async rollbackProductCreation(productId: string): Promise<boolean> {
    try {
      this.logger.log(`Starting rollback for product ${productId}`);

      const deletedProduct = await this.prisma.product.delete({
        where: { id: productId },
      });

      this.logger.log(`Product ${productId} deleted successfully during rollback`);
      return true;
    } catch (error) {
      this.logger.error(
        `Rollback failed for product ${productId}: ${error.message}`,
        error.stack
      );
      return false;
    }
  }

  async delete(id: string, softDelete: boolean = true): Promise<ApiResponse<any> | ServiceError> {
    try {
      this.logger.log(`Removing product ${id} (softDelete: ${softDelete})`);

      const productExists = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!productExists) {
        return new ServiceError(
          'NOT_FOUND',
          `Product with ID ${id} not found`,
          404,
          'catalog-service',
          { resource: 'Product', identifier: id }
        );
      }

      let result;

      if (softDelete) {
        // Soft delete: mark as inactive
        result = await this.prisma.product.update({
          where: { id },
          data: { isActive: false },
          include: { category: true },
        });

        this.logger.log(`Product ${id} soft deleted (marked as inactive)`);
      } else {
        // Hard delete
        result = await this.prisma.product.delete({
          where: { id },
        });

        this.logger.log(`Product ${id} hard deleted`);
      }

      return {
        success: true,
        message: softDelete ? 'Product deactivated successfully' : 'Product deleted successfully',
        data: { product: result },
      };
    } catch (error) {
      // Return ServiceError if it's already one
      if (error instanceof ServiceError) {
        return error;
      }

      this.logger.error(`Failed to remove product ${id}: ${error.message}`, error.stack);

      return new ServiceError(
        'INTERNAL_SERVER_ERROR',
        `Failed to remove product: ${error.message}`,
        500,
        'catalog-service',
        { productId: id, originalError: error.code }
      );
    }
  }

  async findAll(): Promise<ApiResponse<any> | ServiceError> {
    try {
      this.logger.log('Fetching all products');

      // Step 1: Get all products from database
      const products = await this.prisma.product.findMany({
        include: {
          category: true,
        },
        where: {
          isActive: true,
        },
      });

      if (products.length === 0) {
        return {
          success: true,
          message: 'No products found',
          data: { products: [], count: 0 },
        };
      }

      this.logger.log(`Found ${products.length} products, fetching inventory data`);

      // Step 2: Get inventory data for all products
      const inventoryData = await this.fetchInventoryForProducts(products);

      // Step 3: Combine product and inventory data
      const productsWithInventory = products.map(product => {
        const productSku = `PROD-${product.id}`;
        const inventory = inventoryData.find(inv => inv.sku === productSku);

        return {
          ...product,
          inventory: inventory || null,
        };
      });

      return {
        success: true,
        message: 'Products fetched successfully',
        data: {
          products: productsWithInventory,
          count: productsWithInventory.length,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch products: ${error.message}`, error.stack);

      return new ServiceError(
        'INTERNAL_SERVER_ERROR',
        `Failed to fetch products: ${error.message}`,
        500,
        'catalog-service',
        { originalError: error.code }
      );
    }
  }

  private async fetchInventoryForProducts(products: any[]): Promise<any[]> {
    try {
      const response = await lastValueFrom(
        this.inventoryClient.send(INVENTORY_PATTERNS.FIND_ALL, {}),
        { defaultValue: { data: [] } }
      );

      this.logger.log(`Received inventory data: ${JSON.stringify(response)}`);

      // Handle different response formats
      if (response?.data?.inventories) {
        return response.data.inventories;
      } else if (response?.data && Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      }

      this.logger.warn('Unexpected inventory response format');
      return [];
    } catch (error) {
      this.logger.warn(`Failed to fetch inventory data: ${error.message}`);
      return []; // Return empty array if inventory service fails
    }
  }

  async findOne(id: string): Promise<ApiResponse<any> | ServiceError> {
    try {
      if (!id) {
        return new ServiceError(
          'VALIDATION_ERROR',
          'Product ID is required',
          400,
          'catalog-service'
        );
      }

      this.logger.log(`Fetching product: ${id}`);

      // Step 1: Get product from database
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
        },
      });

      if (!product) {
        return new ServiceError(
          'NOT_FOUND',
          `Product with ID ${id} not found`,
          404,
          'catalog-service',
          { resource: 'Product', identifier: id }
        );
      }

      // Step 2: Get inventory data for this product
      const inventory = await this.fetchInventoryForProduct(product.id);

      return {
        success: true,
        message: 'Product fetched successfully',
        data: {
          product: {
            ...product,
            inventory,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch product ${id}: ${error.message}`, error.stack);

      return new ServiceError(
        'INTERNAL_SERVER_ERROR',
        `Failed to fetch product: ${error.message}`,
        500,
        'catalog-service',
        { productId: id, originalError: error.code }
      );
    }
  }

  private async fetchInventoryForProduct(productId: string): Promise<any> {
    try {
      const sku = `PROD-${productId}`;
      
      const response = await lastValueFrom(
        this.inventoryClient.send(INVENTORY_PATTERNS.FIND_ONE, { sku }),
        { defaultValue: null }
      );

      this.logger.log(`Received inventory data for SKU ${sku}`);

      // Handle different response formats
      if (response?.data?.inventory) {
        return response.data.inventory;
      } else if (response?.data) {
        return response.data;
      } else if (response) {
        return response;
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to fetch inventory for product ${productId}: ${error.message}`);
      return null; // Return null if inventory service fails
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ApiResponse<any> | ServiceError> {
    try {
      if (!id) {
        return new ServiceError(
          'VALIDATION_ERROR',
          'Product ID is required',
          400,
          'catalog-service'
        );
      }

      this.logger.log(`Updating product ${id}`);

      // Check if product exists
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return new ServiceError(
          'NOT_FOUND',
          `Product with ID ${id} not found`,
          404,
          'catalog-service',
          { resource: 'Product', identifier: id }
        );
      }

      // Handle category update if provided
      let categoryId = existingProduct.categoryId;
      if (updateProductDto.categoryId || updateProductDto.categoryName) {
        const resolvedCategoryId = await this.resolveCategoryId(
          updateProductDto.categoryId,
          updateProductDto.categoryName
        );
        
        if (resolvedCategoryId instanceof ServiceError) {
          return resolvedCategoryId;
        }
        
        categoryId = resolvedCategoryId;
      }

      // Remove categoryName from update data (it's not a field in the Product model)
      const { categoryName, categoryId: _, ...updateData } = updateProductDto as any;

      // Update product
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
          ...updateData,
          categoryId,
        },
        include: {
          category: true,
        },
      });

      this.logger.log(`Product ${id} updated successfully`);

      return {
        success: true,
        message: 'Product updated successfully',
        data: { product: updatedProduct },
      };
    } catch (error) {
      this.logger.error(`Failed to update product ${id}: ${error.message}`, error.stack);

      return new ServiceError(
        'INTERNAL_SERVER_ERROR',
        `Failed to update product: ${error.message}`,
        500,
        'catalog-service',
        { productId: id, originalError: error.code }
      );
    }
  }

  async filter(filterData: FilterProductDto): Promise<ApiResponse<any> | ServiceError> {
    try {
      this.logger.log(`Filtering products with criteria: ${JSON.stringify(filterData)}`);

      // Build Prisma where clause dynamically
      const where: any = {
        isActive: true,
      };

      // Filter by category ID
      if (filterData.categoryId) {
        where.categoryId = filterData.categoryId;
      }

      // Filter by category name
      if (filterData.categoryName || filterData.category) {
        where.category = {
          name: {
            contains: filterData.categoryName || filterData.category,
            mode: 'insensitive',
          },
        };
      }

      // Filter by product name (partial match)
      if (filterData.name) {
        where.name = {
          contains: filterData.name,
          mode: 'insensitive',
        };
      }

      // Filter by price range
      if (filterData.minPrice !== undefined || filterData.maxPrice !== undefined) {
        where.price = {};
        if (filterData.minPrice !== undefined) {
          where.price.gte = filterData.minPrice;
        }
        if (filterData.maxPrice !== undefined) {
          where.price.lte = filterData.maxPrice;
        }
      }

      // Fetch filtered products
      this.logger.log(`Executing product filter query with where clause: ${JSON.stringify(where)}`);
      const products = await this.prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      this.logger.log(`Found ${products.length} products matching criteria`);

      if (products.length === 0) {
        return {
          success: true,
          message: 'No products found matching criteria',
          data: {
            products: [],
            count: 0,
            filters: filterData,
          },
        };
      }

      // Fetch inventory data for all filtered products
      const inventoryData = await this.fetchInventoryForProducts(products);

      // Combine product and inventory data
      const productsWithInventory = products.map(product => {
        const productSku = `PROD-${product.id}`;
        const inventory = inventoryData.find(inv => inv.sku === productSku);

        return {
          ...product,
          inventory: inventory || null,
        };
      });

      return {
        success: true,
        message: 'Products filtered successfully',
        data: {
          products: productsWithInventory,
          count: productsWithInventory.length,
          filters: filterData,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to filter products: ${error.message}`, error.stack);

      return new ServiceError(
        'INTERNAL_SERVER_ERROR',
        `Failed to filter products: ${error.message}`,
        500,
        'catalog-service',
        { originalError: error.code }
      );
    }
  }

  /**
   * Deactivate product by SKU (called when inventory is deleted)
   */
  async deactivateBySku(sku: string): Promise<ApiResponse<any>> {
    try {
      if (!sku) {
        throw new ServiceError(
          'VALIDATION_ERROR',
          'SKU is required',
          400,
          'catalog-service',
          { field: 'sku' }
        );
      }

      this.logger.log(`Deactivating product with SKU: ${sku}`);

      // Find product by SKU
      const product = await this.prisma.product.findFirst({
        where: {
          name: {
            contains: sku,
            mode: 'insensitive',
          },
        },
      });

      if (!product) {
        return new ServiceError(
          'NOT_FOUND',
          `Product with SKU ${sku} not found`,
          404,
          'catalog-service',
          { resource: 'Product', identifier: sku }
        );
      }

      // Deactivate the product
      const deactivated = await this.prisma.product.update({
        where: { id: product.id },
        data: {
          isActive: false,
        },
      });

      this.logger.log(`Product deactivated successfully: ${deactivated.id}`);

      return {
        success: true,
        message: 'Product deactivated successfully due to inventory deletion',
        data: deactivated,
      };
    } catch (error) {
      if (error.code) {
        return error;
      }

      this.logger.error(`Failed to deactivate product by SKU: ${error.message}`);
      return new ServiceError(
        'INTERNAL_SERVER_ERROR',
        'Failed to deactivate product',
        500,
        'catalog-service'
      );
    }
  }
}

