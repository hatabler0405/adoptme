import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { PawPrint, Heart, Building2, Compass, LogOut, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

export default function Navbar() {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { favorites } = useFavorites();

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
    }`;

  const displayName = user?.username || user?.email?.split('@')[0] || 'User';

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-[#0b1329]/95 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <PawPrint className="h-5 w-5" />
          </div>
          <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
            Adopt<span className="text-blue-500">Me</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-2">
          <NavLink to="/" className={navLinkClass}>
            <Compass className="h-4 w-4" />
            <span>Explore</span>
          </NavLink>

          <NavLink to="/breeds" className={navLinkClass}>
            <BookOpen className="h-4 w-4" />
            <span>Breeds</span>
          </NavLink>

          <NavLink to="/shelters" className={navLinkClass}>
            <Building2 className="h-4 w-4" />
            <span>Shelters</span>
          </NavLink>

          <NavLink to="/favorites" className={navLinkClass}>
            <Heart className="h-4 w-4" />
            <span>Favorites ({favorites?.length || 0})</span>
          </NavLink>
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/settings"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-slate-700 transition"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600/20 text-blue-600 dark:bg-blue-600/30 dark:text-blue-400 font-bold text-[11px]">
                  {displayName[0].toUpperCase()}
                </div>
                <span className="max-w-30 truncate">{displayName}</span>
              </Link>

              <button
                type="button"
                onClick={logout}
                title="Log Out"
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/40 transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition cursor-pointer"
            >
              Sign Up
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}