import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, GitCompare, User, LogOut, Brain } from 'lucide-react';
import { supabase } from '../../services/supabase';
import ModeToggle from '../ModeToggle';

export default function Navbar() {
  const { pathname } = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('supabase_token'));

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(!!localStorage.getItem('supabase_token'));
    };
    window.addEventListener('storage', handleAuthChange);
    // Also listen for auth state changes from supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem('supabase_token', session.access_token);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem('supabase_token');
        setIsLoggedIn(false);
      }
    });

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('supabase_token');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center group-hover:bg-brand-600/30 transition-colors">
            <Brain className="w-5 h-5 text-brand-400" />
          </div>
          <div className="hidden sm:block">
            <span className="font-extrabold text-white tracking-tight leading-none text-[15px]">
              DentalVision
            </span>
            <span className="text-brand-400 font-extrabold text-[15px]"> AI</span>
          </div>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6">
          <Link to="/history" className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${pathname === '/history' ? 'text-brand-400' : 'text-gray-400 hover:text-white'}`}>
            <Clock className="w-3.5 h-3.5" /> History
          </Link>
          <Link to="/compare" className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${pathname === '/compare' ? 'text-brand-400' : 'text-gray-400 hover:text-white'}`}>
            <GitCompare className="w-3.5 h-3.5" /> Compare
          </Link>
        </div>

        {/* Auth & Mode */}
        <div className="flex items-center gap-3">
          <ModeToggle />
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-surface-raised border border-surface-border text-gray-400 hover:text-red-400 transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-glow"
            >
              <User className="w-3.5 h-3.5" /> Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
