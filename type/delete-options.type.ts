import { QueryOptions, RootFilterQuery } from 'mongoose';

export type DeleteOptions<TRawDocType = unknown> = {
  filter: RootFilterQuery<TRawDocType>;
  options?: QueryOptions<TRawDocType>;
  force?: boolean;
};
