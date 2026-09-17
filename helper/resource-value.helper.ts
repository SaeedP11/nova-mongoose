import { Types } from 'mongoose';
import { IResourceId } from '../interface/resource-id.interface';

type ResourceRef = { _id: Types.ObjectId };

/**
 * `{ id: '...' }` is how controllers and DTOs address a referenced document.
 * Mongoose casts `{ _id: ObjectId }` to an ObjectId for `ref` props, so both
 * payloads and filters are rewritten into that shape before they reach it.
 */
export function isResourceId(value: unknown): value is IResourceId {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof (value as IResourceId).id === 'string' &&
    Types.ObjectId.isValid((value as IResourceId).id)
  );
}

export function toResourceRef(
  value: unknown,
): ResourceRef | ResourceRef[] | undefined {
  if (isResourceId(value)) {
    return { _id: new Types.ObjectId(value.id) };
  }

  if (value instanceof Array && value.length && value.every(isResourceId)) {
    return value.map((item: IResourceId) => ({
      _id: new Types.ObjectId(item.id),
    }));
  }

  return undefined;
}

export function rewriteResourceValues(
  object: Record<string, unknown>,
): Record<string, ResourceRef | ResourceRef[]> {
  const resourceFields: Record<string, ResourceRef | ResourceRef[]> = {};
  for (const key in object) {
    // Update operators (`$set`, `$push`, ...) are passed through untouched
    if (key.startsWith('$')) continue;

    const resourceRef = toResourceRef(object[key]);
    if (resourceRef) resourceFields[key] = resourceRef;
  }

  return resourceFields;
}
