import { ProjectionType, QueryOptions } from 'mongoose';

export type FindByIdOptions<TRawDocType> = {
  id: string;
  projection?: ProjectionType<TRawDocType>;
  options?: QueryOptions<TRawDocType>;
};
