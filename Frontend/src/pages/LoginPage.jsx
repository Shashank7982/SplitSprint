import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, Lock, Zap, ArrowRight } from 'lucide-react';
import { setCredentials } from '../store/authSlice';
import { addToast } from '../store/uiSlice';
import { useLogin } from '../hooks/queries';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    try {
      const data = await loginMutation.mutateAsync(form);
      dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
      dispatch(addToast({ type: 'success', message: `Welcome back, ${data.user.name}!` }));
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid credentials. Please try again.';
      dispatch(addToast({ type: 'error', message: msg }));
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 pt-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#F7931A] opacity-5 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center shadow-[0_0_20px_-5px_rgba(247,147,26,0.5)]">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-white">
              Split<span className="gradient-text">Stream</span>
            </span>
          </Link>
          <h1 className="font-heading font-bold text-3xl text-white mb-2">Welcome back</h1>
          <p className="text-[#94A3B8] text-sm">Sign in to your account to continue</p>
        </div>

        {/* Card */}
        <div className="glass-dark rounded-2xl p-8">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            <Input
              label="Email Address"
              type="email"
              id="login-email"
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
              id="login-password"
              icon={Lock}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              className="w-full mt-2"
              loading={loginMutation.isPending}
            >
              Sign In <ArrowRight size={15} />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/8 text-center">
            <p className="text-[#94A3B8] text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#F7931A] hover:text-[#FFD600] transition-colors font-medium">
                Create one free
              </Link>
            </p>
          </div>
        </div>

        {/* Test hint */}
        <div className="mt-6 text-center">
          <p className="font-mono text-xs text-[#94A3B8]">
            Test card: <span className="text-[#F7931A]">4242 4242 4242 4242</span>
          </p>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
