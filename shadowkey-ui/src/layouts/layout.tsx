import { Link } from '@tanstack/react-router';
import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground shadow">
        <nav className="container mx-auto flex gap-4 p-4">
          <Link
            to="/"
            className="font-semibold transition hover:opacity-80"
            activeProps={{ className: 'underline' }}
          >
            Home
          </Link>
          <Link
            to="/shadowkey"
            className="font-semibold transition hover:opacity-80"
            activeProps={{ className: 'underline' }}
          >
            shadowkey
          </Link>
          <Link
            to="/wallet-ui"
            className="font-semibold transition hover:opacity-80"
            activeProps={{ className: 'underline' }}
          >
            Wallet UI
          </Link>
        </nav>
      </header>
      <main className="container mx-auto flex-1 py-6">
        {children}
      </main>
    </div>
  );
};