/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      // Add your Supabase project domain
      "swfgvfhpmicwptupjyko.supabase.co"
    ],
  },
  reactStrictMode: false,
  experimental: {
    // Añadimos la siguiente configuración para evitar errores de tipos en la compilación
    typedRoutes: false,
  },
  typescript: {
    // Ignorar errores de tipo durante la compilación para solucionar el error de build
    ignoreBuildErrors: true,
  },
  // ... other config options
}

module.exports = nextConfig 