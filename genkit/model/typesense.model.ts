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
    link: z.string().url(),
    image_url: z.string().url(),
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
    query: z.string().describe('a full-text search query'),
    filter_by: z.string().describe('a filter query in Typesense format'),
    sort_by: z.string().describe('a sorting query in Typesense format'),
}).partial();

export type TypesenseQuerySchema = z.infer<typeof TypesenseQuerySchema>;

// Esquema para describir campos de la colección
export const TypesenseFieldDescriptionSchema = z.record(z.string(), z.string());
export type TypesenseFieldDescriptionSchema = z.infer<typeof TypesenseFieldDescriptionSchema>;