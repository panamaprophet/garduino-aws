import { controllerParams, defineHandler } from '@/shared/http';
import { deactivateCertificate, getEndpoint, issueCertificate, listThingCertificates } from '../../entity/thing.api';

export const handler = defineHandler({ params: controllerParams }, async ({ params: { controllerId } }) => {
    const previousCertificates = await listThingCertificates(controllerId);
    const certificates = await issueCertificate(controllerId);
    const revokedCertificates = await Promise.all(previousCertificates.map(deactivateCertificate));
    const endpoint = await getEndpoint();

    const data = { controllerId, certificates, endpoint, revokedCertificates };

    return { data };
});
