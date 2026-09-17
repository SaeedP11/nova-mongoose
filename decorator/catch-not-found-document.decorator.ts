import { NotFoundException } from '@nestjs/common';
import { MongooseErrorMessage } from '../constant/mongoose-error-message.const';
import { assertMongooseService } from '../helper/assert-mongoose-service.helper';

export default function CatchNotFoundDocument() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function ({ ignoreException, toDto, ...data }) {
      assertMongooseService(this);
      const document = await originalMethod.call(this, data);
      if (!document && ignoreException !== true) {
        throw new NotFoundException(
          MongooseErrorMessage.modelNotFound(
            `${this.constructor.name}.${propertyKey}`,
            this.model.modelName,
          ),
        );
      }

      return document;
    };
  };
}
