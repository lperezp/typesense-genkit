'use client';

import { useState } from 'react';
import { useSearch } from '@/app/hooks/useSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function SearchComponent() {
    const { results, loading, error, search, clearResults } = useSearch();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const handleSearch = async (page = 1) => {
        setCurrentPage(page);

        const searchParams = {
            query: searchQuery || '*',
            page,
            per_page: 12
        };

        await search(searchParams);
    };

    const handleClear = () => {
        setSearchQuery('');
        clearResults();
        setCurrentPage(1);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(1);
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
                    <Button onClick={() => handleSearch(1)} disabled={loading}>
                        {loading ? 'Buscando...' : 'Buscar'}
                    </Button>
                    <Button variant="outline" onClick={handleClear}>
                        Limpiar
                    </Button>
                </div>
            </div>

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

            {/* Resultados */}
            {results && (
                <div>
                    {/* Información de resultados */}
                    <div className="mb-4 flex justify-between items-center">
                        <p className="text-gray-600">
                            Se encontraron {results.found} productos en {results.search_time_ms}ms
                        </p>
                        <p className="text-gray-600">
                            Página {currentPage}
                        </p>
                    </div>

                    {/* Lista de productos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                        {results.hits.map((hit) => (
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
                                        {hit.document.list_price > hit.document.price && (
                                            <span className="text-xs text-gray-500 line-through">
                                                S/. {hit.document.list_price.toFixed(2)}
                                            </span>
                                        )}
                                        <p className="font-bold text-green-600">
                                            S/. {hit.document.price.toFixed(2)}
                                        </p>
                                    </div>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        Match: {Math.round(hit.text_match)}
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Paginación */}
                    <div className="flex justify-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleSearch(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                        >
                            Anterior
                        </Button>
                        <span className="flex items-center px-4">
                            Página {currentPage}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => handleSearch(currentPage + 1)}
                            disabled={results.hits.length < 12 || loading}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            )}

        </div>
    );
}