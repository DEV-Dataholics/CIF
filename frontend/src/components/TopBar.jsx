import { SignOut, User, Bell, Sun, Moon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function TopBar() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const now = new Date();
  const fecha = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="sticky top-0 z-30 bg-surface-container-lowest/95 backdrop-blur-sm border-b border-outline-variant/10">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: page context */}
        <div className="flex items-center gap-4">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline capitalize">{fecha}</span>
        </div>

        {/* Right: user info */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button 
            onClick={() => navigate('/admin/alertas')}
            className="relative w-9 h-9 flex items-center justify-center border border-outline-variant/20 text-outline hover:text-primary hover:border-primary/40 transition-all"
          >
            <Bell size={18} weight="light" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-on-primary text-[8px] font-bold flex items-center justify-center rounded-full">3</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="w-9 h-9 flex items-center justify-center border border-outline-variant/20 text-outline hover:text-primary hover:border-primary/40 transition-all"
          >
            {isDark ? <Sun size={18} weight="light" /> : <Moon size={18} weight="light" />}
          </button>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-body text-on-surface font-semibold">MIRIAM</div>
              <div className="text-[10px] font-label text-primary uppercase tracking-wider">ADMIN</div>
            </div>
            <div className="w-9 h-9 bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center">
              <User size={18} weight="light" className="text-primary" />
            </div>
          </div>

          {/* Logout */}
          <button className="hidden sm:flex items-center gap-2 text-[10px] font-label uppercase tracking-widest text-outline hover:text-primary transition-colors border border-outline-variant/20 px-3 py-2 font-bold">
            <SignOut size={16} weight="light" />
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
