# Integración Typesense - Guía de Uso

## Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env.local` basado en `.env.local.example`:

```bash
# Configuración de Typesense
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=xyz
```

Para producción, actualiza los valores con tu servidor Typesense real.

### 2. Instalación de Typesense Server (Desarrollo)

Usando Docker:

```bash
docker run -p 8108:8108 -v typesense-data:/data typesense/typesense:0.25.1 \
  --data-dir /data --api-key=xyz --enable-cors
```

## Uso de la API

### Inicializar Datos

Para crear la colección e importar los productos mock:

```bash
curl -X POST http://localhost:3000/api/products/init
```

### Búsqueda de Productos

```bash
# Búsqueda básica
curl "http://localhost:3000/api/search?q=polo"

# Búsqueda con filtros
curl "http://localhost:3000/api/search?q=*&brand=PUMA&gender=Hombre&min_price=40&max_price=100"

# Paginación
curl "http://localhost:3000/api/search?q=*&page=2&per_page=6"
```

### Operaciones CRUD

```bash
# Obtener todos los productos
curl "http://localhost:3000/api/products"

# Obtener producto específico
curl "http://localhost:3000/api/products/2502521"

# Agregar nuevo producto
curl -X POST "http://localhost:3000/api/products" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 9999, "sku_id": 9999, "name": "Producto Test", ...}'

# Actualizar producto
curl -X PUT "http://localhost:3000/api/products/2502521" \
  -H "Content-Type: application/json" \
  -d '{"price": 59.99}'

# Eliminar producto
curl -X DELETE "http://localhost:3000/api/products/2502521"
```

### Obtener Facets (Filtros Disponibles)

```bash
curl "http://localhost:3000/api/facets"
```

## Uso desde el Frontend

### Hook useTypesense

```tsx
import { useTypesense } from '@/app/hooks/useTypesense';

function SearchComponent() {
  const { results, loading, error, search, initializeData } = useTypesense();

  // Inicializar datos
  const handleInit = async () => {
    await initializeData();
  };

  // Buscar productos
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
      <button onClick={handleInit}>Inicializar Datos</button>
      <button onClick={handleSearch}>Buscar</button>
      
      {loading && <p>Cargando...</p>}
      {error && <p>Error: {error}</p>}
      
      {results && (
        <div>
          <p>Encontrados: {results.found} productos</p>
          {results.hits.map((hit) => (
            <div key={hit.document.sku_id}>
              <h3>{hit.document.name}</h3>
              <p>Precio: S/. {hit.document.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Hook useProduct

```tsx
import { useProduct } from '@/app/hooks/useTypesense';

function ProductDetail({ id }: { id: string }) {
  const { product, loading, error } = useProduct(id);

  if (loading) return <p>Cargando producto...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!product) return <p>Producto no encontrado</p>;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Marca: {product.brand_name}</p>
      <p>Precio: S/. {product.price}</p>
      <img src={product.image_url} alt={product.name} />
    </div>
  );
}
```

## Servicios Disponibles

### TypesenseService

El servicio `TypesenseService` en `/lib/typesense-service.ts` proporciona métodos para:

- `initializeCollection()` - Crear/recrear la colección
- `indexProducts(products)` - Indexar productos en batch
- `searchProducts(params)` - Búsqueda avanzada con filtros
- `getProduct(id)` - Obtener producto específico
- `addProduct(product)` - Agregar nuevo producto
- `updateProduct(id, updates)` - Actualizar producto
- `deleteProduct(id)` - Eliminar producto
- `getFacets()` - Obtener facets disponibles

## Estructura de Datos

### Esquema de Producto

```typescript
interface IProduct {
  product_id: number;
  sku_id: number;
  name: string;
  department_name: string;
  category_name: string;
  sub_category_name: string;
  brand_id: number;
  brand_name: string;
  link: string;
  image_url: string;
  stock: number;
  list_price: number;
  price: number;
  product_reference: number;
  sku_reference: number;
  specification_number: number;
  size: string;
  color: string;
  gender: string;
}
```

### Campos Searchables

- `name` - Nombre del producto
- `brand_name` - Nombre de la marca  
- `category_name` - Categoría
- `sub_category_name` - Subcategoría

### Facets (Filtros)

- `brand_name` - Marca
- `category_name` - Categoría
- `department_name` - Departamento
- `gender` - Género
- `color` - Color
- `size` - Talla

## Funcionalidades

✅ **Búsqueda de texto completo** con relevancia  
✅ **Filtros facetados** (marca, categoría, precio, etc.)  
✅ **Paginación** eficiente  
✅ **Autocompletado** potencial  
✅ **Sorting** personalizable  
✅ **Operaciones CRUD** completas  
✅ **Indexación en tiempo real**  
✅ **Facets dinámicos** para filtros  

## Producción

Para producción, asegúrate de:

1. Configurar un servidor Typesense dedicado
2. Usar HTTPS (`TYPESENSE_PROTOCOL=https`)  
3. Configurar una API key segura
4. Implementar rate limiting si es necesario
5. Configurar backups regulares de los datos