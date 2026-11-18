import { defineHandler } from '@/shared/http';
import { listControllersByOwner } from '../../entity/controller.repository';

export const handler = defineHandler((_event, { userId }) => listControllersByOwner(userId));
