import { RootFilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

export type UpdateOptions<TRawDocType = unknown> = {
  filter: RootFilterQuery<TRawDocType>;
  update: UpdateQuery<TRawDocType>;
  options?: QueryOptions<TRawDocType>;
};
