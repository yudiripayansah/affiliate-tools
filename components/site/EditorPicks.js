'use client';

// Pilihan Editor dengan tab per kategori (pola "What's New" di referensi).
import { useState } from 'react';
import ProductCard, { railItem } from './ProductCard';
import Rail from './Rail';

export default function EditorPicks({ products, categories }) {
  const [tab, setTab] = useState('');
  const shown = tab ? products.filter((p) => p.category?.slug === tab) : products;
  const tabs = [{ slug: '', name: 'Semua' }, ...categories];

  return (
    <Rail
      title="Pilihan Editor"
      actions={
        tabs.length > 2 && (
          <div role="tablist" aria-label="Kategori pilihan editor" className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {tabs.map((t) => (
              <button
                key={t.slug}
                type="button"
                role="tab"
                aria-selected={tab === t.slug}
                onClick={() => setTab(t.slug)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${tab === t.slug ? 'bg-ink text-white' : 'bg-surface text-muted hover:text-ink'}`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )
      }
    >
      {shown.map((p) => <li key={p.slug} className={railItem}><ProductCard product={p} /></li>)}
    </Rail>
  );
}
