import { NextResponse } from 'next/server';
import { searchService } from '@/lib/search-service';

export async function GET() {
    try {
        const facets = await searchService.getFacets();

        return NextResponse.json({
            success: true,
            data: facets
        });

    } catch (error) {
        console.error('Error obteniendo facets:', error);
        return NextResponse.json(
            { success: false, error: 'Error obteniendo facets' },
            { status: 500 }
        );
    }
}