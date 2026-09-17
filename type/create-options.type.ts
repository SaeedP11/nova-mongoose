export type CreateOptions<CreateInterface = Record<string, unknown>> = {
  data: CreateInterface;
  ignoreOwner?: boolean;
};
