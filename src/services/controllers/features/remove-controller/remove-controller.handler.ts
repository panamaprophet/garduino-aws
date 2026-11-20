import { controllerParams, defineHandler, notFound } from '@/shared/http';
import { removeController } from '../../entity/controller.api';
import { toControllerResponse } from '../../entity/controller.model';
import { deactivateCertificate, listThingCertificates } from '../../entity/thing.api';

const schema = { params: controllerParams };

export const handler = defineHandler(schema, async ({ params: { controllerId } }) => {
    const certificates = await listThingCertificates(controllerId);
    const revokedCertificates = await Promise.all(certificates.map(deactivateCertificate));
    const controller = (await removeController(controllerId)) ?? notFound(`Controller "${controllerId}" not found`);

    const data = { ...toControllerResponse(controller), revokedCertificates };

    return { data };
});
