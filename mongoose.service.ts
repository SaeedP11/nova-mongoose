import { ClassConstructor, ClassTransformOptions } from 'class-transformer';
import { NotFoundException } from '@nestjs/common';
import {
  ClientSession,
  Document,
  PaginateModel,
  RootFilterQuery,
  Types,
} from 'mongoose';
import DocumentToDto from './decorator/document-to-dto.decorator';
import CatchNotFoundDocument from './decorator/catch-not-found-document.decorator';
import isClass from './helper/is-class.helper';
import { IBaseEntity } from './interface/base-entity.interface';
import { MongooseOptions } from './type/mongoose-options.type';
import { CreateOptions } from './type/create-options.type';
import { CreateManyOptions } from './type/create-many-options.type';
import { MongooseCommonOptions } from './type/mongoose-common-options.type';
import { FindOptions } from './type/find-options.type';
import { UpdateOptions } from './type/update-options.type';
import { UpdateManyOptions } from './type/update-many-options.type';
import { DeleteOptions } from './type/delete-options.type';
import { DeleteManyOptions } from './type/delete-many-options.type';
import { RestoreOptions } from './type/restore-options.type';
import { CountOptions } from './type/count-options.type';
import { ScopeOptions } from './type/scope-options.type';
import { BaseDataDto } from './dto/base-data.dto';
import { IDataBase } from './interface/data-base.interface';
import { MongooseErrorMessage } from './constant/mongoose-error-message.const';
import { FindByIdOptions } from './type/find-by-id-options.type';
import ModifyArgument from './decorator/modify-argument.decorator';
import CatchDuplicateDocument from './decorator/catch-duplicate-document.decorator';
import { PopulateOptions } from './type/populate-options.type';
import PopulateDocument from './decorator/populate-document.decorator';
import { FindAllOptions } from './type/find-all-options.type';
import { PaginateOptions } from './type/paginate-options.type';
import { IPagination } from './interface/pagination.interface';
import {
  IDeleteManyResult,
  IUpdateManyResult,
} from './interface/bulk-result.interface';
import SaveDocument from './decorator/save-document.decorator';
import SimpleFilter from './decorator/simple-filter.decorator';
import { resolveFilterableProps } from './helper/filterable-props.helper';
import { toSortObject } from './helper/pagination-sort.helper';
import { DEFAULT_SERIALIZER_OPTIONS } from './constant/serializer-options.const';

export class MongooseService<
  Entity extends IBaseEntity = IBaseEntity,
  DefaultDto extends BaseDataDto = BaseDataDto,
  DefaultInterface extends IDataBase = IDataBase,
  CreateInterface = unknown,
