import { googleAI } from '@genkit-ai/googleai';
import { genkit, GenkitError, z } from 'genkit';
import { Client } from 'typesense';
import { CollectionFieldSchema } from 'typesense/lib/Typesense/Collection';
import { TypesenseQuerySchema } from './model/typesense.model';

// Configuración de Typesense
const client = new Client({
    nodes: [{
        host: `${process.env.TYPESENSE_HOST}`,
        port: parseInt(process.env.TYPESENSE_PORT || ''),
        protocol: `${process.env.TYPESENSE_PROTOCOL}`
    }],
    apiKey: `${process.env.TYPESENSE_API_KEY}`,
    connectionTimeoutSeconds: 2
});

const TYPESENSE_COLLECTION_NAME = `${process.env.TYPESENSE_COLLECTION_NAME}`;
const MAX_FACET_VALUES = Number(process.env.TYPESENSE_MAX_FACET_VALUES || '20');

// Función de utilidad
function booleanToYesNo(value: boolean | undefined): string {
    return value ? 'Yes' : 'No';
}

// Definición de tipos
type TypesenseFieldDescriptionSchema = Record<string, string>;

type _ProductSchemaResponse = {
    product_id: string;
    sku_id: string;
    name: string;
    department_name: string;
    category_name: string;
    sub_category_name: string;
    brand_id: string;
    brand_name: string;
    link: string;
    image_url: string;
    stock: number;
    list_price: number;
    price: number;
    product_reference: string;
    sku_reference: string;
    specification_number: string;
    size: string;
    color: string;
    gender: string;
};

const ai = genkit({
    plugins: [googleAI()],
});

let cachedCollectionProperties: string | null = null;

async function getCollectionProperties() {
    try {
        const collection = await client
            .collections(TYPESENSE_COLLECTION_NAME)
            .retrieve();

        const facetableFields: CollectionFieldSchema[] = [];
        const rows: string[] = [];
        console.log('Processing collection:', collection);

        collection.fields?.forEach((field: CollectionFieldSchema) => {
            console.log('Processing field:', field);

            if (field.facet) {
                // si tiene facet positivo, se agrega a facetableFields
                facetableFields.push(field);
            } else {
                const { name, type, sort } = field;
                rows.push(
                    // prettier-ignore
                    `|${name}|${type}|Yes|${booleanToYesNo(sort)}||${(collection.metadata as TypesenseFieldDescriptionSchema)?.[name] || ''}|`
                );
            }
        });

        const facetValues = await client
            .collections<_ProductSchemaResponse>(TYPESENSE_COLLECTION_NAME)
            .documents()
            .search({
                q: '*',
                facet_by: facetableFields?.map(({ name }) => name).join(','),
                max_facet_values: MAX_FACET_VALUES + 1, // plus 1 so we can check if any fields exceed the limit
            });

        console.log('Facet values retrieved:', facetValues);

        const facetableRows = facetableFields?.map(({ type, name, sort }, i) => {
            const counts = facetValues.facet_counts?.[i].counts;
            const exceedMaxNumValues =
                counts && counts?.length > MAX_FACET_VALUES
                    ? 'There are more enum values for this field'
                    : '';
            const enums = counts?.map((item: { value: string; count: number }) => item.value).join('; ');
            // prettier-ignore
            return `|${name}|${type}|Yes|${booleanToYesNo(sort)}|${enums}|${(collection.metadata as TypesenseFieldDescriptionSchema)?.[name] || 'null'}|${exceedMaxNumValues}|`;
        });

        return rows.concat(facetableRows).join('\n');
    } catch (error) {
        console.error('Error getting collection properties:', error);
        return ``;
    }
}

const getCachedCollectionProperties = async () => {
    if (cachedCollectionProperties === null) {
        cachedCollectionProperties = await getCollectionProperties();
        console.log('Cached collection properties:', cachedCollectionProperties);

    }
    return cachedCollectionProperties;
};

