import { NextRequest, NextResponse } from 'next/server';
import { callGenerateTypesenseQuery } from '@/genkit/searchProductFlow';
import { searchService } from '@/lib/search-service';

export async function POST(request: NextRequest) {
    try {
        const { query } = await request.json();

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Query es requerido y debe ser string' },
                { status: 400 }
            );
        }

        console.log('Natural language query:', query);

        // 1. Usar Genkit + Gemini para convertir lenguaje natural a consulta Typesense
        const { data: typesenseQuery, error: genkitError } = await callGenerateTypesenseQuery(query);

        if (genkitError || !typesenseQuery) {
            console.error('Error in Genkit:', genkitError);
            return NextResponse.json(
                { success: false, error: 'Error procesando consulta con IA' },
                { status: 500 }
            );
        }

        console.log('Generated Typesense query:', typesenseQuery);

        // Preparar los parámetros finales para Typesense
        const typesenseParams = {
            query: typesenseQuery.query || '*',
            query_by: 'name,categories',
            filter_by: typesenseQuery.filter_by,
            sort_by: typesenseQuery.sort_by,
            page: 1,
            per_page: 20
        };

        console.log('Typesense query parameters before cleaning:', typesenseParams);


        // Remover campos undefined/null para limpiar la query
        const cleanParams = Object.fromEntries(
            Object.entries(typesenseParams).filter(([, value]) => value !== undefined && value !== null)
        );

        console.log('\n🔥 === QUERY FINAL A TYPESENSE ===');
        console.log('🎯 Parámetros enviados a Typesense:', JSON.stringify(cleanParams, null, 2));
        console.log('📋 Campos incluidos:', Object.keys(cleanParams));
        console.log('=== FIN QUERY TYPESENSE ===\n');

        console.log('Executing search in Typesense...', cleanParams);

        // 2. Ejecutar la consulta en Typesense
        const searchResults = await searchService.searchProducts(cleanParams);

        console.log('\n✅ === RESPUESTA DE TYPESENSE ===');
        console.log('📊 Resultados encontrados:', searchResults.found || 0);
        console.log('⏱️ Tiempo de búsqueda:', (searchResults.search_time_ms || 0) + 'ms');
        console.log('📦 Productos retornados:', searchResults.hits?.length || 0);
        console.log('🏷️ Facets disponibles:', searchResults.facet_counts?.length || 0);
        console.log('=== FIN RESPUESTA TYPESENSE ===\n');

        return NextResponse.json({
            success: true,
            data: {
                original_query: query,
                typesense_query: typesenseQuery,
                results: searchResults
            }
        });

    } catch (error) {
        console.error('Error in AI search:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}