import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Code, MessageCircle } from 'lucide-react';

const Footer = () => (
  <footer className="border-t border-white/5 bg-[#030304]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-heading font-bold text-lg text-white">
              Split<span className="gradient-text">Stream</span>
            </span>
          </div>
          <p className="text-[#94A3B8] text-sm leading-relaxed max-w-xs">
            Group subscription cost-sharing with real-time trust scoring. Built for the modern web.
          </p>
          <div className="flex gap-3 mt-5">
            <a href="#" aria-label="GitHub" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:border-[#F7931A]/50 transition-all duration-300">
              <Code size={15} />
            </a>
            <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:border-[#F7931A]/50 transition-all duration-300">
              <MessageCircle size={15} />
            </a>
          </div>
        </div>

        {/* Product */}
        <div>
          <h4 className="font-mono text-xs text-[#94A3B8] uppercase tracking-widest mb-4">Product</h4>
          <ul className="space-y-2.5">
            {[['Browse Pools', '/pools'], ['Create Pool', '/pools/create'], ['Dashboard', '/dashboard']].map(([label, to]) => (
              <li key={label}>
                <Link to={to} className="text-sm text-[#94A3B8] hover:text-[#F7931A] transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div>
          <h4 className="font-mono text-xs text-[#94A3B8] uppercase tracking-widest mb-4">Account</h4>
          <ul className="space-y-2.5">
            {[['Sign In', '/login'], ['Register', '/register'], ['My Profile', '/profile']].map(([label, to]) => (
              <li key={label}>
                <Link to={to} className="text-sm text-[#94A3B8] hover:text-[#F7931A] transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="font-mono text-xs text-[#94A3B8]">
          © {new Date().getFullYear()} SplitStream. Portfolio Project.
        </p>
        <p className="font-mono text-xs text-[#94A3B8]">
          Stripe test mode • No real money
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
