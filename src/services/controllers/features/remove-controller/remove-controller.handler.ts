import { controllerParams, defineHandler, notFound } from '@/shared/http';
import { removeController } from '../../entity/controller.api';
import { deactivateCertificate, listThingCertificates } from '../../entity/thing.api';

export const handler = defineHandler({ params: controllerParams }, async ({ params: { controllerId } }) => {
    const certificates = await listThingCertificates(controllerId);
    const revokedCertificates = await Promise.all(certificates.map(deactivateCertificate));
    const controller = await removeController(controllerId) ?? notFound(`Controller "${controllerId}" not found`);

    const data = { controllerId, deletedAt: controller.deletedAt, revokedCertificates };

    return { data };
});
