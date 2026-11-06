import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { useRef } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import SSRDirectory from '@/pages/SSRDirectory';
import SSRDetail from '@/pages/SSRDetail';
import TDSTool from '@/pages/TDSTool';
import ssrImg from '@/assets/icon-ssr-directory-new.jpg';
import tdsImg from '@/assets/icon-tds-tool.jpg';
import { loadDB, saveDB, resetDB } from './mocks/supabase';
import '@/index.css';

declare const __SNAPSHOT_DATE__: string;

function Home() {
  const fileRef = useRef<HTMLInputElement>(null);
  const exportData = () => {
    const blob = new Blob([JSON.stringify(loadDB(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ssr-directory-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  const importData = async (f?: File) => {
    if (!f) return;
    try {
      const db = JSON.parse(await f.text());
      if (!Array.isArray(db.ssrs)) throw new Error();
      saveDB(db); alert('Backup restored.'); location.reload();
    } catch { alert('That file is not a valid backup.'); }
  };
  const tiles = [
    { to: '/ssr-directory', img: ssrImg, title: 'SSR Directory', text: 'View, add and edit SSRs and their assets.' },
    { to: '/tds-tool', img: tdsImg, title: 'TDS Tool', text: 'Centre of Gravity, Restraint System and Container Fit calculators.' },
  ];
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-foreground mb-2">Offline Edition</h1>
        <p className="text-foreground/80 mb-8">Works without internet. SSR data was copied on {__SNAPSHOT_DATE__}; changes you make are saved on this computer only.</p>
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {tiles.map((t) => (
            <Link key={t.to} to={t.to} className="relative h-64 rounded-xl overflow-hidden shadow-lg group">
              <img src={t.img} alt={t.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute bottom-0 p-6">
                <h2 className="text-2xl font-bold text-white">{t.title}</h2>
                <p className="text-white/85 mb-3">{t.text}</p>
                <span className="inline-block bg-white text-ribbon font-semibold px-4 py-2 rounded-md">Open</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="rounded-xl bg-card text-card-foreground p-6 shadow">
          <h2 className="text-xl font-semibold mb-1">Backup Your Offline Data</h2>
          <p className="text-sm text-muted-foreground mb-4">Your edits live in this browser. Save a backup file to keep them safe or move them to another computer.</p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportData}>Save Backup File</Button>
            <Button onClick={() => fileRef.current?.click()}>Restore From Backup</Button>
            <Button onClick={() => { if (confirm('Discard all offline changes and go back to the original copied data?')) { resetDB(); location.reload(); } }}>Reset To Original Data</Button>
            <input ref={fileRef} type="file" accept=".json" hidden onChange={(e) => importData(e.target.files?.[0])} />
          </div>
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <TooltipProvider>
    <Toaster />
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ssr-directory" element={<SSRDirectory />} />
        <Route path="/ssr/:id" element={<SSRDetail />} />
        <Route path="/tds-tool" element={<TDSTool />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  </TooltipProvider>
);
