import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateCatalogDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsString()
	@IsNotEmpty()
	description: string;

	@IsNumber()
	price: number;

	@IsBoolean()
	@IsOptional()
	isActive?: boolean;

	@IsString()
	@IsNotEmpty()
	categoryId: string;
}
