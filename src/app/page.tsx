/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LIST_PRODUCTS_MOCK } from './../mock/list_products';
import { ProductInterface } from './../model/product';

import { runFlow } from '@genkit-ai/next/client';
import { generateTypesenseQuery } from '@/genkit/searchProductFlow';

interface ResultQueryInterface {
  query?: string | undefined;
  filter_by?: string | undefined;
  sort_by?: string | undefined;
}

export default function Home() {
  const [query, setQuery] = useState<ResultQueryInterface | null>(null);
  const [loadingState, setLoadingState] = useState<
    'generating' | 'searching' | 'finished'
  >('finished');


  async function getQuerySearch(formData: FormData) {
    const theme = formData.get('search')?.toString() ?? '';

    try {
      const result = await runFlow<typeof generateTypesenseQuery>({
        url: '/api/searchSuggestion',
        input: theme,
      });
      setQuery(result);
      getProducts(JSON.stringify(result));

    } catch (error) {
      console.error('Error generating menu item:', error);
    }
  }

  async function getProducts(query: string) {
    console.log('Query to search products:', query);
    try {
      setLoadingState('searching');
      // const params = JSON.parse(query);

      const q = JSON.parse(query);

      const params = {
        q: q.query || '*',
        filter_by: q.filter_by || '',
        sort_by: q.sort_by || '',
      };

      console.log('Search Params:', params);


      // const searchResponse = await typesense().collections<_ProductSchemaResponse>(clientEnv.TYPESENSE_COLLECTION_NAME).documents().search(params);

      // console.log('Search Response:', searchResponse);

    }
    catch (error) {
      console.error('Error searching products:', error);
    }
  }

  return (
    <main className='flex flex-col items-center p-0 min-h-screen'>
      <Header />
      <div className="p-4 w-4xl flex flex-col items-center justify-items-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mt-2 mb-2">Búsqueda de Productos con Gen AI</h1>
          <h2 className="text-l text-gray-600 dark:text-gray-400 mb-4">
            Potenciado por <img src={'./typesense.svg'} alt="Typesense Logo" className="inline-block h-6 mr-1" /> y <img src={'./genkit.svg'} alt="Genkit Logo" className="inline-block h-4 mr-1" />
          </h2>
        </div>
        <div className="flex flex-col items-center gap-4 mb-8 w-full max-w-md">
          <form action={getQuerySearch} className="w-full">
            <div className="flex w-full items-center gap-2">
              <Input type="text" name="search" id="search" className="pl-2" placeholder="Qué quieres buscar?" />
              <Button type="submit" variant="outline" disabled={loadingState === 'searching'}>
                {loadingState === 'searching' ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </form>
        </div>
        <div className="w-full max-w-screen-lg">
          {query && (
            <div>
              <h3 className="text-xl font-semibold mb-3">Resultados:</h3>
              {/* <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <pre className="whitespace-pre-wrap text-sm">{menuItem}</pre>
              </div> */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {
                  LIST_PRODUCTS_MOCK.map((product: ProductInterface) => (
                    <Card key={product.sku_id} className="mb-4">
                      <CardHeader>
                        <CardTitle>{product.name}</CardTitle>
                        <CardDescription>{product.brand_name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>Precio: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(product.price)}</p>
                        <p>Color: {product.color}</p>
                        <p>Talla: {product.size}</p>
                      </CardContent>
                    </Card>
                  ))}
              </div>


            </div>
          )}
        </div>
      </div>
    </main>
  );
}