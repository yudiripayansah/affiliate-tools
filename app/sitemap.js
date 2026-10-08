import { getSitemapEntries } from '@/lib/catalog';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap() {
  const { products, categories, pages } = await getSitemapEntries();
  return [
    { url: `${SITE}/`, changeFrequency: 'daily', priority: 1 },
    ...categories.map((c) => ({ url: `${SITE}/c/${c.slug}`, changeFrequency: 'daily', priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE}/p/${p.slug}`, lastModified: p.updated_at, changeFrequency: 'weekly', priority: 0.7 })),
    ...pages.map((p) => ({ url: `${SITE}/${p.slug}`, lastModified: p.updated_at, changeFrequency: 'monthly', priority: 0.3 })),
  ];
}
