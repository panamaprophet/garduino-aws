import { notFoundError } from '@/shared/errors';
import { defineHandler, getPathParameter } from '@/shared/http';
import { deactivateCertificate, listThingCertificates } from '@/shared/iot';
import { removeController } from '../../entity/controller.api';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');

    const certificates = await listThingCertificates(controllerId);
    const revokedCertificates = await Promise.all(certificates.map(deactivateCertificate));
    const controller = await removeController(controllerId);

    if (!controller) {
        throw notFoundError(`Controller "${controllerId}" not found`);
    }

    return { controllerId, deletedAt: controller.deletedAt, revokedCertificates };
});
