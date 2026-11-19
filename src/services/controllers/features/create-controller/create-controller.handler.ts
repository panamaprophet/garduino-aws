import { randomUUID } from 'crypto';
import { defineHandler, getJsonBody, respond } from '@/shared/http';
import { createThing, issueCertificate } from '@/shared/iot';
import { parse } from '@/shared/validation';
import { createController, toControllerResponse } from '../../entity/controller.model';
import { saveController } from '../../entity/controller.api';
import { createControllerSchema } from './create-controller.schema';

export const handler = defineHandler(async (event, { userId }) => {
    const { name } = parse(createControllerSchema, getJsonBody(event), 'Invalid controller');
    const controllerId = randomUUID();

    await createThing(controllerId);

    const certificates = await issueCertificate(controllerId, process.env.DEVICE_POLICY_NAME!);
    const controller = await saveController(createController(controllerId, userId, name));

    return respond({ ...toControllerResponse(controller), certificates }, { statusCode: 201 });
});
