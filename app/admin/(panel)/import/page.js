import ImportPanel from '@/components/admin/ImportPanel';
import { Card, PageHeader, btn } from '@/components/admin/ui';

export const metadata = { title: 'Import / Export' };

export default function ImportPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Import / Export" description="Kelola ratusan produk sekaligus lewat spreadsheet (CSV)." />

      <Card title="Export & template">
        <div className="flex flex-wrap gap-3">
          {/* <a download>: unduhan file dari route handler, bukan navigasi halaman. */}
          <a href="/admin/export" download className={btn.secondary}>Export semua produk (.csv)</a>
          <a href="/admin/export?template=1" download className={btn.secondary}>Download template</a>
        </div>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Isian lebih dari satu (highlights, pros, cons, specs, images) dipisah dengan <code className="font-mono">|</code>. Spesifikasi berformat <code className="font-mono">Label: Nilai</code>.</li>
          <li>Harga boleh ditulis <code className="font-mono">249000</code>, <code className="font-mono">249.000</code>, atau <code className="font-mono">Rp 249.000</code>.</li>
          <li><code className="font-mono">is_active</code> / <code className="font-mono">is_featured</code>: ya / tidak. <code className="font-mono">category_slug</code> harus sudah ada di menu Kategori.</li>
          <li>Saat update: kolom <code className="font-mono">images</code> kosong = gambar lama dipertahankan; kolom marketplace kosong = link marketplace itu dihapus.</li>
        </ul>
      </Card>

      <ImportPanel />
    </div>
  );
}