export const generateTypesenseQuery = ai.defineFlow(
    {
        name: 'generateTypesenseQuery',
        inputSchema: z.string(),
        outputSchema: TypesenseQuerySchema,
    },
    async (query) => {
        try {

            let collectionProperties;
            try {
                collectionProperties = await getCachedCollectionProperties();
            } catch (error) {
                throw new Error(`Failed to get collection properties: ${error instanceof Error ? error.message : String(error)}`);
            }

            console.log('Starting generateTypesenseQuery with query:', query);

            // Construir el system prompt
            const systemPrompt = `You are helping a user search for clothing. Convert their query to the appropriate Typesense query format according to the instructions below.
                    
                    ### Typesense Query Syntax ###

                    ## Filtering ##

                    Matching values: {fieldName}: followed by a string value or an array of string values each separated by a comma. Enclose the string value with backticks if it contains parentheses \`()\`. Examples:
                    - size:S
                    - brand_name:[TERRAIN,PUMA] returns products of the TERRAIN or PUMA brand.
                    - sub_category_name:\`Casacas para Hombre\`

                    Numeric Filters: Use :[min..max] for ranges, or comparison operators like :>, :<, :>=, :<=, :=. Examples:
                    - price:[20..80]
                    - price:>40
                    - price:=250

                    Multiple Conditions: Separate conditions with &&. Examples:
                    - price: >100 && brand_name: [TERRAIN,PUMA]
                    - size:=S && color:=Azul

                    OR Conditions Across Fields: Use || only for different fields. Examples:
                    - size:S || color:Azul
                    - (size:S || color:Azul) && price:>40

                    Negation: Use :!= to exclude values. Examples:
                    - brand_name:!=TERRAIN
                    - brand_name:!=[TERRAIN,PUMA]
                    - sub_category_name:!=\`Casacas para Hombre\`

                    If the same field is used for filtering multiple values in an || (OR) operation, then use the multi-value OR syntax. For eg:
                    \`brand_name:TERRAIN || brand_name:PUMA || brand_name:FILA\`
                    should be simplified as:
                    \`brand_name:[TERRAIN, PUMA, FILA]\`

                    ## Sorting ##

                    You can only sort maximum 3 sort fields at a time. The syntax is {fieldName}: follow by asc (ascending) or dsc (descending), if sort by multiple fields, separate them by a comma. Examples:
                    - price:desc
                    - price:asc,brand_name:desc

                    Sorting hints:
                    - When a user says something like "good price," sort by price.

                    ## Product properties ##
                    The following are the product properties that you can use to filter and sort the data. Completely ignore the field names that are not in the list.
                    | Name | Data Type | Filter | Sort | Enum Values | Description |
                    |------|-----------|--------|------|-------------|-------------|
                    ${collectionProperties}

                    ### Query ###
                    Include query only if both filter_by and sort_by are inadequate. Don't include filter_by or sort_by in the ouput if their values are null.

                    ### Output Instructions ###
                    Provide the valid JSON with the correct filter and sorting format, only include fields with non-null values. Do not add extra text or explanations.`;

            // Imprimir prompts en consola para debugging
            console.log('\n=== GENKIT AI PROMPT DEBUG ===');
            console.log('🔍 User Query:', query);
            console.log('\n📋 Collection Properties:');
            console.log(collectionProperties);
            console.log('\n🤖 System Prompt:');
            console.log(systemPrompt);
            console.log('\n💬 User Prompt:', query);
            console.log('=== END DEBUG ===\n');

            console.log('Calling ai.generate...');
            const { output } = await ai.generate({
                model: googleAI.model('gemini-1.5-flash'),
                system: systemPrompt,
                prompt: `${query}`,
                output: { schema: TypesenseQuerySchema },
            });

            console.log('ai.generate completed successfully');
            console.log('🎯 Generated Typesense Query:', JSON.stringify(output, null, 2));
            if (output !== null) return output;
        } catch (error) {
            console.error('Error details:', error);
            if (error instanceof GenkitError) {
                console.error('Genkit error message:', error.message);
                console.error('Genkit error details:', error);
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new CustomGenkitGenerationError(
                `Error generating Typesense query: ${errorMessage}`
            );
        }
        throw new CustomGenkitGenerationError("Response doesn't satisfy schema.");
    }
);

export async function callGenerateTypesenseQuery(query: string) {
    try {
        const flowResponse = await generateTypesenseQuery(query);

        // Log detallado de la respuesta del modelo
        console.log('\n🚀 === RESPUESTA DEL MODELO GEMINI ===');
        console.log('📥 Query original:', query);
        console.log('🤖 Respuesta de Gemini:', JSON.stringify(flowResponse, null, 2));
        console.log('📤 Enviando a Typesense:', flowResponse);
        console.log('=== FIN RESPUESTA MODELO ===\n');

        return { data: flowResponse, error: null };
    } catch (error) {
        console.error('❌ Error en callGenerateTypesenseQuery:', error);
        return {
            data: null,
            error: { message: (error as CustomGenkitGenerationError).message },
        };
    }
}

class CustomGenkitGenerationError extends Error {
    constructor(message = '') {
        super(message);
        this.message = message;
    }
}