import { Model, RootFilterQuery, UpdateQuery } from 'mongoose';

export type UpdateManyOptions<TRawDocType = unknown> = {
  filter: RootFilterQuery<TRawDocType>;
  update: UpdateQuery<TRawDocType>;
  // `updateMany` takes the driver's options, which are narrower than the
  // `QueryOptions` the single document methods accept
  options?: Parameters<Model<TRawDocType>['updateMany']>[2];
};
