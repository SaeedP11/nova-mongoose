export type CreateManyOptions<CreateInterface = Record<string, unknown>> = {
  data: CreateInterface[];
  ignoreOwner?: boolean;
};
