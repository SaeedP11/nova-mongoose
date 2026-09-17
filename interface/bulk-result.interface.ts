export interface IUpdateManyResult {
  matchedCount: number;
  modifiedCount: number;
}

export interface IDeleteManyResult {
  /** Soft deletes report what they flagged, `force` what it removed. */
  deletedCount: number;
}
