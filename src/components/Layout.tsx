import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import logo from '/logo_polycliniques.jpg';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  navigationItems: Array<{
    name: string;
    href: string;
    icon: React.ReactNode;
  }>;
  settingsPath?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title: _title, navigationItems, settingsPath = "/admin/settings" }) => {
  const { logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header horizontal vert/blanc avec navigation */}
      <header className="flex items-center px-2 py-2 shadow bg-gradient-to-r from-green-700 via-green-600 to-green-500">
        <img src={logo} alt="Logo Polyclinique des Apôtres" className="h-10 w-auto rounded bg-white p-0.5 shadow" />
        {/* Suppression du nom de la clinique pour laisser uniquement le logo */}
        {/* Boutons de navigation */}
        <nav className="flex-1 flex items-center space-x-1 justify-center overflow-x-auto scrollbar-thin scrollbar-thumb-green-200">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-1.5 rounded font-medium transition-all duration-150 text-sm shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2 ${
                location.pathname === item.href
                  ? 'bg-white text-green-700 border-green-700'
                  : 'text-white hover:bg-green-100 hover:text-green-800 hover:border-green-300'
              }`}
              style={{ minWidth: 120, maxWidth: 180, justifyContent: 'center' }}
            >
              <span className="mr-1 text-base">{item.icon}</span>
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="flex items-center space-x-2 ml-2">
          {/* Bouton paramètres (changer mot de passe) */}
          <Link
            to={settingsPath}
            className="flex items-center px-3 py-1.5 rounded font-medium text-white hover:bg-green-800 transition border border-transparent focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2"
            style={{ minWidth: 50, justifyContent: 'center' }}
            title="Paramètres - Changer mot de passe"
          >
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Paramètres</span>
          </Link>
          {/* Bouton déconnexion */}
          <button
            onClick={handleLogout}
            className="flex items-center px-2 py-1.5 rounded font-medium text-white bg-red-600 hover:bg-red-700 transition border border-transparent focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
            style={{ minWidth: 40, justifyContent: 'center' }}
            title="Déconnexion"
          >
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <div>
        <main className="py-6 bg-white min-h-[calc(100vh-4rem)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 