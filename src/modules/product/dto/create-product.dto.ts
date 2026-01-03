import { Optional } from '@nestjs/common';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateProductDto {
    
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsNumber()
    price: number;

    @IsNumber()
    quentity?: number;

    @IsBoolean()
    isActive: boolean;

    @IsString()
    @Optional()
    categoryId?: string;

    @IsString()
    @Optional()
    categoryName?: string;

}
