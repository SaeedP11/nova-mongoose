import { Expose } from 'class-transformer';
import { IsMongoId } from 'class-validator';
import { IResourceId } from '../interface/resource-id.interface';

export class ResourceIdDto implements IResourceId {
  @Expose()
  @IsMongoId()
  id: string;
}
