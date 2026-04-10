import Link from 'next/link';
import { siteConfig } from '../lib/site';
export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-wide text-white">{siteConfig.name}</Link>
        <nav className="hidden gap-6 md:flex">
          {siteConfig.nav.map(item=>(
            <Link key={item.href} href={item.href} className="text-sm text-zinc-300 transition hover:text-white">{item.label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
} 
