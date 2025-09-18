/* eslint-disable @next/next/no-img-element */
'use client';

import { Header } from './components/header';
import SearchComponent from './components/search-component';

export default function Home() {
  return (
    <main className='flex flex-col items-center p-0 min-h-screen'>
      <Header />
      <div className="p-4 w-full max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mt-2 mb-2">Búsqueda de Productos con Gen AI</h1>
          <h2 className="text-l text-gray-600 dark:text-gray-400 mb-4">
            Potenciado por
            <img src={'./typesense.svg'} alt="Typesense Logo" className="inline-block h-6 mr-1" /> y
            <img src={'./genkit.svg'} alt="Genkit Logo" className="inline-block h-4 ml-2" />
          </h2>
        </div>

        {/* Componente de búsqueda con Typesense */}
        <SearchComponent />
      </div>
    </main>
  );
}