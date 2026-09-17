import { PopulateOptions as MongoosePopulateOptions } from 'mongoose';

export type PopulateOptions =
  string | MongoosePopulateOptions | (string | MongoosePopulateOptions)[];
