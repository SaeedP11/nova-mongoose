import { ClassTransformOptions } from 'class-transformer';

/**
 * What `@DocumentToDto` serialises with when a service does not pass its own.
 * `excludeExtraneousValues` is the load bearing one: without it a DTO would
 * carry every prop the document happens to hold.
 */
export const DEFAULT_SERIALIZER_OPTIONS: ClassTransformOptions = {
  strategy: 'exposeAll',
  excludeExtraneousValues: true,
  enableImplicitConversion: true,
  enableCircularCheck: true,
  exposeUnsetFields: false,
  exposeDefaultValues: false,
};
