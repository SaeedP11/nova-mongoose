import { ProjectionType, QueryOptions } from 'mongoose';

export type FindAllOptions<TRawDocType = unknown> = {
  projection?: ProjectionType<TRawDocType>;
  options?: QueryOptions<TRawDocType>;
};
