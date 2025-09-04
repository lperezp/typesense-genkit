import { vertexAI } from '@genkit-ai/vertexai';
import { genkit, GenkitError, z } from 'genkit';
import { _ProductSchemaResponse, TypesenseFieldDescriptionSchema, TypesenseQuerySchema } from './model/typesense.model';
import { unstable_cache } from 'next/cache';
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

    collection.fields?.forEach((field) => {
        if (field.facet) {
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

    const facetableRows = facetableFields?.map(({ type, name, sort }, i) => {
        const counts = facetValues.facet_counts?.[i].counts;
        const exceedMaxNumValues =
            counts && counts?.length > MAX_FACET_VALUES
                ? 'There are more enum values for this field'
                : '';
        const enums = counts?.map((item) => item.value).join('; ');
        // prettier-ignore
        return `|${name}|${type}|Yes|${booleanToYesNo(sort)}|${enums}|${(collection.metadata as TypesenseFieldDescriptionSchema)?.[name] || ' '
            }${exceedMaxNumValues}|`;
    });
    return rows.concat(facetableRows).join('\n');
}

const getCachedCollectionProperties = unstable_cache(
    async () => await getCollectionProperties(),
    [],
    {
        tags: ['getCollectionProperties'],
        revalidate: false, // Since the Typesense data for this repo is from a static dataset, we will cache the response indefinitely.
        // Because of that, changes made to the collection (e.g. updating field metadata) won't get reflected. When developing, use `getCollectionProperties` instead.
    }
);


export const generateTypesenseQuery = ai.defineFlow(
    {
        name: 'generateTypesenseQuery',
        inputSchema: z.string(),
        outputSchema: TypesenseQuerySchema,
    },
    async (query) => {
        try {
            const { output } = await ai.generate({
                system:
                    `You are helping a user search for clothing. Convert their query to the appropriate Typesense query format according to the instructions below.
                    ### Typesense Query Syntax ###

                    ## Filtering ##

                    Matching values: {fieldName}: followed by a string value or an array of string values each separated by a comma. Enclose the string value with backticks if it contains parentheses \`()\`. Examples:
                    - Size:S
                    - BrandName:[TERRAIN,PUMA] returns products of the TERRAIN or PUMA brand.
                    - SubCategoryName:\`Casacas para Hombre\`
                    - SubCategoryName:\`Casacas para Hombre\`


                    Numeric Filters: Use :[min..max] for ranges, or comparison operators like :>, :<, :>=, :<=, :=. Examples:
                    - Price:[20..80]
                    - Price:>40
                    - Price:=250

                    Multiple Conditions: Separate conditions with &&. Examples:
                    - Price: >100 && BrandName: [TERRAIN,PUMA]
                    - Size:=S && Color:=Azul

                    OR Conditions Across Fields: Use || only for different fields. Examples:
                    - Size:S || Color:Azul
                    - (Size:S || Color:Azul) && Price:>40

                    Negation: Use :!= to exclude values. Examples:
                    - BrandName:!=TERRAIN
                    - BrandName:!=[TERRAIN,PUMA]
                    - SubCategoryName:!=\`Casacas para Hombre\`


                    If the same field is used for filtering multiple values in an || (OR) operation, then use the multi-value OR syntax. For eg:
                    \`BrandName:TERRAIN || BrandName:PUMA || BrandName:FILA\`
                    should be simplified as:
                    \`BrandName:[TERRAIN, PUMA, FILA]\`

                    ## Sorting ##

                    You can only sort maximum 3 sort fields at a time. The syntax is {fieldName}: follow by asc (ascending) or dsc (descending), if sort by multiple fields, separate them by a comma. Examples:
                    - Price:desc
                    - Price:asc,BrandName:desc

                    Sorting hints:
                    - When a user says something like "good price," sort by Price.

                    ## Product properties ##
                    The following are the product properties that you can use to filter and sort the data. Completely ignore the field names that are not in the list.
                    | ProductId | SkuId | Name | CategoryName | SubCategoryName | BrandName | Price | Size | Color |
                    |-----------|-------|------|--------------|-----------------|-----------|-------|------|-------|
                    ${await getCachedCollectionProperties()}

                    ### Query ###
                    Include query only if both filter_by and sort_by are inadequate. Don't include filter_by or sort_by in the ouput if their values are null.

                    ### Output Instructions ###
                    Provide the valid JSON with the correct filter and sorting format, only include fields with non-null values. Do not add extra text or explanations.`,
                prompt: `${query}`,
                output: { schema: TypesenseQuerySchema },
            });

            if (output !== null) return output;
        } catch (error) {
            console.log(error);
            throw new CustomGenkitGenerationError(
                (error as GenkitError).message || 'Error generating Typesense query!'
            );
        }
        throw new CustomGenkitGenerationError("Response doesn't satisfy schema.");
    }
);

class CustomGenkitGenerationError extends Error {
    constructor(message = '') {
        super(message);
        this.message = message;
    }
}
