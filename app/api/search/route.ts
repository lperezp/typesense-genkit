import { NextRequest, NextResponse } from 'next/server';
import { searchService } from '@/lib/search-service';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q') || '*';
        const page = parseInt(searchParams.get('page') || '1');
        const per_page = parseInt(searchParams.get('per_page') || '12');

        // Parámetros de filtrado opcionales
        const filters = {
            brand: searchParams.get('brand') || undefined,
            category: searchParams.get('category') || undefined,
            department: searchParams.get('department') || undefined,
            gender: searchParams.get('gender') || undefined,
            color: searchParams.get('color') || undefined,
            size: searchParams.get('size') || undefined,
            min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
            max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
        };

        const searchResults = await searchService.searchProducts({
            query,
            page,
            per_page,
            filters
        });

        return NextResponse.json({
            success: true,
            data: searchResults,
            page,
            per_page,
            query
        });

    } catch (error) {
        console.error('Error en búsqueda de Typesense:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}