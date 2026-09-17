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

  // Every read is scoped to `isDeleted: false` and the default sort is
  // `createdAt` descending, which is exactly what every list and paginate
  // endpoint issues
  schema.index({ isDeleted: 1, createdAt: -1 });

  // CASL ownership rules (`{ 'owner.id': user.id }`) are evaluated per request
  schema.index({ owner: 1, isDeleted: 1 });
}
