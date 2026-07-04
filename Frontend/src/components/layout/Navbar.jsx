import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Zap, Menu, X, LogOut, User, LayoutDashboard, Search, PlusCircle } from 'lucide-react';
import { selectIsAuthenticated, selectCurrentUser, logout } from '../../store/authSlice';
import { addToast } from '../../store/uiSlice';
import { useLogout } from '../../hooks/queries';
import Button from '../ui/Button';

const NavLink = ({ to, children }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={[
        'font-mono text-xs uppercase tracking-widest transition-colors duration-200',
        active ? 'text-[#F7931A]' : 'text-[#94A3B8] hover:text-white',
      ].join(' ')}
    >
      {children}
    </Link>
  );
};

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {}
    dispatch(logout());
    dispatch(addToast({ type: 'info', message: 'Signed out successfully.' }));
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group" aria-label="SplitStream home">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_14px_-3px_rgba(247,147,26,0.6)] group-hover:shadow-[0_0_22px_-3px_rgba(247,147,26,0.9)] transition-all duration-300">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-heading font-bold text-lg text-white">
            Split<span className="gradient-text">Stream</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/pools">Browse Pools</NavLink>
              <NavLink to="/pools/create">Create Pool</NavLink>
              <NavLink to="/profile">Profile</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/#how-it-works">How It Works</NavLink>
              <NavLink to="/#features">Features</NavLink>
            </>
          )}
        </nav>

        {/* Desktop auth actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="font-mono text-xs text-[#94A3B8]">{user?.name?.split(' ')[0]}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-[#94A3B8] hover:text-red-400 transition-colors p-2"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#94A3B8] hover:text-white transition-colors p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass-dark border-t border-white/5 px-4 py-6 flex flex-col gap-5">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-white font-mono text-sm">
                <LayoutDashboard size={16} className="text-[#F7931A]" /> Dashboard
              </Link>
              <Link to="/pools" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-white font-mono text-sm">
                <Search size={16} className="text-[#F7931A]" /> Browse Pools
              </Link>
              <Link to="/pools/create" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-white font-mono text-sm">
                <PlusCircle size={16} className="text-[#F7931A]" /> Create Pool
              </Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 text-white font-mono text-sm">
                <User size={16} className="text-[#F7931A]" /> Profile
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-3 text-red-400 font-mono text-sm">
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
