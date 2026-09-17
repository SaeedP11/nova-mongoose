import { omit } from 'lodash';
import { RootFilterQuery } from 'mongoose';
import { assertMongooseService } from '../helper/assert-mongoose-service.helper';
import {
  rewriteResourceValues,
  toResourceRef,
} from '../helper/resource-value.helper';
import { CreateOptions } from '../type/create-options.type';
import { CreateManyOptions } from '../type/create-many-options.type';
import { UpdateOptions } from '../type/update-options.type';
import { FindOptions } from '../type/find-options.type';
import { MongooseMethod } from '../enum/mongoose-method.enum';

const READ_ONLY_FIELDS = ['_id', 'id', 'isDeleted', 'owner', 'createdAt'];
const LOGICAL_OPERATORS = ['$and', '$or', '$nor'];

export default function ModifyArgument() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (
      arg: CreateOptions | CreateManyOptions | UpdateOptions | FindOptions,
    ) {
      assertMongooseService(this);
      const resourceProps = this.resourceProps ?? [];
      const mapFields: Record<string, string> = {};
      for (const propName of resourceProps) {
        mapFields[`${propName}.id`] = propName;
      }

      switch (propertyKey) {
        case MongooseMethod.CREATE: {
          const { data } = arg as CreateOptions;
          return await originalMethod.call(this, {
            ...arg,
            data: modifyPayload(data, resourceProps),
          });
        }
        case MongooseMethod.CREATE_MANY: {
          const { data } = arg as CreateManyOptions;
          return await originalMethod.call(this, {
            ...arg,
            data: (data ?? []).map((item) =>
              modifyPayload(item as Record<string, unknown>, resourceProps),
            ),
          });
        }
        case MongooseMethod.UPDATE:
        case MongooseMethod.UPDATE_MANY: {
          const { filter, update } = arg as UpdateOptions;
          return await originalMethod.call(this, {
            ...arg,
            filter: filterFieldMapper(filter, mapFields),
            update: modifyPayload(update, resourceProps),
          });
        }
        default: {
          const { filter } = arg as FindOptions;
          return await originalMethod.call(this, {
            ...arg,
            filter: filterFieldMapper(filter, mapFields),
          });
        }
      }
    };
  };
}

/**
 * Strips the props a client must never write and rewrites `{ id }` references
 * into the `{ _id: ObjectId }` shape mongoose casts for `ref` props. The
 * rewritten values are applied last so they win over the raw payload.
 */
function modifyPayload(
  payload: Record<string, unknown>,
  resourceProps: string[],
): Record<string, unknown> {
  if (!payload) return payload;

  return {
    ...omit(payload, [...READ_ONLY_FIELDS, ...resourceProps]),
    ...rewriteResourceValues(payload),
  };
}

function filterFieldMapper(
  fields: RootFilterQuery<unknown>,
  mapFields: Record<string, string> = {},
): RootFilterQuery<unknown> {
  const defaultMapFields = {
    id: '_id',
    'owner.id': 'owner',
    ...mapFields,
  };

  const newFields: RootFilterQuery<unknown> = {};
  for (const key in fields) {
    const value = fields[key];
    // `$and`, `$or` and `$nor` hold nested filters that need the same mapping
    if (LOGICAL_OPERATORS.includes(key) && value instanceof Array) {
      newFields[key] = value.map((nestedFilter) =>
        filterFieldMapper(nestedFilter, mapFields),
      );
      continue;
    }

    newFields[defaultMapFields[key] ?? key] = toResourceRef(value) ?? value;
  }

  return newFields;
}
