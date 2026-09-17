import { Expose } from 'class-transformer';
import { IsArray, IsNumber, Max, Min } from 'class-validator';
import { IPagination } from '../interface/pagination.interface';

export class PaginationDto<D> implements IPagination<D> {
  @Expose()
  @IsNumber()
  @Min(0)
  totalItems: number;

  @Expose()
  @IsArray()
  items: D[];

  @Expose()
  @IsNumber()
  @Min(0)
  totalPages: number;

  @Expose()
  @IsNumber()
  @Min(0)
  page: number;

  @Expose()
  @IsNumber()
  @Min(0)
  @Max(50)
  limit: number;

  constructor(value: PaginationDto<D>) {
    Object.assign(this, value);
  }
}
