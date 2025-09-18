'use client';

import { useState } from 'react';
import { IProduct } from '@/app/model/product.model';

interface AISearchResults {
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
}

interface AISearchResponse {
    original_query: string;
    typesense_query: {
        q?: string;
        query_by?: string;
        filter_by?: string;
        sort_by?: string;
        page?: number;
        per_page?: number;
    };
    results: AISearchResults;
}

interface UseAISearchResult {
    results: AISearchResponse | null;
    loading: boolean;
    error: string | null;
    aiSearch: (query: string) => Promise<void>;
    clearResults: () => void;
}

export function useAISearch(): UseAISearchResult {
    const [results, setResults] = useState<AISearchResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const aiSearch = async (query: string) => {
        if (!query.trim()) {
            setError('Por favor ingresa una búsqueda');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai-search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            const data = await response.json();

            if (data.success) {
                setResults(data.data);
            } else {
                setError(data.error || 'Error en la búsqueda con IA');
            }
        } catch (err) {
            setError('Error de conexión');
            console.error('Error in AI search:', err);
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
        aiSearch,
        clearResults
    };
}