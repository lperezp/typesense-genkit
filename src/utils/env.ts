import { z } from 'zod';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

const envSchema = z.object({
    TYPESENSE_COLLECTION_NAME: z.string(),
});

export const clientEnv = envSchema.parse({
    TYPESENSE_COLLECTION_NAME: process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME,
});
