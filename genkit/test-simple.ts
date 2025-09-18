import { googleAI } from '@genkit-ai/googleai';
import { genkit, z } from 'genkit';

// Test simple para verificar que Genkit funciona
const ai = genkit({
    plugins: [googleAI()],
});

const simpleSchema = z.object({
    q: z.string().optional(),
    filter_by: z.string().optional(),
});

export const testFlow = ai.defineFlow(
    {
        name: 'testFlow',
        inputSchema: z.string(),
        outputSchema: simpleSchema,
    },
    async (query) => {
        const { output } = await ai.generate({
            model: googleAI.model('gemini-1.5-flash'),
            system: 'Convierte consultas a formato JSON simple.',
            prompt: query,
            output: { schema: simpleSchema },
        });
        return output || { q: query };
    }
);