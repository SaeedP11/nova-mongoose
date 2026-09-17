import { omit } from 'lodash';
import { PaginationOptionsDto } from '../dto/pagination-options.dto';

export default function FilterController() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (arg: PaginationOptionsDto) {
      return await originalMethod.call(this, {
        ...(arg.filter && {
          simpleFilter: arg.filter,
        }),
        ...(arg.search && {
          simpleSearch: arg.search,
        }),
        ...omit(arg, ['filter', 'search']),
      });
    };
  };
}
