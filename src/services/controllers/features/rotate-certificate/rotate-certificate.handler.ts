import { defineHandler, getPathParameter } from '@/shared/http';
import { deactivateCertificate, issueCertificate, listThingCertificates } from '@/shared/iot';

export const handler = defineHandler(async (event) => {
    const controllerId = getPathParameter(event, 'controllerId');
    const previousCertificates = await listThingCertificates(controllerId);
    const certificates = await issueCertificate(controllerId, process.env.DEVICE_POLICY_NAME!);

    for (const certificateArn of previousCertificates) {
        await deactivateCertificate(certificateArn);
    }

    return { controllerId, certificates };
});
