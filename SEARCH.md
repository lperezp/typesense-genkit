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

## 🔍 Búsqueda Simplificada

### API Endpoints

- **`GET /api/search`** - Búsqueda principal por texto
- **`GET /api/test-connection`** - Probar conexión con Typesense Cloud

### Probar Conexión

Primero verifica que la conexión funcione:

```bash
# Probar conexión con Typesense Cloud
GET /api/test-connection
```

### Búsqueda por Texto

```bash
# Búsqueda básica por texto
GET /api/search?q=polo

# Búsqueda general (todos los productos)
GET /api/search?q=*

# Con paginación
GET /api/search?q=polo&page=2&per_page=12
```

## 💻 Uso en Frontend

### Hook useSearch (Simplificado)

```tsx
import { useSearch } from '@/app/hooks/useSearch';

function MySearchComponent() {
    const { results, loading, error, search } = useSearch();

    const handleSearch = async () => {
        await search({
            query: 'polo',
            page: 1,
            per_page: 12
        });
    };

    return (
        <div>
            <input 
                type="text" 
                placeholder="Buscar productos..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
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
✅ **Interfaz simple** - solo input de búsqueda  
✅ **Paginación** eficiente  
✅ **Búsqueda en tiempo real** (Enter o botón)  
✅ **Tiempo de respuesta** mostrado  
✅ **Score de relevancia** por producto  
✅ **Grid responsive** de productos  

## 🚀 Archivos Principales

- `/lib/search-service.ts` - Servicio de búsqueda simplificado
- `/lib/typesense.ts` - Configuración del cliente
- `/app/hooks/useSearch.ts` - Hook simple para frontend
- `/app/api/search/route.ts` - API de búsqueda por texto
- `/app/api/test-connection/route.ts` - API para probar conexión
- `/app/components/search-component.tsx` - Componente simple de búsqueda

## 📝 Notas

- Solo funcionalidad de **búsqueda** (no CRUD)
- Funciona con **Typesense Cloud** existente
- Los datos y colección deben existir previamente
- API key debe tener **permisos de solo lectura**