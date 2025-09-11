import { vertexAI } from '@genkit-ai/vertexai';
import { genkit, GenkitError, z } from 'genkit';
import { _ProductSchemaResponse, TypesenseFieldDescriptionSchema, TypesenseQuerySchema } from './model/typesense.model';
import { typesense } from '@/lib/typesense';
import { clientEnv } from '@/utils/env';
import { CollectionFieldSchema } from 'typesense/lib/Typesense/Collection';
import { booleanToYesNo } from '@/utils/utils';

const ai = genkit({
    plugins: [vertexAI()],
});

const MAX_FACET_VALUES = Number(process.env.TYPESENSE_MAX_FACET_VALUES || '20');

async function getCollectionProperties() {
    const collection = await typesense({ isServer: true })
        .collections(clientEnv.TYPESENSE_COLLECTION_NAME)
        .retrieve();
    const facetableFields: CollectionFieldSchema[] = [];
    const rows: string[] = [];
    console.log('Processing collection:', collection);
    collection.fields?.forEach((field) => {
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

    const facetValues = await typesense()
        .collections<_ProductSchemaResponse>(clientEnv.TYPESENSE_COLLECTION_NAME)
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
        const enums = counts?.map((item) => item.value).join('; ');
        // prettier-ignore
        return `|${name}|${type}|Yes|${booleanToYesNo(sort)}|${enums}|${(collection.metadata as TypesenseFieldDescriptionSchema)?.[name] || 'null'}|${exceedMaxNumValues}|`;
    });
    return rows.concat(facetableRows).join('\n');
}

// Simple cache implementation since unstable_cache is not available in Genkit context
let cachedCollectionProperties: string | null = null;

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
            console.log('Starting generateTypesenseQuery with query:', query);

            let collectionProperties;
            try {
                collectionProperties = await getCachedCollectionProperties();
            } catch (error) {
                throw new Error(`Failed to get collection properties: ${error instanceof Error ? error.message : String(error)}`);
            }

            console.log('Calling ai.generate...');
            const { output } = await ai.generate({
                model: vertexAI.model('gemini-2.5-flash'),
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
