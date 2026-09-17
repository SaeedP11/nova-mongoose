import { ClassConstructor, ClassTransformOptions } from 'class-transformer';
import { PaginateModel } from 'mongoose';
import { PopulateOptions } from './populate-options.type';

export type MongooseOptions<M, Dto> = {
  model: PaginateModel<M>;
  defaultDto: ClassConstructor<Dto>;
  defaultPopulate?: PopulateOptions;
  resourceProps?: string[];
  /**
   * Restricts what `simpleFilter` / `simpleSearch` may address. Defaults to
   * every path and virtual the schema declares, minus the props a client must
   * never query on (see `filterable-props.helper.ts`).
   */
  filterableProps?: string[];
  /**
   * How `@DocumentToDto` serialises. Defaults to
   * `DEFAULT_SERIALIZER_OPTIONS`; an app passes its own so the DTOs it
   * returns and the ones its pipes validate agree.
   */
  serializerOptions?: ClassTransformOptions;
};
