import { NextResponse } from 'next/server';
import client from '@/lib/typesense';

export async function GET() {
    try {
        // Verificar conexión y obtener información de la colección
        const collection = await client.collections('products').retrieve();

        // Hacer una búsqueda simple de prueba
        const testSearch = await client.collections('products').documents().search({
            q: '*',
            per_page: 1
        });

        return NextResponse.json({
            success: true,
            collection_info: {
                name: collection.name,
                num_documents: collection.num_documents,
                default_sorting_field: collection.default_sorting_field
            },
            sample_search: {
                found: testSearch.found,
                search_time_ms: testSearch.search_time_ms,
                sample_document: testSearch.hits?.[0]?.document || null
            },
            message: 'Conexión exitosa con Typesense Cloud'
        });

    } catch (error) {
        console.error('Error conectando con Typesense:', error);
        return NextResponse.json({
            success: false,
            error: 'Error conectando con Typesense Cloud',
            details: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
}