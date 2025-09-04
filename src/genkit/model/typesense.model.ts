import { z } from 'genkit';


// esquema del producto en Typesense/Firestore
export const ProductSchema = z.object({
    ProductId: z.string(),
    SkuId: z.string(),
    Name: z.string(),
    DepartmentName: z.string(),
    CategoryName: z.string(),
    SubCategoryName: z.string(),
    BrandId: z.string(),
    BrandName: z.string(),
    Link: z.string().url(),
    ImageUrl: z.string().url(),
    Stock: z.number(),
    ListPrice: z.number(),
    Price: z.number(),
    ProductReference: z.number(),
    SkuReference: z.number(),
    SpecificationNumber: z.number(),
    Size: z.string(),
    Color: z.string(),
    Gender: z.string(),
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
