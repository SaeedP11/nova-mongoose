import { NotFoundException } from '@nestjs/common';
import { assertMongooseService } from '../helper/assert-mongoose-service.helper';
import { MongooseErrorMessage } from '../constant/mongoose-error-message.const';
import { CreateOptions } from '../type/create-options.type';

export default function SaveDocument() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function ({ ignoreOwner, ...arg }: CreateOptions) {
      assertMongooseService(this);
      const document = await originalMethod.call(this, arg);
      if (!document.owner && ignoreOwner !== true) {
        throw new NotFoundException(
          MongooseErrorMessage.modelNotFound(
            `${this.constructor.name}.${propertyKey}`,
            'User',
            'owner user not found',
          ),
        );
      }

      const { session } = arg as { session?: any };
      return await document.save(session ? { session } : undefined);
    };
  };
}
