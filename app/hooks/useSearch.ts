'use client';

import { useState } from 'react';
import { IProduct } from '@/app/model/product.model';

interface SearchParams {
    query?: string;
    page?: number;
    per_page?: number;
    brand?: string;
    category?: string;
    department?: string;
    gender?: string;
    color?: string;
    size?: string;
    min_price?: number;
    max_price?: number;
}

interface SearchResults {
    hits: Array<{
        document: IProduct;
        highlight: Record<string, unknown>;
        text_match: number;
    }>;
    found: number;
    out_of: number;
    page: number;
    request_params: Record<string, unknown>;
    search_time_ms: number;
    facet_counts?: Array<{
        field_name: string;
        counts: Array<{ count: number; highlighted: string; value: string }>;
    }>;
}

interface UseSearchResult {
    results: SearchResults | null;
    loading: boolean;
    error: string | null;
    search: (params: SearchParams) => Promise<void>;
    clearResults: () => void;
}

export function useSearch(): UseSearchResult {
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = async (params: SearchParams) => {
        setLoading(true);
        setError(null);

        try {
            const searchParams = new URLSearchParams();

            if (params.query) searchParams.append('q', params.query);
            if (params.page) searchParams.append('page', params.page.toString());
            if (params.per_page) searchParams.append('per_page', params.per_page.toString());
            if (params.brand) searchParams.append('brand', params.brand);
            if (params.category) searchParams.append('category', params.category);
            if (params.department) searchParams.append('department', params.department);
            if (params.gender) searchParams.append('gender', params.gender);
            if (params.color) searchParams.append('color', params.color);
            if (params.size) searchParams.append('size', params.size);
            if (params.min_price) searchParams.append('min_price', params.min_price.toString());
            if (params.max_price) searchParams.append('max_price', params.max_price.toString());

            const response = await fetch(`/api/search?${searchParams.toString()}`);
            const data = await response.json();

            if (data.success) {
                setResults(data.data);
            } else {
                setError(data.error || 'Error en la búsqueda');
            }
        } catch (err) {
            setError('Error de conexión');
            console.error('Error searching:', err);
        } finally {
            setLoading(false);
        }
    };

    const clearResults = () => {
        setResults(null);
        setError(null);
    };

    return {
        results,
        loading,
        error,
        search,
        clearResults
    };
}

// Hook para obtener facets disponibles
export function useFacets() {
    const [facets, setFacets] = useState<SearchResults['facet_counts'] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFacets = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/facets');
            const data = await response.json();

            if (data.success) {
                setFacets(data.data);
            } else {
                setError(data.error || 'Error obteniendo filtros');
            }
        } catch (err) {
            setError('Error de conexión');
            console.error('Error fetching facets:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        facets,
        loading,
        error,
        fetchFacets
    };
}