// Configuración de variables de entorno del cliente
export const clientEnv = {
    TYPESENSE_COLLECTION_NAME: process.env.TYPESENSE_COLLECTION_NAME || 'products',
    TYPESENSE_HOST: process.env.TYPESENSE_HOST || 'localhost',
    TYPESENSE_PORT: process.env.TYPESENSE_PORT || '8108',
    TYPESENSE_PROTOCOL: process.env.TYPESENSE_PROTOCOL || 'http',
    TYPESENSE_API_KEY: process.env.TYPESENSE_API_KEY || 'xyz',
};