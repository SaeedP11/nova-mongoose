import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { SimpleFilterOperator } from '../enum/simple-filter-operator.enum';
import {
  ISimpleFilter,
  SimpleFilterValue,
} from '../interface/simple-filter.interface';

export class SimpleFilterDto implements ISimpleFilter {
  @Expose()
  @IsNotEmpty()
  @IsString()
  field: keyof unknown;

  @Expose()
  @IsEnum(SimpleFilterOperator)
  operator: SimpleFilterOperator;

  @Expose()
  @IsNotEmpty()
  value: SimpleFilterValue;
}
