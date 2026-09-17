import { MongooseService } from '../mongoose.service';
import { MongooseErrorMessage } from '../constant/mongoose-error-message.const';

export function assertMongooseService(
  value: any,
): asserts value is MongooseService {
  if (!(value instanceof MongooseService))
    throw new Error(MongooseErrorMessage.serviceInstance(MongooseService.name));
}
