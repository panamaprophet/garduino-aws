import { z } from 'zod';
import { controllerNameSchema } from '../../entity/controller.schema';

export const updateControllerSchema = z.strictObject({
    name: controllerNameSchema,
});
