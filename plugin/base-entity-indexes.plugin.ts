import { Schema } from 'mongoose';

/**
 * Indexes the props `BaseEntity` gives every collection. Registered once as a
 * connection plugin, the same way `mongoose-paginate-v2` is, so a new module
 * does not have to remember to declare them.
 */
export function baseEntityIndexesPlugin(schema: Schema): void {
  // Sub-document schemas receive connection plugins too, and they carry none
  // of these props
  if (!schema.path('isDeleted') || !schema.path('createdAt')) return;

  // Every read is scoped to `isDeleted: false`, and the default sort is
  // `createdAt` descending plus the `_id` tiebreaker `toSortObject` appends.
  // `_id` has to be part of the index: without it MongoDB can walk the index
  // in `createdAt` order but still sorts every match in memory before it can
  // skip to the requested page
  schema.index({ isDeleted: 1, createdAt: -1, _id: -1 });

  // CASL ownership rules (`{ 'owner.id': user.id }`) are evaluated per request,
  // and an owner's own list is paged with the same default sort
  schema.index({ owner: 1, isDeleted: 1, createdAt: -1, _id: -1 });
}
