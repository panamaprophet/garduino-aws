import { randomUUID } from 'crypto';
import { defineHandler } from '@/shared/http';
import { createController, toControllerResponse } from '../../entity/controller.model';
import { controllerSchema } from '../../entity/controller.schema';
import { saveController } from '../../entity/controller.api';
import { createThing, getEndpoint, issueCertificate } from '../../entity/thing.api';

export const handler = defineHandler({ body: controllerSchema }, async ({ userId, body }) => {
    const controllerId = randomUUID();

    const thingName = await createThing(controllerId);
    const certificates = await issueCertificate(thingName);
    const endpoint = await getEndpoint();
    const created = createController(controllerId, userId, body.name);
    const controller = await saveController(created);

    const data = { ...toControllerResponse(controller), certificates, endpoint };

    return { data, status: 201 };
});
