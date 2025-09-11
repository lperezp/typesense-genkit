import { generateTypesenseQuery } from '@/genkit/searchProductFlow';
import { appRoute } from '@genkit-ai/next';

export const POST = appRoute(generateTypesenseQuery);