// The public surface of the `nova-mongoose` package. App code imports from
// here rather than reaching into the folder.

// `PaginateModel` and `PaginateOptions` are imported from `mongoose`, but
// mongoose does not declare them — they come from `mongoose-paginate-v2`'s
// `declare module 'mongoose'` augmentation, and nothing here imports that
// package at runtime. Re-exporting its type below is what pulls the
// augmentation in: a `/// <reference types="…" />` does not survive into
// `dist/index.d.ts`, because tsc only emits directives the declaration output
// visibly depends on, but a type this file exports it does emit. Without it
// neither this build nor a consumer's typecheck can resolve those two types.
import type * as MongoosePaginate from 'mongoose-paginate-v2';

/** The `mongoose-paginate-v2` plugin, as registered by `connection.plugin()`. */
export type MongoosePaginatePlugin = typeof MongoosePaginate;

// Core
export * from './mongoose.service';
export * from './schema/base.schema';

// Module wiring
export * from './plugin/base-entity-indexes.plugin';

// Decorators
export { default as CatchDuplicateDocument } from './decorator/catch-duplicate-document.decorator';
export { default as CatchNotFoundDocument } from './decorator/catch-not-found-document.decorator';
export { default as DocumentToDto } from './decorator/document-to-dto.decorator';
export { default as FilterController } from './decorator/filter-controller.decorator';
export { default as ModifyArgument } from './decorator/modify-argument.decorator';
export { default as PopulateDocument } from './decorator/populate-document.decorator';
export { default as SaveDocument } from './decorator/save-document.decorator';
export { default as SimpleFilter } from './decorator/simple-filter.decorator';

// DTOs
export * from './dto/base-data.dto';
export * from './dto/filter-options.dto';
export * from './dto/pagination-options.dto';
export * from './dto/pagination.dto';
export * from './dto/resource-id.dto';
export * from './dto/simple-filter.dto';

// Enums
export * from './enum/mongoose-method.enum';
export * from './enum/simple-filter-operator.enum';

// Interfaces
export * from './interface/base-entity.interface';
export * from './interface/bulk-result.interface';
export * from './interface/data-base.interface';
export * from './interface/filter-options.interface';
export * from './interface/pagination-options.interface';
export * from './interface/pagination.interface';
export * from './interface/resource-id.interface';
export * from './interface/simple-filter.interface';

// Types
export * from './type/count-options.type';
export * from './type/create-many-options.type';
export * from './type/create-options.type';
export * from './type/delete-many-options.type';
export * from './type/delete-options.type';
export * from './type/find-all-options.type';
export * from './type/find-by-id-options.type';
export * from './type/find-options.type';
export * from './type/mongoose-common-options.type';
export * from './type/mongoose-options.type';
export * from './type/omit-create.type';
export * from './type/paginate-options.type';
export * from './type/pagination-sort.type';
export * from './type/populate-options.type';
export * from './type/restore-options.type';
export * from './type/scope-options.type';
export * from './type/simple-filter-options.type';
export * from './type/update-many-options.type';
export * from './type/update-options.type';

// Helpers and constants a consumer may legitimately need
export * from './constant/mongoose-error-message.const';
export * from './constant/serializer-options.const';
export * from './helper/pagination-sort.helper';
export * from './helper/resource-value.helper';
