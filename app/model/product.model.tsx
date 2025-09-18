export interface IProduct {
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
    stock: number; // int32 en Typesense
    list_price: number; // float en Typesense
    price: number; // float en Typesense (campo requerido)
    product_reference: string;
    sku_reference: string;
    specification_number: string;
    size: string;
    color: string;
    gender: string;
}