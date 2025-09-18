import client from '@/lib/typesense';

export class SearchService {
    private collectionName = 'products';

    async searchProducts(params: {
        query?: string;
        page?: number;
        per_page?: number;
        filters?: {
            brand?: string;
            category?: string;
            department?: string;
            gender?: string;
            color?: string;
            size?: string;
            min_price?: number;
            max_price?: number;
        };
    }) {
        try {
            const {
                query = '*',
                page = 1,
                per_page = 12,
                filters = {}
            } = params;

            // Construir filtros
            const filterConditions = [];

            if (filters.brand) filterConditions.push(`brand_name:${filters.brand}`);
            if (filters.category) filterConditions.push(`category_name:${filters.category}`);
            if (filters.department) filterConditions.push(`department_name:${filters.department}`);
            if (filters.gender) filterConditions.push(`gender:${filters.gender}`);
            if (filters.color) filterConditions.push(`color:${filters.color}`);
            if (filters.size) filterConditions.push(`size:${filters.size}`);

            if (filters.min_price && filters.max_price) {
                filterConditions.push(`price:[${filters.min_price}..${filters.max_price}]`);
            } else if (filters.min_price) {
                filterConditions.push(`price:>=${filters.min_price}`);
            } else if (filters.max_price) {
                filterConditions.push(`price:<=${filters.max_price}`);
            }

            const searchParameters = {
                q: query,
                query_by: 'name,brand_name,category_name,sub_category_name',
                filter_by: filterConditions.length > 0 ? filterConditions.join(' && ') : undefined,
                facet_by: 'brand_name,category_name,department_name,gender,color,size',
                sort_by: query === '*' ? 'price:asc' : '_text_match:desc,price:asc',
                page,
                per_page,
            };

            const result = await client.collections(this.collectionName).documents().search(searchParameters);
            return result;
        } catch (error) {
            console.error('Error en búsqueda:', error);
            throw new Error('Error realizando búsqueda en Typesense');
        }
    }

    async getFacets() {
        try {
            // Obtener algunos productos para extraer los facets disponibles
            const searchResult = await this.searchProducts({ query: '*', per_page: 1 });
            return searchResult.facet_counts;
        } catch (error) {
            console.error('Error obteniendo facets:', error);
            throw new Error('Error obteniendo facets');
        }
    }
}

export const searchService = new SearchService();