'use client';

import { useState } from 'react';
import { useAISearch } from '@/app/hooks/useAISearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function SearchComponent() {
    const { results, loading, error, aiSearch } = useAISearch();
    const [searchQuery, setSearchQuery] = useState('');
    const [showGeminiResponse] = useState(true);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        await aiSearch(searchQuery);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="w-full">
            {/* Barra de búsqueda simple */}
            <div className="mb-6">
                <div className="flex gap-2 max-w-2xl mx-auto">
                    <Input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                    />
                    <Button onClick={() => handleSearch()} disabled={loading}>
                        {loading ? 'Buscando...' : 'Buscar'}
                    </Button>
                </div>
            </div>

            {results &&
                <>
                    {showGeminiResponse && (
                        <pre className="text-xs mb-4 p-2 rounded bg-gray-200">
                            <code>
                                {JSON.stringify(results.typesense_query, null, 2)}
                            </code>
                        </pre>
                    )}
                </>
            }

            {/* Estado de carga */}
            {loading && (
                <div className="text-center py-8">
                    <p>Buscando productos...</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    Error: {error}
                </div>
            )}

            {/* Resultados con IA */}
            {results && (
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar de Facets */}
                    <aside className="w-full md:w-64 shrink-0 space-y-8">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(results as any).results.facet_counts?.map((facet: any) => (
                            <div key={facet.field_name}>
                                <h3 className="font-bold mb-3 capitalize text-base">
                                    {facet.field_name.replace(/_/g, ' ')}
                                </h3>
                                <Input
                                    placeholder="Search here..."
                                    className="mb-3 h-9 text-sm"
                                />
                                <div className="space-y-2">
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {facet.counts.map((count: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 group cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id={`${facet.field_name}-${idx}`}
                                                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                            />
                                            <label
                                                htmlFor={`${facet.field_name}-${idx}`}
                                                className="text-sm text-gray-700 flex-1 cursor-pointer select-none group-hover:text-black"
                                            >
                                                {count.value}
                                            </label>
                                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                                                {count.count}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </aside>

                    {/* Contenido Principal */}
                    <div className="flex-1">
                        {/* Información de resultados */}
                        <div className="mb-4 flex justify-between items-center">
                            <p className="text-gray-600">
                                Se encontraron {results.results.found} productos en {results.results.search_time_ms}ms
                            </p>
                        </div>

                        {/* Lista de productos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {results.results.hits.map((hit) => (
                                <Card key={hit.document.sku_id} className="p-4">
                                    <div className="aspect-square mb-3 bg-gray-100 rounded overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={hit.document.image_url}
                                            alt={hit.document.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/placeholder-product.png';
                                            }}
                                        />
                                    </div>
                                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                                        {hit.document.name}
                                    </h3>
                                    <p className="text-xs text-gray-600 mb-1">
                                        {hit.document.brand_name}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-2">
                                        {hit.document.category_name}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-green-600">
                                                S/. {hit.document.price.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Mensaje para más resultados */}
                        {results.results.hits.length === 20 && (
                            <div className="text-center text-gray-500 text-sm">
                                Ajusta tu búsqueda para encontrar productos más específicos
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}