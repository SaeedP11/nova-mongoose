import { ConflictException } from '@nestjs/common';
import { MongooseErrorMessage } from '../constant/mongoose-error-message.const';
import { assertMongooseService } from '../helper/assert-mongoose-service.helper';

const DUPLICATE_KEY_CODE = 11000;

export default function CatchDuplicateDocument() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (data) {
      assertMongooseService(this);
      try {
        return await originalMethod.call(this, data);
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw new ConflictException(
            MongooseErrorMessage.modelDuplicate(
              `${this.constructor.name}.${propertyKey}`,
              this.model.modelName,
            ),
          );
        }

        throw error;
      }
    };
  };
}

/**
 * A single write reports the code on the error itself, while `insertMany`
 * raises a bulk write error that carries it per failed document.
 */
function isDuplicateKeyError(error: unknown): boolean {
  const { code, writeErrors } = (error ?? {}) as {
    code?: number;
    writeErrors?: { code?: number; err?: { code?: number } }[];
  };

  if (code === DUPLICATE_KEY_CODE) return true;

  return (writeErrors ?? []).some(
    (writeError) =>
      writeError?.code === DUPLICATE_KEY_CODE ||
      writeError?.err?.code === DUPLICATE_KEY_CODE,
  );
}
