import { z } from 'zod';

export const eventSchema = z.record(z.string(), z.unknown());
