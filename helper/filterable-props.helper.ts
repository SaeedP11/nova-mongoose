import { Schema } from 'mongoose';

/**
 * Only the schemas are needed here, and taking them structurally keeps this
 * helper usable with `Model`, `PaginateModel` and a discriminated model
 * alike.
 */
type SchemaSource = {
  schema: Schema;
  discriminators?: Record<string, { schema: Schema }>;
};

/**
 * Bookkeeping a client must never address from a query string. `owner` in
 * particular would let any authenticated caller enumerate another user's
 * documents, and `isDeleted` would resurrect soft deleted ones.
 */
const NEVER_FILTERABLE = ['isDeleted', 'owner', '__v'];

/** `ModifyArgument` maps `id` onto `_id`, so both address the same path. */
const ALWAYS_FILTERABLE = ['id', '_id'];

/**
 * `simpleFilter` field names arrive straight from the query string and become
 * MongoDB query keys, so they are checked against what the model actually
 * declares. A service can narrow this further by passing `filterableProps`.
 */
export function resolveFilterableProps(
  model: SchemaSource,
  filterableProps?: string[],
): Set<string> {
  const paths = new Set<string>(ALWAYS_FILTERABLE);

  if (filterableProps) {
    for (const prop of filterableProps) paths.add(prop);
    return paths;
  }

  for (const schema of collectSchemas(model)) {
    for (const path of Object.keys(schema.paths)) paths.add(path);
    for (const path of Object.keys(schema.virtuals)) paths.add(path);
  }

  for (const path of NEVER_FILTERABLE) paths.delete(path);

  return paths;
}

/**
 * Discriminators (as used by `Ticket`) keep their own props on their own
 * schema, so the base schema alone does not describe everything that is
 * stored in the collection.
 */
function collectSchemas(model: SchemaSource): Schema[] {
  const schemas: Schema[] = [model.schema];
  for (const discriminator of Object.values(model.discriminators ?? {})) {
    schemas.push(discriminator.schema);
  }

  return schemas;
}

/**
 * Sub-document props are reachable through their parent path, which is what
 * the schema declares for a nested schema (`meta` for `meta.size`).
 */
export function isFilterableField(
  filterableProps: Set<string>,
  field: string,
): boolean {
  return filterableProps.has(field) || filterableProps.has(field.split('.')[0]);
}
