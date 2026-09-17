import { MongooseBaseQueryOptions, RootFilterQuery, mongo } from 'mongoose';

export type DeleteManyOptions<TRawDocType = unknown> = {
  filter: RootFilterQuery<TRawDocType>;
  // `deleteMany` takes the driver's options, which are narrower than the
  // `QueryOptions` the single document methods accept
  options?: mongo.DeleteOptions & MongooseBaseQueryOptions<TRawDocType>;
  force?: boolean;
};
