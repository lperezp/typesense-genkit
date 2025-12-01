import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Desactiva los source maps en el navegador para evitar que el parser falle
  productionBrowserSourceMaps: false,

  // 2. Configuración experimental para manejar dependencias en Turbopack
  experimental: {
    // Esto a veces ayuda a silenciar errores de source maps en dependencias
    serverSourceMaps: false,
  },

  // Asegúrate de NO tener ninguna función 'webpack' aquí definida
};

export default nextConfig;
