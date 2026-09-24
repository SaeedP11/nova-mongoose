## Nova Mongoose

The generic Mongoose data layer behind `nova-backend`: a `MongooseService` base class
with soft delete, populate, filtering, pagination and DTO serialization built in.

```bash
pnpm add nova-mongoose
```

Peer dependencies (`mongoose`, `mongoose-paginate-v2`, `@nestjs/common`,
`@nestjs/mongoose`, `class-transformer`, `class-validator`, `reflect-metadata`) must be
installed by the host app. They are peers rather than dependencies on purpose: a second
copy of `class-transformer` or `mongoose` in the process breaks `plainToInstance`,
decorator metadata and `instanceof`.

### Binding it to an app

`createBaseEntity` is a factory rather than a class because `@Prop` is evaluated at import
time, so a dynamic module's `forRoot` would always be too late to supply the owner ref.
Bind it once and export the result under a stable name:

```ts
export const BaseEntity = createBaseEntity<IUser>({ ownerRef: 'User' });
export type BaseEntity = InstanceType<typeof BaseEntity>;
```

Register `baseEntityIndexesPlugin` as a connection plugin alongside `mongoose-paginate-v2`:

```ts
connectionFactory: (connection) => {
  connection.plugin(mongoosePaginate);
  connection.plugin(baseEntityIndexesPlugin);
  return connection;
},
```

Then extend the service per entity:

```ts
export class AirportService extends MongooseService<
  Airport, AirportDto, IAirport, ICreateAirport
> {
  constructor(@InjectModel(Airport.name) model: PaginateModel<Airport>) {
    super({ model, defaultDto: AirportDto });
  }
}
```

### API

`create`, `createMany`, `find`, `findOne`, `findById`, `findAll`, `update`, `updateMany`,
`delete`, `deleteMany`, `restore`, `exists`, `count`, `paginate` — each takes a single
options object and is wrapped in a stack of method decorators:

- `ModifyArgument` — strips read-only fields from payloads and rewrites `{ id }` filter
  values into `{ _id: ObjectId }`.
- `SimpleFilter` — turns `simpleFilter` / `simpleSearch` into a Mongo `$and` / `$or`
  query. `field` is checked against an allowlist; an unknown field is a
  `BadRequestException`, not a silently empty result.
- `PopulateDocument` — applies `populate` (defaulting to `defaultPopulate`) and always
  appends `owner`. Pass `populate: false` to skip.
- `CatchNotFoundDocument` — `NotFoundException` on an empty result unless
  `ignoreException: true`.
- `CatchDuplicateDocument` — turns Mongo error 11000 into a `ConflictException`.
- `SaveDocument` — refuses to save a document without an `owner` unless
  `ignoreOwner: true`.
- `DocumentToDto` — `plainToInstance` into `defaultDto`, a custom class via `toDto`, or
  nothing when `toDto: false`.

Soft delete is the default everywhere: every read injects `isDeleted: false`, `delete()`
sets the flag, `force: true` does a real delete, `withDeleted: true` reads flagged rows
and `restore()` clears the flag.

A plain `{ unique: true }` index keeps holding a soft deleted document's value, so the
same value cannot be used again until the row is force deleted. Scope unique indexes to
the documents that are not deleted instead:

```ts
UserSchema.index(
  { phoneNumber: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
```

`restore()` then raises a `ConflictException` if a live document has since taken the
value. MongoDB before 5.0 refuses a second index on the same keys, so an existing plain
unique index has to be dropped before the scoped one can be built.

`update()` and `updateMany()` run the schema validators (`runValidators: true`) unless the
call passes `runValidators: false`, so an update cannot store what `create()` would have
refused.

`paginate()` parses `sort` (`-field` descending, `+field` ascending, `id` meaning `_id`)
and holds it to the same allowlist as `simpleFilter`: an unknown field, `owner` or
`isDeleted` is a `BadRequestException`. The default `-createdAt` and the `_id` tiebreaker
are always allowed, and `baseEntityIndexesPlugin` indexes exactly that order.

Controllers get `FilterController()`, `FilterOptionsDto`, `PaginationOptionsDto` and
`PaginationDto` for list endpoints.
