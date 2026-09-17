import { Expose, Transform, Type } from 'class-transformer';
import { isJSON, IsOptional } from 'class-validator';
import { ISimpleFilter } from '../interface/simple-filter.interface';
import { SimpleFilterDto } from './simple-filter.dto';
import { IFilterOptions } from '../interface/filter-options.interface';

export class FilterOptionsDto<T> implements IFilterOptions<T> {
  @Expose()
  @Transform((obj) => (isJSON(obj.value) ? JSON.parse(obj.value) : obj.value))
  @IsOptional()
  //   @ValidateNested({ each: true })
  @Type(() => SimpleFilterDto)
  filter?: ISimpleFilter<T>[];

  @Expose()
  @Transform((obj) => (isJSON(obj.value) ? JSON.parse(obj.value) : obj.value))
  @IsOptional()
  //   @ValidateNested({ each: true })
  @Type(() => SimpleFilterDto)
  search?: ISimpleFilter<T>[];
}
