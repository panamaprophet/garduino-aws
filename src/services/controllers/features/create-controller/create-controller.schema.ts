import { z } from 'zod';
import { controllerNameSchema } from '../../entity/controller.schema';

export const createControllerSchema = z.strictObject({
    name: controllerNameSchema,
});
