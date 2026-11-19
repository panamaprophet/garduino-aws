import { randomUUID } from 'crypto';
import { defineHandler, getJsonBody, respond } from '@/shared/http';
import { createThing, issueCertificate } from '@/shared/iot';
import { parse } from '@/shared/validation';
import { createController, toControllerResponse } from '../../entity/controller.model';
import { saveController } from '../../entity/controller.api';
import { createControllerSchema } from './create-controller.schema';

export const handler = defineHandler(async (event, { userId }) => {
    const body = getJsonBody(event);
    const controllerId = randomUUID();

    const { name } = parse(createControllerSchema, body, 'Invalid controller');
    const thingName = await createThing(controllerId);
    const certificates = await issueCertificate(thingName, process.env.DEVICE_POLICY_NAME!);
    const created = createController(controllerId, userId, name);
    const controller = await saveController(created);

    const response = { ...toControllerResponse(controller), certificates };

    return respond(response, { statusCode: 201 });
});
