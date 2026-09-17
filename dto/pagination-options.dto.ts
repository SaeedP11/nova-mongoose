import { Expose } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { IPaginationOptions } from '../interface/pagination-options.interface';
import { PaginationSort } from '../type/pagination-sort.type';
import { FilterOptionsDto } from './filter-options.dto';

export class PaginationOptionsDto<T = unknown>
  extends FilterOptionsDto<T>
  implements IPaginationOptions<T>
{
  @Expose()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  sort?: PaginationSort;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(50)
  limit?: number;

  @Expose()
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;
}
