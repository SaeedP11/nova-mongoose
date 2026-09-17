import { Type } from '@nestjs/common';
import { Prop } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { IBaseEntity } from '../interface/base-entity.interface';

export type BaseEntityOptions = {
  /** The model name the `owner` ref points at, e.g. `'User'`. */
  ownerRef: string;
};

/**
 * Builds the base every schema extends.
 *
 * This is a factory rather than a plain class because `@Prop` is evaluated
 * when the module is imported — before any `forRoot` could supply the ref —
 * so the owning model has to be known at class creation time.
 *
 * Bind it once per app and export the result under a stable name:
 *
 *   export const BaseEntity = createBaseEntity<IUser>({ ownerRef: 'User' });
 *   export type BaseEntity = InstanceType<typeof BaseEntity>;
 */
export function createBaseEntity<TOwner = unknown>({
  ownerRef,
}: BaseEntityOptions): Type<IBaseEntity<TOwner>> {
  class BaseEntity implements IBaseEntity<TOwner> {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: ownerRef })
    owner: TOwner;

    @Prop({ type: Date, default: () => new Date() })
    createdAt: Date;

    @Prop({ type: Boolean, default: false })
    isDeleted: boolean;
  }

  return BaseEntity;
}
