import { defineHandler } from '@/shared/http';
import { listControllersByOwner } from '../../entity/controller.api';

export const handler = defineHandler((_event, { userId }) => listControllersByOwner(userId));
