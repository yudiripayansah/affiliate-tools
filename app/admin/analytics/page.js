import { redirect } from 'next/navigation';

// URL lama Phase 1 -> dashboard baru di /admin.
export default function LegacyAnalyticsPage() {
  redirect('/admin');
}
