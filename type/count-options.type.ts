import { RootFilterQuery } from 'mongoose';
import { SimpleFilterOptions } from './simple-filter-options.type';

export type CountOptions<TRawDocType = unknown, Interface = unknown> = {
  filter?: RootFilterQuery<TRawDocType>;
} & SimpleFilterOptions<Interface>;
