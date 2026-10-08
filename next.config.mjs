/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  images: {
    // Hanya gambar dari Supabase Storage yang dioptimasi; host lain dirender `unoptimized` (lihat components/site/Img.js).
    remotePatterns: [{ protocol: 'https', hostname: new URL(process.env.SUPABASE_URL).hostname, pathname: '/storage/v1/object/public/**' }],
  },
  partialPrefetching: true,
  experimental: {
    // Upload gambar admin maks 5 MB + overhead multipart.
    serverActions: { bodySizeLimit: '6mb' },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
