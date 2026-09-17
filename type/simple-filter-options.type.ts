import { ISimpleFilter } from '../interface/simple-filter.interface';

export type SimpleFilterOptions<T = unknown> = {
  simpleFilter?: ISimpleFilter<T>[];
  simpleSearch?: ISimpleFilter<T>[];
};
