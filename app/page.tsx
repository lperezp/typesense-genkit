'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from './components/header';
import { LIST_PRODUCTS_MOCK } from './mock/list_products';
import { CardProduct } from './components/card-product';

export default function Home() {

  return (
    <main className='flex flex-col items-center p-0 min-h-screen'>
      <Header />
      <div className="p-4 w-full w-4xl flex flex-col items-center justify-items-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mt-2 mb-2">Búsqueda de Productos con Gen AI</h1>
          <h2 className="text-l text-gray-600 dark:text-gray-400 mb-4">
            Potenciado por <img src={'./typesense.svg'} alt="Typesense Logo" className="inline-block h-6 mr-1" /> y <img src={'./genkit.svg'} alt="Genkit Logo" className="inline-block h-4 mr-1" />
          </h2>
        </div>
        <div className="flex flex-col items-center gap-4 mb-8 w-full max-w-md">
          <form className="w-full">
            <div className="flex w-full items-center gap-2">
              <Input type="text" name="search" id="search" className="pl-2" placeholder="Qué quieres buscar?" />
              <Button type="submit" variant="outline">Buscar</Button>
            </div>
          </form>
        </div>
        <div className="w-full max-w-screen-lg">
          <div>
            <h3 className="text-xl font-semibold mb-3">Resultados:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {
                LIST_PRODUCTS_MOCK.map((product) => (
                  <CardProduct key={product.sku_id} product={product} />
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}