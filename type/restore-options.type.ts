import { RootFilterQuery, QueryOptions } from 'mongoose';

export type RestoreOptions<TRawDocType = unknown> = {
  filter: RootFilterQuery<TRawDocType>;
  options?: QueryOptions<TRawDocType>;
};
