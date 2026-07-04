import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { User, Mail, Lock, Zap, ArrowRight, Shield } from 'lucide-react';
import { addToast } from '../store/uiSlice';
import { useRegister } from '../hooks/queries';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const RegisterPage = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password || form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    try {
      await registerMutation.mutateAsync(form);
      dispatch(addToast({ type: 'success', message: 'Account created! Please sign in.' }));
      navigate('/login');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
      dispatch(addToast({ type: 'error', message: msg }));
    }
  };

  const trustTiers = [
    { range: '90–100', label: 'Trusted',          color: 'text-emerald-400' },
    { range: '70–89',  label: 'Good Standing',    color: 'text-yellow-400' },
    { range: '50–69',  label: 'Needs Improvement',color: 'text-orange-400' },
    { range: '< 50',   label: 'Restricted',       color: 'text-red-400' },
  ];

  return (
    <main className="min-h-screen flex items-center justify-center px-4 pt-16 pb-12 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-[#F7931A] opacity-5 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_20px_-5px_rgba(247,147,26,0.5)]">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-white">
              Split<span className="gradient-text">Stream</span>
            </span>
          </Link>
          <h1 className="font-heading font-bold text-3xl text-white mb-2">Create account</h1>
          <p className="text-[#94A3B8] text-sm">Start at Trust Score 100. Keep it high.</p>
        </div>

        {/* Main card */}
        <div className="glass-dark rounded-2xl p-8 mb-6">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <Input
              label="Full Name"
              type="text"
              id="reg-name"
              icon={User}
              placeholder="Your Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              autoComplete="name"
            />
            <Input
              label="Email Address"
              type="email"
              id="reg-email"
              icon={Mail}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              id="reg-password"
              icon={Lock}
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              className="w-full mt-2"
              loading={registerMutation.isPending}
            >
              Create Account <ArrowRight size={15} />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/8 text-center">
            <p className="text-[#94A3B8] text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-[#F7931A] hover:text-[#FFD600] transition-colors font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Trust score explainer */}
        <div className="bg-[#0F1115] border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-[#F7931A]" />
            <span className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider">Trust Score Tiers</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {trustTiers.map((t) => (
              <div key={t.label} className="flex items-center gap-2">
                <span className={['font-mono text-xs font-semibold', t.color].join(' ')}>{t.range}</span>
                <span className="text-[#94A3B8] text-xs">{t.label}</span>
              </div>
            ))}
          </div>
          <p className="font-mono text-xs text-[#94A3B8] mt-3">You start at <span className="text-emerald-400 font-semibold">100</span> — keep it up by paying on time.</p>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
