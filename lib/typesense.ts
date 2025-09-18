import Typesense from 'typesense';

const client = new Typesense.Client({
    'nodes': [{
        'host': process.env.TYPESENSE_HOST || 'localhost',
        'port': parseInt(process.env.TYPESENSE_PORT || '8108'),
        'protocol': process.env.TYPESENSE_PROTOCOL || 'http'
    }],
    'apiKey': process.env.TYPESENSE_API_KEY || 'xyz',
    'connectionTimeoutSeconds': 2
});

export default client;

// Esquema de la colección de productos (basado en tu Typesense Cloud)
export const productsCollectionSchema = {
    name: 'products',
    fields: [
        { name: 'product_id', type: 'string' as const, facet: false, optional: true },
        { name: 'sku_id', type: 'string' as const, facet: false, optional: true },
        { name: 'name', type: 'string' as const, optional: true },
        { name: 'department_name', type: 'string' as const, facet: true, optional: true },
        { name: 'category_name', type: 'string' as const, facet: true, optional: true },
        { name: 'sub_category_name', type: 'string' as const, facet: true, optional: true },
        { name: 'brand_id', type: 'string' as const, facet: false, optional: true },
        { name: 'brand_name', type: 'string' as const, facet: true, optional: true },
        { name: 'link', type: 'string' as const, facet: false, optional: true },
        { name: 'image_url', type: 'string' as const, facet: false, optional: true },
        { name: 'stock', type: 'int32' as const, facet: false, sort: true, optional: true },
        { name: 'list_price', type: 'float' as const, facet: false, sort: true, optional: true },
        { name: 'price', type: 'float' as const, facet: false, sort: true, optional: false }, // Campo requerido
        { name: 'product_reference', type: 'string' as const, facet: false, optional: true },
        { name: 'sku_reference', type: 'string' as const, facet: false, optional: true },
        { name: 'specification_number', type: 'string' as const, facet: false, optional: true },
        { name: 'size', type: 'string' as const, facet: true, optional: true },
        { name: 'color', type: 'string' as const, facet: true, optional: true },
        { name: 'gender', type: 'string' as const, facet: true, optional: true }
    ],
    default_sorting_field: 'price' // Como en tu colección real
};