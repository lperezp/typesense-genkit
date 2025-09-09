import { z } from 'genkit';


// esquema del producto en Typesense/Firestore
export const ProductSchema = z.object({
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


// esquema de salida del modelo de consulta de Typesense
export const TypesenseQuerySchema = z
    .object({
        query: z.string().describe('a full-text search query'),
        filter_by: z.string().describe('a filter query in Typesense format'),
        sort_by: z.string().describe('a sorting query in Typesense format'),
    }).partial();

export type _ProductSchemaResponse = z.infer<typeof ProductSchema>;
export type _TypesenseQuery = z.infer<typeof TypesenseQuerySchema>;

export type TypesenseFieldDescriptionSchema = {
    [fieldName: string]: string;
};
