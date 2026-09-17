import {
  FilterQuery,
  PaginateOptions as MongoosePaginateOptions,
  ProjectionType,
} from 'mongoose';
import { PaginationSort } from './pagination-sort.type';
import { SimpleFilterOptions } from './simple-filter-options.type';

export type PaginateOptions<TRawDocType = unknown, Interface = unknown> = {
  filter?: FilterQuery<TRawDocType>;
  projection?: ProjectionType<TRawDocType>;
  options?: Omit<MongoosePaginateOptions, 'projection' | 'page' | 'limit'>;
  sort?: PaginationSort;
  page?: number;
  limit?: number;
} & SimpleFilterOptions<Interface>;
