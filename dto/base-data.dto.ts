import { Exclude, Expose, Transform } from 'class-transformer';
import { IsDateString, ValidateNested } from 'class-validator';
import { IDataBase } from '../interface/data-base.interface';

export class BaseDataDto<TOwner = unknown> implements IDataBase<TOwner> {
  @Transform(
    ({ obj }) => (obj['_id'] ? obj['_id'].toString() : obj['id'].toString()),
    { toClassOnly: true },
  )
  @Expose()
  id: string;

  @Exclude()
  _id: string;

  @Expose()
  @ValidateNested()
  owner: TOwner;

  @Expose()
  @IsDateString()
  createdAt: Date;

  @Expose({ toClassOnly: true })
  isDeleted: boolean;

  constructor(value: BaseDataDto<TOwner> | IDataBase<TOwner>) {
    Object.assign(this, value);
  }
}
