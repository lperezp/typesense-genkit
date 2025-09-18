import { z } from 'genkit';

// Esquema para la respuesta de productos de Typesense
export const _ProductSchemaResponse = z.object({
    product_id: z.string(),
    sku_id: z.string(),
    name: z.string(),
    department_name: z.string(),
    category_name: z.string(),
    sub_category_name: z.string(),
    brand_id: z.string(),
    brand_name: z.string(),
    link: z.string(),
    image_url: z.string(),
    stock: z.number(),
    list_price: z.number(),
    price: z.number(),
    product_reference: z.string(),
    sku_reference: z.string(),
    specification_number: z.string(),
    size: z.string(),
    color: z.string(),
    gender: z.string(),
});

export type _ProductSchemaResponse = z.infer<typeof _ProductSchemaResponse>;

// Esquema para la consulta de Typesense que generará Gemini
export const TypesenseQuerySchema = z.object({
    q: z.string().optional().describe('Texto de búsqueda. Usar solo si filter_by no es suficiente'),
    query_by: z.string().optional().describe('Campos en los que buscar: name,brand_name,category_name,sub_category_name'),
    filter_by: z.string().optional().describe('Filtros de Typesense en formato: campo:valor && campo2:valor2'),
    sort_by: z.string().optional().describe('Ordenación en formato: campo:asc o campo:desc'),
    facet_by: z.string().optional().describe('Campos para facets separados por comas'),
    page: z.number().optional().describe('Número de página'),
    per_page: z.number().optional().describe('Elementos por página'),
});

export type TypesenseQuerySchema = z.infer<typeof TypesenseQuerySchema>;

// Esquema para describir campos de la colección
export const TypesenseFieldDescriptionSchema = z.record(z.string(), z.string());
export type TypesenseFieldDescriptionSchema = z.infer<typeof TypesenseFieldDescriptionSchema>;