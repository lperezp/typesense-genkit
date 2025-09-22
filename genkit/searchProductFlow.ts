import { vertexAI } from '@genkit-ai/google-genai';
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
    plugins: [vertexAI()],
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
                collectionProperties = await getCollectionProperties();
            } catch (error) {
                throw new Error(`Failed to get collection properties: ${error instanceof Error ? error.message : String(error)}`);
            }

            console.log('Starting generateTypesenseQuery with query:', query);

            // Construir el system prompt
            const systemPrompt = `Estás ayudando a un usuario a buscar ropa. Convierte su consulta al formato de consulta Typesense adecuado según las instrucciones a continuación.
            El usuario siempre te hablará en español. Además, toda la información del producto está en español. Por lo tanto, debes devolver todas las referencias en español, pero siguiendo las reglas de búsqueda.

            ### Sintaxis de consulta Typesense ###

            ## Filtrado ##

            Valores coincidentes: {fieldName}: seguido de una cadena o un array de cadenas, cada una separada por una coma. Encierra la cadena entre comillas invertidas si contiene paréntesis \`()\`. Ejemplos:
            - size:S
            - brand_name:[TERRAIN,PUMA] devuelve productos de la marca TERRAIN o PUMA.
            - sub_category_name:\`Polos para Hombre\`

            Filtros numéricos: Usa :[min..max] para rangos u operadores de comparación como :>, :<, :>=, :<=, :=. Ejemplos:
            - precio:[20..80]
            - precio:>40
            - precio:=250

            Condiciones múltiples: Separe las condiciones con &&. Ejemplos:
            - precio: >100 && marca: [TERRAIN,PUMA]
            - talla:=S && color:=Azul

            Condiciones OR entre campos: Use || solo para campos diferentes. Ejemplos:
            - talla:S || color:Azul
            - (talla:S || color:Azul) && precio:>40

            Negación: Use :!= para excluir valores. Ejemplos:
            - marca:!=TERRAIN
            - marca:!=[TERRAIN,PUMA]
            - subcategoría:!=\`Casacas para Hombre\`

            Si se usa el mismo campo para filtrar varios valores en una operación || (OR), use la sintaxis OR multivalor. Por ejemplo:
            \`marca:TERRAIN || brand_name:PUMA || brand_name:FILA\`
            Debe simplificarse como:
            \`brand_name:[TERRAIN, PUMA, FILA]\`

            EJEMPLOS: 
            - "polos rojos PUMA" → {"query": "polos", "filter_by": "color:Rojo && brand_name:PUMA"} 
            - "zapatillas baratas" → {"query": "zapatillas", "sort_by": "price:asc"} 
            - "casacas mujer talla M" → {"query": "casacas", "filter_by": "gender:Mujer && size:M"} 
            - "polos de hombre" → {"query": "polos", "filter_by": "gender:Hombre && sub_category_name:\"Polos\""} 
            - "pantalones de mujer talla L color azul" → {"query": "pantalones", "filter_by": "gender:Mujer && size:L && color:Azul"} 
            - "productos azules" → {"query": "productos", "filter_by": "color:Azul"} 
            - "mostrar todo" → {"consulta": "*"} 
            - "polos rojos o azules" → {"filter_by": "color:[Rojo,Azul]"} 
            - "polos Nike que no sean negras" → {"filter_by": "brand_name:Nike && color:!=Negro"} 

            ## Clasificación ## 

            Sólo puede ordenar un máximo de 3 campos de clasificación a la vez. La sintaxis es {fieldName}: siga por asc (ascendente) o dsc (descendente), si ordena por varios campos, sepárelos con una coma. Ejemplos:
            - precio:desc
            - precio:asc

            Consejos de ordenación:
            - Cuando un usuario dice algo como "buen precio", ordene por precio.

            ## Propiedades del producto ##
            Las siguientes son las propiedades del producto que puede usar para filtrar y ordenar los datos. Ignore por completo los nombres de campo que no estén en la lista.
            | Nombre | Tipo de dato | Filtro | Ordenar | Valores de enumeración | Descripción |
            |------|-----------|--------|------|-------------|-------------|
            ${collectionProperties}

            ### Consulta ###
            Incluya la consulta solo si tanto filter_by como sort_by son adecuados. No incluya filter_by ni sort_by en la salida si sus valores son nulos.

            ### Instrucciones de salida ###
            Proporcione el JSON válido con el filtro y el formato de ordenación correctos. Incluya solo los campos con valores no nulos. No añada texto adicional ni explicaciones.`;

            // Imprimir prompts en consola para debugging
            console.log('\n=== GENKIT AI PROMPT DEBUG ===');
            console.log('🔍 User Query:', query);
            console.log('\n📋 Collection Properties:');
            // console.log(collectionProperties);
            console.log('\n🤖 System Prompt:');
            console.log(systemPrompt);
            console.log('\n💬 User Prompt:', query);
            console.log('=== END DEBUG ===\n');

            console.log('Calling ai.generate...');
            const { output } = await ai.generate({
                model: vertexAI.model('gemini-2.5-flash'),
                system: systemPrompt,
                prompt: `${query}`,
            });

            // console.log('ai.generate completed successfully');
            // console.log('🤖 AI Output:', JSON.stringify(output.text()));

            // console.log('🎯 Generated Typesense Query:', JSON.stringify(output));
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