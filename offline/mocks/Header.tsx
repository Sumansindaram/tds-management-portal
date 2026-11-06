import { Link } from 'react-router-dom';
import logo from '@/assets/des-logo.jfif';

export function Header() {
  return (
    <header className="bg-ribbon border-b border-border shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="DE&S" className="h-10 w-auto rounded bg-white p-1" />
          <div>
            <div className="text-white font-bold text-lg leading-tight">TDS Management Portal</div>
            <div className="text-white/70 text-xs">Offline Edition</div>
          </div>
        </Link>
        <nav className="flex gap-2 text-sm">
          <Link to="/" className="text-white/90 hover:text-white px-3 py-1.5 rounded hover:bg-white/10">Home</Link>
          <Link to="/ssr-directory" className="text-white/90 hover:text-white px-3 py-1.5 rounded hover:bg-white/10">SSR Directory</Link>
          <Link to="/tds-tool" className="text-white/90 hover:text-white px-3 py-1.5 rounded hover:bg-white/10">TDS Tool</Link>
        </nav>
      </div>
    </header>
  );
}
export default Header;
