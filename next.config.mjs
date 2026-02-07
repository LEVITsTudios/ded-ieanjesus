/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Optimizaciones para desarrollo rápido
  reactStrictMode: false, // Desactivar en dev para evitar doble renderizado
  experimental: {
    optimizePackageImports: ["@radix-ui/react-*"],
  },
  cacheLife: {
    default: { revalidate: 3600 }, // 1 hora
    dynamic: { revalidate: 0 },
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 60 segundos
    pagesBufferLength: 5,
  },
}

export default nextConfig
