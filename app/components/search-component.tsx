'use client';

import { useState } from 'react';
import { useSearch, useFacets } from '@/app/hooks/useSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function SearchComponent() {
    const { results, loading, error, search, clearResults } = useSearch();
    const { facets, fetchFacets } = useFacets();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        brand: '',
        category: '',
        gender: '',
        min_price: '',
        max_price: ''
    });

    const handleSearch = async (page = 1) => {
        setCurrentPage(page);

        const searchParams = {
            query: searchQuery || '*',
            page,
            per_page: 12,
            ...(filters.brand && { brand: filters.brand }),
            ...(filters.category && { category: filters.category }),
            ...(filters.gender && { gender: filters.gender }),
            ...(filters.min_price && { min_price: parseFloat(filters.min_price) }),
            ...(filters.max_price && { max_price: parseFloat(filters.max_price) }),
        };

        await search(searchParams);
    };

    const handleFilterChange = (filterName: string, value: string) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const handleClear = () => {
        setSearchQuery('');
        setFilters({
            brand: '',
            category: '',
            gender: '',
            min_price: '',
            max_price: ''
        });
        clearResults();
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Búsqueda de Productos</h1>

            {/* Barra de búsqueda */}
            <div className="mb-6 space-y-4">
                <div className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1"
                    />
                    <Button onClick={() => handleSearch()} disabled={loading}>
                        {loading ? 'Buscando...' : 'Buscar'}
                    </Button>
                    <Button variant="outline" onClick={handleClear}>
                        Limpiar
                    </Button>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Input
                        placeholder="Marca"
                        value={filters.brand}
                        onChange={(e) => handleFilterChange('brand', e.target.value)}
                    />
                    <Input
                        placeholder="Categoría"
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                    />
                    <Input
                        placeholder="Género"
                        value={filters.gender}
                        onChange={(e) => handleFilterChange('gender', e.target.value)}
                    />
                    <Input
                        type="number"
                        placeholder="Precio mín."
                        value={filters.min_price}
                        onChange={(e) => handleFilterChange('min_price', e.target.value)}
                    />
                    <Input
                        type="number"
                        placeholder="Precio máx."
                        value={filters.max_price}
                        onChange={(e) => handleFilterChange('max_price', e.target.value)}
                    />
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

            {/* Botón para obtener facets */}
            <div className="mt-8">
                <Button variant="outline" onClick={fetchFacets}>
                    Ver Filtros Disponibles
                </Button>
                {facets && (
                    <div className="mt-4 p-4 bg-gray-50 rounded">
                        <h3 className="font-semibold mb-2">Filtros Disponibles:</h3>
                        {facets.map((facet) => (
                            <div key={facet.field_name} className="mb-2">
                                <strong>{facet.field_name}:</strong>{' '}
                                {facet.counts.slice(0, 5).map((count) => (
                                    <span key={count.value} className="mr-2 text-sm">
                                        {count.value} ({count.count})
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}