import { ClientSession } from 'mongoose';

/**
 * The options every call understands regardless of whether it returns
 * documents: which soft delete scope to read, and which transaction to join.
 */
export type ScopeOptions = {
  withDeleted?: boolean;
  session?: ClientSession;
};
