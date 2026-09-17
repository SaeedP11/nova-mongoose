import { IDataBase } from './data-base.interface';

/** A stored document before mongoose gives it its `id`. */
export interface IBaseEntity<TOwner = unknown> extends Omit<
  IDataBase<TOwner>,
  'id'
> {}
