// RabbitMQ Client Tokens
export const INVENTORY_CLIENT = 'INVENTORY_CLIENT';

// Catalog Service Message Patterns
export const CATALOG_PATTERNS = {
  // Product patterns
  PRODUCT_CREATE: 'product/create',
  PRODUCT_FIND_ALL: 'products',
  PRODUCT_FIND_ONE: 'product/getOne',
  PRODUCT_UPDATE: 'product/update',
  PRODUCT_DELETE: 'product/delete',
  PRODUCT_FILTER: 'product/filter',
  PRODUCT_DEACTIVATE: 'product/deactivate',
  
  // Category patterns
  CATEGORY_CREATE: 'category/create',
  CATEGORY_FIND_ALL: 'categories',
  CATEGORY_FIND_ONE: 'category/findOne',
  CATEGORY_UPDATE: 'category/update',
  CATEGORY_REMOVE: 'category/remove',
} as const;

// RabbitMQ Message Patterns
export const INVENTORY_PATTERNS = {
  CREATE: 'inventory/create',
  UPDATE: 'inventory/update',
  FIND_ONE: 'inventory/find-one',
  FIND_ALL: 'inventory/find-all',
  REMOVE: 'inventory/remove',
  CHECK_AVAILABILITY: 'inventory/check-availability',
} as const;

// RabbitMQ Event Patterns
export const INVENTORY_EVENTS = {
  CREATED: 'inventory.created',
  UPDATED: 'inventory.updated',
  RESERVED: 'inventory.reserved',
  RELEASED: 'inventory.released',
} as const;
