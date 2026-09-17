import { ClientSession } from 'mongoose';
import { PopulateOptions } from './populate-options.type';

export type MongooseCommonOptions<ToDto, IgnoreException = boolean> = {
  toDto?: ToDto;
  /** `false` skips populating entirely, including the always appended owner. */
  populate?: PopulateOptions | boolean;
  ignoreException?: IgnoreException;
  /**
   * Every read is scoped to `isDeleted: false`. Pass `true` to include soft
   * deleted documents, which is what admin tooling and `restore` need.
   */
  withDeleted?: boolean;
  /**
   * Joins the call to an open transaction. MongoDB only supports transactions
   * on a replica set, so a standalone deployment rejects the session.
   */
  session?: ClientSession;
};