> {
  constructor({
    model,
    defaultDto,
    defaultPopulate,
    resourceProps,
    filterableProps,
    serializerOptions,
  }: MongooseOptions<Entity, DefaultDto>) {
    // Check defaultDto valid
    if (isClass(defaultDto)) {
      this.defaultDto = defaultDto;
    } else {
      throw new Error(
        MongooseErrorMessage.defaultDtoValidation(this.constructor.name),
      );
    }
    this.model = model;
    this.defaultPopulate = defaultPopulate;
    this.resourceProps = resourceProps;
    this.configuredFilterableProps = filterableProps;
    this.serializerOptions = serializerOptions ?? DEFAULT_SERIALIZER_OPTIONS;
  }

  public readonly model: PaginateModel<Entity>;
  public readonly defaultDto: ClassConstructor<DefaultDto>;
  public readonly defaultPopulate: PopulateOptions;
  public readonly resourceProps: string[];
  public readonly serializerOptions: ClassTransformOptions;

  private readonly configuredFilterableProps?: string[];
  private resolvedFilterableProps?: Set<string>;

  /**
   * Resolved on first use rather than in the constructor: discriminators are
   * attached to the model as their modules register, which can happen after
   * this service is instantiated.
   */
  public get filterableProps(): Set<string> {
    if (!this.resolvedFilterableProps) {
      this.resolvedFilterableProps = resolveFilterableProps(
        this.model,
        this.configuredFilterableProps,
      );
    }

    return this.resolvedFilterableProps;
  }

  /**
   * Every query is scoped to the documents that are not soft deleted unless
   * the caller explicitly asks for the deleted ones as well.
   */
  private scopeFilter<T>(
    filter: RootFilterQuery<T>,
    withDeleted?: boolean,
  ): RootFilterQuery<T> {
    return withDeleted ? { ...filter } : { ...filter, isDeleted: false };
  }

  private withSession<T>(options: T, session?: ClientSession): T {
    return (session ? { ...options, session } : options) as T;
  }

  async create({
    data,
  }: CreateOptions<CreateInterface> &
    MongooseCommonOptions<true>): Promise<DefaultInterface>;
  async create<CustomDto, CustomInterface>({
    data,
  }: CreateOptions<CreateInterface> &
    MongooseCommonOptions<
      ClassConstructor<CustomDto>
    >): Promise<CustomInterface>;
  async create({
    data,
  }: CreateOptions<CreateInterface> & MongooseCommonOptions<false>): Promise<
    Document<unknown, any, Entity>
  >;

  @DocumentToDto()
  @CatchDuplicateDocument()
  @PopulateDocument()
  @SaveDocument()
  @ModifyArgument()
  async create<ToDto = DefaultDto, ToInterface = DefaultInterface>({
    data,
  }: CreateOptions<CreateInterface> & MongooseCommonOptions<ToDto>): Promise<
    ToInterface | Document<unknown, any, Entity>
  > {
    return new this.model(data);
  }

  async createMany({
    data,
  }: CreateManyOptions<CreateInterface> & MongooseCommonOptions<true>): Promise<
    DefaultInterface[]
  >;
  async createMany<CustomDto, CustomInterface>({
    data,
  }: CreateManyOptions<CreateInterface> &
    MongooseCommonOptions<ClassConstructor<CustomDto>>): Promise<
    CustomInterface[]
  >;
  async createMany({
    data,
  }: CreateManyOptions<CreateInterface> &
    MongooseCommonOptions<false>): Promise<Document<unknown, any, Entity>[]>;

  /**
   * One round trip for the whole batch instead of a save per document, which
   * is what makes seeding thousands of rows practical. The payload rules are
   * the same as `create`: `ModifyArgument` has already stripped the read only
   * props and rewritten `{ id }` references on every item.
   */
  @DocumentToDto()
  @CatchDuplicateDocument()
  @PopulateDocument()
  @ModifyArgument()
  async createMany<ToDto = DefaultDto, ToInterface = DefaultInterface>({
    data,
    ignoreOwner,
    session,
  }: CreateManyOptions<CreateInterface> &
    MongooseCommonOptions<ToDto>): Promise<
    ToInterface[] | Document<unknown, any, Entity>[]
  > {
    if (!(data instanceof Array))
      throw new Error(
        MongooseErrorMessage.emptyBulkPayload(
          `${this.constructor.name}.createMany`,
        ),
      );

    if (!data.length) return [];

    if (
      ignoreOwner !== true &&
      data.some((item) => !(item as { owner?: unknown })?.owner)
    )
      throw new NotFoundException(
        MongooseErrorMessage.modelNotFound(
          `${this.constructor.name}.createMany`,
          'User',
          'owner user not found',
        ),
      );

    return await this.model.insertMany(data as any[], {
      ...(session && { session }),
    });
  }

  async find({
    filter,
    projection,
    options,
  }: FindOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<true>): Promise<DefaultInterface[]>;
  async find<CustomDto, CustomInterface>({
    filter,
    projection,
    options,
  }: FindOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<ClassConstructor<CustomDto>>): Promise<
    CustomInterface[]
  >;
  async find({
    filter,
    projection,
    options,
  }: FindOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<false>): Promise<Document<unknown, any, Entity>[]>;

  @DocumentToDto()
  @PopulateDocument()
  @SimpleFilter()
  @ModifyArgument()
  async find<ToDto = DefaultDto, ToInterface = DefaultInterface>({
    filter,
    projection,
    options,
    withDeleted,
    session,
  }: FindOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<ToDto>): Promise<
    ToInterface[] | Document<unknown, any, Entity>[]
  > {
    return await this.model
      .find(
        this.scopeFilter(filter, withDeleted),
        projection,
        this.withSession(options, session),
      )
      .exec();
  }

  async update({
    filter,
    update,
    options,
  }: UpdateOptions<Entity> &
    MongooseCommonOptions<true, false>): Promise<DefaultInterface>;
  async update({
    filter,
    update,
    options,
  }: UpdateOptions<Entity> &
    MongooseCommonOptions<true, true>): Promise<DefaultInterface | null>;
  async update<CustomDto, CustomInterface>({
    filter,
    update,
    options,
  }: UpdateOptions<Entity> &
    MongooseCommonOptions<
      ClassConstructor<CustomDto>,
      false
    >): Promise<CustomInterface>;
  async update<CustomDto, CustomInterface>({
    filter,
    update,
    options,
  }: UpdateOptions<Entity> &
    MongooseCommonOptions<
      ClassConstructor<CustomDto>,
      true
    >): Promise<CustomInterface | null>;
  async update({
    filter,
    update,
    options,
  }: UpdateOptions<Entity> & MongooseCommonOptions<false, false>): Promise<
    Document<unknown, any, Entity>
  >;
  async update({
    filter,
    update,
    options,
  }: UpdateOptions<Entity> &
    MongooseCommonOptions<false, true>): Promise<Document<
    unknown,
    any,
    Entity
  > | null>;

  @DocumentToDto()
  @PopulateDocument()
  @CatchDuplicateDocument()
  @CatchNotFoundDocument()
  @ModifyArgument()
  async update<
    ToDto = DefaultDto,
    ToInterface = DefaultInterface,
    IgnoreException = false,
  >({
    filter,
    update,
    options,
    withDeleted,
    session,
  }: UpdateOptions<Entity> &
    MongooseCommonOptions<ToDto, IgnoreException>): Promise<
    ToInterface | Document<unknown, any, Entity> | null
  > {
    return await this.model.findOneAndUpdate(
      this.scopeFilter(filter, withDeleted),
      update,
      this.withSession(
        {
          ...options,
          new: options?.new ?? true,
        },
        session,
      ),
    );
  }

  /**
   * Updates every match in one round trip and reports the counts rather than
   * the documents, so nothing is hydrated, populated or serialised.
   */
  @ModifyArgument()
  async updateMany({
    filter,
    update,
    options,
    withDeleted,
    session,
  }: UpdateManyOptions<Entity> & ScopeOptions): Promise<IUpdateManyResult> {
    const result = await this.model.updateMany(
      this.scopeFilter(filter, withDeleted),
      update,
      this.withSession(options ?? {}, session),
    );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  async delete({
    filter,
    options,
    force,
  }: DeleteOptions<Entity> &
    MongooseCommonOptions<true, false>): Promise<DefaultInterface>;

  async delete({
    filter,
    options,
    force,
  }: DeleteOptions<Entity> &
    MongooseCommonOptions<true, true>): Promise<DefaultInterface | null>;
  async delete<CustomDto, CustomInterface>({
    filter,
    options,
    force,
  }: DeleteOptions<Entity> &
    MongooseCommonOptions<
      ClassConstructor<CustomDto>,
      false
    >): Promise<CustomInterface>;
  async delete<CustomDto, CustomInterface>({
    filter,
    options,
    force,
  }: DeleteOptions<Entity> &
    MongooseCommonOptions<
      ClassConstructor<CustomDto>,
      true
    >): Promise<CustomInterface | null>;
  async delete({
    filter,
    options,
    force,
  }: DeleteOptions<Entity> & MongooseCommonOptions<false, false>): Promise<
    Document<unknown, any, Entity>
  >;
  async delete({
    filter,
    options,
    force,
  }: DeleteOptions<Entity> &
    MongooseCommonOptions<false, true>): Promise<Document<
    unknown,
    any,
    Entity
  > | null>;

  @DocumentToDto()
  @PopulateDocument()
  @CatchNotFoundDocument()
  @ModifyArgument()
  async delete<
    ToDto = DefaultDto,
    ToInterface = DefaultInterface,
    IgnoreException = false,
  >({
    filter,
    options,
    force = false,
    withDeleted,
    session,
  }: DeleteOptions<Entity> &
    MongooseCommonOptions<ToDto, IgnoreException>): Promise<
    ToInterface | Document<unknown, any, Entity> | null
  > {
    return force
      ? await this.model.findOneAndDelete(
          filter,
          this.withSession(options ?? {}, session),
        )
      : await this.model.findOneAndUpdate(
          this.scopeFilter(filter, withDeleted),
          {
            isDeleted: true,
          },
          this.withSession(
            {
              ...options,
              new: options?.new ?? true,
            },
            session,
          ),
        );
  }

  /**
   * Deletes every match in one round trip. A recursive or cascading delete
   * that walks documents one at a time costs a query per document.
   */
  @ModifyArgument()
  async deleteMany({
    filter,
    options,
    force = false,
    withDeleted,
    session,
  }: DeleteManyOptions<Entity> & ScopeOptions): Promise<IDeleteManyResult> {
    if (force) {
      const result = await this.model.deleteMany(
        filter,
        this.withSession(options ?? {}, session),
      );

      return { deletedCount: result.deletedCount };
    }

    const result = await this.model.updateMany(
      this.scopeFilter(filter, withDeleted),
      { isDeleted: true },
      this.withSession(options ?? {}, session),
    );

    return { deletedCount: result.modifiedCount };
  }

  async restore({
    filter,
    options,
  }: RestoreOptions<Entity> &
    MongooseCommonOptions<true, false>): Promise<DefaultInterface>;
  async restore({
    filter,
    options,
  }: RestoreOptions<Entity> &
    MongooseCommonOptions<true, true>): Promise<DefaultInterface | null>;
  async restore<CustomDto, CustomInterface>({
    filter,
    options,
  }: RestoreOptions<Entity> &
    MongooseCommonOptions<
      ClassConstructor<CustomDto>,
      false
    >): Promise<CustomInterface>;
  async restore({
    filter,
    options,
  }: RestoreOptions<Entity> & MongooseCommonOptions<false, false>): Promise<
    Document<unknown, any, Entity>
  >;

  /**
   * The counterpart of a soft `delete`. It only ever matches a document that
   * is currently flagged, so restoring twice is a miss rather than a no-op
   * that pretends to have done something.
   */
  @DocumentToDto()
  @PopulateDocument()
  @CatchNotFoundDocument()
  @ModifyArgument()
  async restore<
    ToDto = DefaultDto,
    ToInterface = DefaultInterface,
    IgnoreException = false,
  >({
    filter,
    options,
    session,
  }: RestoreOptions<Entity> &
    MongooseCommonOptions<ToDto, IgnoreException>): Promise<
    ToInterface | Document<unknown, any, Entity> | null
  > {
    return await this.model.findOneAndUpdate(
      { ...filter, isDeleted: true },
      { isDeleted: false },
      this.withSession(
        {
          ...options,
          new: options?.new ?? true,
        },
        session,
      ),
    );
  }

  async findById({
    id,
    projection,
    options,
  }: FindByIdOptions<Entity> &
    MongooseCommonOptions<true, false>): Promise<DefaultInterface>;
  async findById({
    id,
    projection,
    options,
  }: FindByIdOptions<Entity> &
    MongooseCommonOptions<true, true>): Promise<DefaultInterface | null>;
  async findById<CustomDto, CustomInterface>({
    id,
    projection,
    options,
  }: FindByIdOptions<Entity> &
    MongooseCommonOptions<
      ClassConstructor<CustomDto>,
      false
    >): Promise<CustomInterface>;
  async findById<CustomDto, CustomInterface>({
    id,
    projection,
    options,
  }: FindByIdOptions<Entity> &
    MongooseCommonOptions<
      ClassConstructor<CustomDto>,
      true
    >): Promise<CustomInterface | null>;
  async findById({
    id,
    projection,
    options,
  }: FindByIdOptions<Entity> & MongooseCommonOptions<false, false>): Promise<
    Document<unknown, any, Entity>
  >;
  async findById({
    id,
    projection,
    options,
  }: FindByIdOptions<Entity> &
    MongooseCommonOptions<false, true>): Promise<Document<
    unknown,
    any,
    Entity
  > | null>;

  @DocumentToDto()
  @PopulateDocument()
  @CatchNotFoundDocument()
  async findById<
    ToDto = DefaultDto,
    ToInterface = DefaultInterface,
    IgnoreException = false,
  >({
    id,
    projection,
    options,
    withDeleted,
    session,
  }: FindByIdOptions<Entity> &
    MongooseCommonOptions<ToDto, IgnoreException>): Promise<
    ToInterface | Document<unknown, any, Entity> | null
  > {
    // A miss and a malformed id are the same answer to the caller, and casting
    // an invalid id would throw instead
    if (!Types.ObjectId.isValid(id)) return null;

    return await this.model
      .findOne(
        this.scopeFilter({ _id: id }, withDeleted),
        projection,
        this.withSession(options, session),
      )
      .exec();
  }

  async findAll({
    projection,
    options,
  }: FindAllOptions<Entity> & MongooseCommonOptions<true>): Promise<
    DefaultInterface[]
  >;
  async findAll<CustomDto, CustomInterface>({
    projection,
    options,
  }: FindAllOptions<Entity> &
    MongooseCommonOptions<ClassConstructor<CustomDto>>): Promise<
    CustomInterface[]
  >;
  async findAll({
    projection,
    options,
  }: FindAllOptions<Entity> & MongooseCommonOptions<false>): Promise<
    Document<unknown, any, Entity>[]
  >;

  @DocumentToDto()
  @PopulateDocument()
  async findAll<ToDto = DefaultDto, ToInterface = DefaultInterface>({
    projection,
    options,
    withDeleted,
    session,
  }: FindAllOptions<Entity> & MongooseCommonOptions<ToDto> = {}): Promise<
    ToInterface[] | Document<unknown, any, Entity>[]
  > {
    return await this.model
      .find(
        this.scopeFilter({}, withDeleted),
        projection,
        this.withSession(options, session),
      )
      .exec();
  }

  async findOne({
    filter,
    projection,
    options,
  }: FindOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<true, false>): Promise<DefaultInterface>;
  async findOne({
    filter,
    projection,
    options,
  }: FindOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<true, true>): Promise<DefaultInterface | null>;
  async findOne<CustomDto, CustomInterface>({
    filter,
    projection,
    options,
  }: FindOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<
      ClassConstructor<CustomDto>,
      false
    >): Promise<CustomInterface>;
  async findOne<CustomDto, CustomInterface>({
    filter,
    projection,
    options,
  }: FindOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<
      ClassConstructor<CustomDto>,
      true
    >): Promise<CustomInterface | null>;
  async findOne({
    filter,
    projection,
    options,
  }: FindOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<false, false>): Promise<
    Document<unknown, any, Entity>
  >;
  async findOne({
    filter,
    projection,
    options,
  }: FindOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<false, true>): Promise<Document<
    unknown,
    any,
    Entity
  > | null>;

  @DocumentToDto()
  @PopulateDocument()
  @CatchNotFoundDocument()
  @SimpleFilter()
  @ModifyArgument()
  async findOne<
    ToDto = DefaultDto,
    ToInterface = DefaultInterface,
    IgnoreException = false,
  >({
    filter,
    projection,
    options,
    withDeleted,
    session,
  }: FindOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<ToDto, IgnoreException>): Promise<
    ToInterface | Document<unknown, any, Entity> | null
  > {
    return await this.model
      .findOne(
        this.scopeFilter(filter, withDeleted),
        projection,
        this.withSession(options, session),
      )
      .exec();
  }

  /**
   * Answers "is there one" without hydrating, populating or serialising
   * anything — the whole point of the existence checks that `_create` and
   * `checkData` style validation run before every write.
   */
  @SimpleFilter()
  @ModifyArgument()
  async exists({
    filter,
    withDeleted,
    session,
  }: CountOptions<Entity, DefaultInterface> & ScopeOptions): Promise<boolean> {
    const result = await this.model
      .exists(this.scopeFilter(filter, withDeleted))
      .session(session ?? null)
      .exec();

    return !!result;
  }

  @SimpleFilter()
  @ModifyArgument()
  async count({
    filter,
    withDeleted,
    session,
  }: CountOptions<Entity, DefaultInterface> & ScopeOptions): Promise<number> {
    return await this.model
      .countDocuments(this.scopeFilter(filter, withDeleted))
      .session(session ?? null)
      .exec();
  }

  async paginate({
    filter,
    projection,
    options,
  }: PaginateOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<true>): Promise<IPagination<DefaultInterface>>;
  async paginate<CustomDto, CustomInterface>({
    filter,
    projection,
    options,
  }: PaginateOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<ClassConstructor<CustomDto>>): Promise<
    IPagination<CustomInterface>
  >;
  async paginate({
    filter,
    projection,
    options,
  }: PaginateOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<false>): Promise<
    IPagination<Document<unknown, any, Entity>>
  >;

  @DocumentToDto()
  @PopulateDocument()
  @SimpleFilter()
  @ModifyArgument()
  async paginate<ToDto = DefaultDto, ToInterface = DefaultInterface>({
    filter,
    projection,
    options,
    sort,
    page,
    limit,
    withDeleted,
    session,
  }: PaginateOptions<Entity, DefaultInterface> &
    MongooseCommonOptions<ToDto>): Promise<
    IPagination<ToInterface> | IPagination<Document<unknown, any, Entity>>
  > {
    const result = await this.model.paginate(
      this.scopeFilter(filter, withDeleted),
      {
        ...options,
        // `sort` is parsed here rather than handed to mongoose as a string:
        // mongoose only understands a `-` prefix, and paging needs a total
        // order to not repeat or skip documents between pages
        sort: toSortObject(sort),
        page,
        limit,
        projection,
        ...(session && { session }),
      },
    );

    return {
      totalItems: result.totalDocs,
      items: result.docs,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
    };
  }
}
