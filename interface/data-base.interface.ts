/**
 * The props every stored document carries. `TOwner` is what the `owner` ref
 * populates into: an app supplies its own user interface, and a project with
 * no ownership model can leave it alone.
 */
export interface IDataBase<TOwner = unknown> {
  id: string;
  owner: TOwner;
  createdAt: Date;
  isDeleted: boolean;
}
