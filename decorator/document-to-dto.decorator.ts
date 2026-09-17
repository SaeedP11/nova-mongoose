import {
  ClassConstructor,
  ClassTransformOptions,
  plainToInstance,
} from 'class-transformer';
import isClass from '../helper/is-class.helper';
import { MongooseErrorMessage } from '../constant/mongoose-error-message.const';
import { assertMongooseService } from '../helper/assert-mongoose-service.helper';
import { isPaginationResult } from '../helper/is-pagination-result.helper';

export default function DocumentToDto() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function ({ toDto, ...data }) {
      assertMongooseService(this);
      if (![true, false, undefined].includes(toDto) && !isClass(toDto)) {
        throw new Error(
          MongooseErrorMessage.toDtoValidation(
            `${this.constructor.name}.${propertyKey}`,
          ),
        );
      }

      const result = await originalMethod.call(this, data);
      // toDto === false returns the raw mongoose document
      if (!result || toDto === false) return result;

      const dto = isClass(toDto) ? toDto : this.defaultDto;
      const options = this.serializerOptions;

      if (result instanceof Array) return toInstances(dto, result, options);

      if (isPaginationResult(result))
        return { ...result, items: toInstances(dto, result.items, options) };

      return plainToInstance(dto, toPlainObject(result), options);
    };
  };
}

function toInstances(
  dto: ClassConstructor<unknown>,
  documents: unknown[],
  options: ClassTransformOptions,
) {
  return plainToInstance(dto, documents.map(toPlainObject), options);
}

function toPlainObject(document: any) {
  return typeof document?.toObject === 'function'
    ? document.toObject()
    : document;
}
