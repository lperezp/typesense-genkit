import { googleAI } from '@genkit-ai/googleai';
import { genkit, GenkitError, z } from 'genkit';
import { Client } from 'typesense';
import { CollectionFieldSchema } from 'typesense/lib/Typesense/Collection';

// Configuración de Typesense
const client = new Client({
    nodes: [{
        host: process.env.TYPESENSE_HOST || 'localhost',
        port: parseInt(process.env.TYPESENSE_PORT || '8108'),
        protocol: process.env.TYPESENSE_PROTOCOL || 'http'
    }],
    apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
    connectionTimeoutSeconds: 2
});

const TYPESENSE_COLLECTION_NAME = process.env.TYPESENSE_COLLECTION_NAME || 'products';
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

// Esquema para la consulta de Typesense que generará Gemini
const TypesenseQuerySchema = z.object({
    q: z.string().optional().describe('Texto de búsqueda. Usar solo si filter_by no es suficiente'),
    query_by: z.string().optional().describe('Campos en los que buscar: name,brand_name,category_name,sub_category_name'),
    filter_by: z.string().optional().describe('Filtros de Typesense en formato: campo:valor && campo2:valor2'),
    sort_by: z.string().optional().describe('Ordenación en formato: campo:asc o campo:desc'),
    facet_by: z.string().optional().describe('Campos para facets separados por comas'),
    page: z.number().optional().describe('Número de página'),
    per_page: z.number().optional().describe('Elementos por página'),
});

export type TypesenseQuerySchema = z.infer<typeof TypesenseQuerySchema>;
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
        // Return a default schema if we can't get the collection properties
        return `|name|string|Yes|No||Product name|
|brand_name|string|Yes|No|PUMA,ADIDAS,NIKE,FILA|Brand name|
|category_name|string|Yes|No|Hombre,Mujer,Niños|Category|
|department_name|string|Yes|No|Moda,Deportes|Department|
|sub_category_name|string|Yes|No|Polos,Casacas,Zapatillas|Sub-category|
|color|string|Yes|No|Azul,Rojo,Verde,Negro,Blanco|Color|
|size|string|Yes|No|S,M,L,XL,XXL|Size|
|gender|string|Yes|No|Hombre,Mujer,Unisex|Gender|
|price|float|Yes|Yes||Product price|
|stock|int|Yes|No||Stock available|`;
    }
}

const getCachedCollectionProperties = async () => {
    if (cachedCollectionProperties === null) {
        cachedCollectionProperties = await getCollectionProperties();
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
            console.log('Calling ai.generate...');
            const { output } = await ai.generate({
                model: googleAI.model('gemini-1.5-flash'),
                system:
                    `You are helping a user search for clothing. Convert their query to the appropriate Typesense query format according to the instructions below.
                    
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
                    Provide the valid JSON with the correct filter and sorting format, only include fields with non-null values. Do not add extra text or explanations.`,
                prompt: `${query}`,
                output: { schema: TypesenseQuerySchema },
            });

            console.log('ai.generate completed successfully');
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
        console.log(flowResponse);
        return { data: flowResponse, error: null };
    } catch (error) {
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