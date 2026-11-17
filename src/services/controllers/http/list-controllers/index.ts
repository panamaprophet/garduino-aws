import { defineHandler } from '@/lib/http';
import { listControllersByOwner } from '../../store/controllers';

export const handler = defineHandler((_event, { userId }) => listControllersByOwner(userId));
