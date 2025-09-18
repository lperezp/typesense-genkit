# Búsqueda con Typesense Cloud

Este proyecto incluye integración con Typesense Cloud para búsqueda de productos. **Solo funcionalidad de búsqueda** - no incluye operaciones CRUD.

## 📋 Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local`:

```bash
# Configuración de Typesense Cloud
TYPESENSE_HOST=tu-cluster.a1.typesense.net
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=tu-api-key-de-solo-busqueda
```

### 2. Estructura de la Colección

El código funciona con tu colección existente `products` que tiene este esquema:

```typescript
interface IProduct {
  product_id: string;
  sku_id: string;
  name: string;
  department_name: string;
  category_name: string;
  sub_category_name: string;
  brand_id: string;
  brand_name: string;
  link: string;
  image_url: string;
  stock: number; // int32
  list_price: number; // float
  price: number; // float (campo requerido)
  product_reference: string;
  sku_reference: string;
  specification_number: string;
  size: string;
  color: string;
  gender: string;
}
```

**Campos con facets habilitados para filtros:**
- `department_name`, `category_name`, `sub_category_name`
- `brand_name`
- `size`, `color`, `gender`

**Campo de ordenación por defecto:** `price`
**Documentos en la colección:** 976 productos

## 🔍 Funcionalidades de Búsqueda

### API Endpoints

- **`GET /api/search`** - Búsqueda principal con filtros
- **`GET /api/facets`** - Obtener filtros disponibles

### Probar Conexión

Primero verifica que la conexión funcione:

```bash
# Probar conexión con Typesense Cloud
GET /api/test-connection
```

### Parámetros de Búsqueda

```bash
# Búsqueda básica
GET /api/search?q=polo

# Con filtros
GET /api/search?q=*&brand=PUMA&gender=Hombre&min_price=40&max_price=100

# Con paginación
GET /api/search?q=*&page=2&per_page=6
```

## 💻 Uso en Frontend

### Hook useSearch

```tsx
import { useSearch } from '@/app/hooks/useSearch';

function MySearchComponent() {
    const { results, loading, error, search } = useSearch();

    const handleSearch = async () => {
        await search({
            query: 'polo',
            brand: 'PUMA',
            page: 1,
            per_page: 12
        });
    };

    return (
        <div>
            <button onClick={handleSearch}>Buscar</button>
            {loading && <p>Buscando...</p>}
            {results && (
                <div>
                    <p>Encontrados: {results.found} productos</p>
                    {results.hits.map(hit => (
                        <div key={hit.document.sku_id}>
                            <h3>{hit.document.name}</h3>
                            <p>S/. {hit.document.price}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
```

### Componente Completo

Usa el componente `SearchComponent` ya creado:

```tsx
import SearchComponent from '@/app/components/search-component';

export default function SearchPage() {
    return <SearchComponent />;
}
```

## 🎯 Características

✅ **Búsqueda de texto completo** con relevancia  
✅ **Filtros por marca, categoría, género, precio**  
✅ **Paginación** eficiente  
✅ **Facets dinámicos** para mostrar opciones de filtro  
✅ **Tiempo de respuesta** mostrado  
✅ **Score de relevancia** por producto  

## 🚀 Archivos Principales

- `/lib/search-service.ts` - Servicio de búsqueda
- `/lib/typesense.ts` - Configuración del cliente
- `/app/hooks/useSearch.ts` - Hook para frontend
- `/app/api/search/route.ts` - API de búsqueda
- `/app/api/facets/route.ts` - API de facets
- `/app/components/search-component.tsx` - Componente de ejemplo

## 📝 Notas

- Solo funcionalidad de **búsqueda** (no CRUD)
- Funciona con **Typesense Cloud** existente
- Los datos y colección deben existir previamente
- API key debe tener **permisos de solo lectura**