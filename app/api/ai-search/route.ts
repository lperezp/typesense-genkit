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

        // 2. Ejecutar la consulta en Typesense
        const searchResults = await searchService.searchProducts({
            query: typesenseQuery.q || '*',
            page: typesenseQuery.page || 1,
            per_page: typesenseQuery.per_page || 20,
            // Agregar filtros si existen
            ...(typesenseQuery.filter_by && {
                // Aquí podrías parsear filter_by si necesitas filtros específicos
                // Por ahora mantenemos simple
            })
        });

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