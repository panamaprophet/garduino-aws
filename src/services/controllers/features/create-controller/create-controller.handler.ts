import { randomUUID } from 'crypto';
import { defineHandler } from '@/shared/http';
import { createController, toControllerResponse } from '../../entity/controller.model';
import { saveController } from '../../entity/controller.api';
import { createThing, issueCertificate } from '../../entity/thing.api';
import { createControllerSchema } from './create-controller.schema';

export const handler = defineHandler({ body: createControllerSchema }, async ({ userId, body }) => {
    const controllerId = randomUUID();

    const thingName = await createThing(controllerId);
    const certificates = await issueCertificate(thingName);
    const created = createController(controllerId, userId, body.name);
    const controller = await saveController(created);

    const data = { ...toControllerResponse(controller), certificates };

    return { data, status: 201 };
});
