import { RootFilterQuery, ProjectionType, QueryOptions } from 'mongoose';
import { SimpleFilterOptions } from './simple-filter-options.type';

export type FindOptions<TRawDocType = unknown, Interface = unknown> = {
  filter?: RootFilterQuery<TRawDocType>;
  projection?: ProjectionType<TRawDocType>;
  options?: QueryOptions<TRawDocType>;
} & SimpleFilterOptions<Interface>;
