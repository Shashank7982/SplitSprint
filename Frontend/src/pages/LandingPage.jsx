import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Shield, Users, ArrowRight, CheckCircle,
  TrendingUp, Lock, Globe, ChevronRight, Star
} from 'lucide-react';
import Button from '../components/ui/Button';
import { TrustBadge } from '../components/ui/Badge';

/* ─── Hero Orbital Graphic ───────────────────────────────────────────────── */
const OrbitalGraphic = () => (
  <div className="relative w-[300px] h-[300px] md:w-[420px] md:h-[420px] animate-float mx-auto">
    {/* Ambient glow */}
    <div className="absolute inset-0 rounded-full bg-[#F7931A] opacity-10 blur-[80px]" />

    {/* Outer spinning ring */}
    <div className="absolute inset-0 rounded-full border border-[#F7931A]/20 animate-[spin_18s_linear_infinite]">
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#F7931A] shadow-[0_0_12px_rgba(247,147,26,0.8)]" />
    </div>

    {/* Middle spinning ring (reverse) */}
    <div className="absolute inset-6 rounded-full border border-[#FFD600]/15 animate-[spin_12s_linear_infinite_reverse]">
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#FFD600] shadow-[0_0_10px_rgba(255,214,0,0.8)]" />
    </div>

    {/* Inner ring */}
    <div className="absolute inset-12 rounded-full border border-[#EA580C]/20 animate-[spin_8s_linear_infinite]">
      <div className="absolute -bottom-1 right-5 w-2 h-2 rounded-full bg-[#EA580C] shadow-[0_0_8px_rgba(234,88,12,0.8)]" />
    </div>

    {/* Core orb */}
    <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-[#EA580C] via-[#F7931A] to-[#FFD600] shadow-[0_0_60px_rgba(247,147,26,0.5)] flex items-center justify-center">
      <Zap size={36} className="text-white" />
    </div>

    {/* Floating stat cards */}
    <div className="absolute -top-4 -right-8 glass-dark rounded-xl px-3 py-2 text-xs animate-bounce" style={{ animationDuration: '3s' }}>
      <div className="font-mono text-[#F7931A] font-semibold">₹1,240 saved</div>
      <div className="text-[#94A3B8]">this month</div>
    </div>

    <div className="absolute -bottom-2 -left-10 glass-dark rounded-xl px-3 py-2 text-xs animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
      <div className="font-mono text-emerald-400 font-semibold">Trust: 98</div>
      <div className="text-[#94A3B8]">Trusted</div>
    </div>

    <div className="absolute top-1/2 -right-14 -translate-y-1/2 glass-dark rounded-xl px-3 py-2 text-xs animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.5s' }}>
      <div className="font-mono text-[#FFD600] font-semibold">4 pools</div>
      <div className="text-[#94A3B8]">active</div>
    </div>
  </div>
);

/* ─── Stats Ticker ────────────────────────────────────────────────────────── */
const stats = [
  '₹2.4M+ Shared',
  '12,000+ Users',
  'Netflix • Spotify • YouTube • Adobe',
  '99.2% On-Time Payments',
  'Stripe Secured',
  '< 200ms Response',
];

const StatsTicker = () => (
  <div className="border-y border-white/10 bg-[#0F1115] overflow-hidden py-4">
    <div className="flex animate-ticker whitespace-nowrap" style={{ width: 'max-content' }}>
      {[...stats, ...stats].map((stat, i) => (
        <span key={i} className="font-mono text-xs text-[#94A3B8] uppercase tracking-widest mx-8 flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F7931A] inline-block" />
          {stat}
        </span>
      ))}
    </div>
  </div>
);

/* ─── How It Works ────────────────────────────────────────────────────────── */
const steps = [
  {
    num: '01',
    title: 'Create a Pool',
    desc: 'Host sets up a subscription pool with your service, plan, and cost. An invite code is auto-generated.',
    icon: PlusIcon,
  },
  {
    num: '02',
    title: 'Members Join',
    desc: 'Contributors join using the invite code. Trust score ≥ 50 required. Share amount auto-calculated.',
    icon: UsersIcon,
  },
  {
    num: '03',
    title: 'Pay & Trust',
    desc: 'Pay your share via Stripe. On-time payments boost your trust score. Late payments reduce it.',
    icon: ZapIcon,
  },
];

function PlusIcon() { return <Zap size={20} className="text-[#F7931A]" />; }
function UsersIcon() { return <Users size={20} className="text-[#F7931A]" />; }
function ZapIcon() { return <TrendingUp size={20} className="text-[#F7931A]" />; }

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 bg-[#0F1115]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-16">
        <p className="font-mono text-xs text-[#F7931A] uppercase tracking-widest mb-3">Process</p>
        <h2 className="font-heading font-bold text-3xl md:text-5xl text-white">
          How <span className="gradient-text">SplitStream</span> Works
        </h2>
        <p className="text-[#94A3B8] mt-4 max-w-xl mx-auto">
          Three simple steps to start sharing subscription costs and building financial trust.
        </p>
      </div>

      <div className="relative grid md:grid-cols-3 gap-8">
        {/* Connecting line */}
        <div className="hidden md:block absolute top-12 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-[#F7931A] via-[#FFD600] to-transparent" />

        {steps.map((step, i) => (
          <div key={i} className="relative group">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-5 h-5 border-t border-l border-[#F7931A]/0 group-hover:border-[#F7931A]/60 transition-all duration-500" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r border-[#F7931A]/0 group-hover:border-[#F7931A]/60 transition-all duration-500" />

            <div className="bg-[#030304] border border-white/8 rounded-2xl p-8 transition-all duration-300 group-hover:border-[#F7931A]/25 group-hover:shadow-[0_0_40px_-15px_rgba(247,147,26,0.3)]">
              {/* Step number node */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EA580C]/20 to-[#F7931A]/20 border border-[#F7931A]/30 flex items-center justify-center">
                    <step.icon />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0F1115] border border-[#F7931A]/50 flex items-center justify-center">
                    <span className="font-mono text-[9px] text-[#F7931A]">{step.num}</span>
                  </div>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-[#F7931A]/20 to-transparent" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-white mb-2">{step.title}</h3>
              <p className="text-[#94A3B8] text-sm leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Features ────────────────────────────────────────────────────────────── */
const features = [
  {
    icon: Shield,
    title: 'Trust Score Engine',
    desc: 'Dynamic scoring system tracks payment reliability. On-time payments earn +2 points. Defaults cost -25.',
    watermark: Shield,
  },
  {
    icon: Zap,
    title: 'Stripe Integration',
    desc: 'Real payment processing via Stripe PaymentIntents. Secure, instant, and fully webhook-verified.',
    watermark: Zap,
  },
  {
    icon: Lock,
    title: 'JWT Security',
    desc: 'Refresh tokens in httpOnly cookies. Access tokens expire in 15 minutes. Zero XSS exposure.',
    watermark: Lock,
  },
  {
    icon: Globe,
    title: 'Automated Billing',
    desc: 'Cron jobs send daily reminders and auto-retry failed payments up to 3 times before penalizing.',
    watermark: Globe,
  },
  {
    icon: Users,
    title: 'Pool Management',
    desc: 'Host creates pools with invite codes. Contributors join, pay their share, and track pool status.',
    watermark: Users,
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Analytics',
    desc: 'Dashboard shows upcoming payments, member statuses, and your trust score trend over time.',
    watermark: TrendingUp,
  },
];

const Features = () => (
  <section id="features" className="py-24 bg-[#030304]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-16">
        <p className="font-mono text-xs text-[#F7931A] uppercase tracking-widest mb-3">Features</p>
        <h2 className="font-heading font-bold text-3xl md:text-5xl text-white">
          Engineered for <span className="gradient-text">Trust</span>
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div
            key={i}
            className="group relative bg-[#0F1115] border border-white/8 rounded-2xl p-7 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#F7931A]/30 hover:shadow-[0_0_40px_-15px_rgba(247,147,26,0.25)]"
          >
            {/* Background watermark icon */}
            <f.watermark
              size={80}
              className="absolute bottom-4 right-4 text-white opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500 rotate-12"
            />

            {/* Icon container */}
            <div className="w-11 h-11 rounded-lg bg-[#EA580C]/15 border border-[#EA580C]/30 flex items-center justify-center mb-5 group-hover:shadow-[0_0_20px_rgba(234,88,12,0.35)] transition-all duration-300">
              <f.icon size={20} className="text-[#F7931A]" />
            </div>

            <h3 className="font-heading font-semibold text-white text-base mb-2">{f.title}</h3>
            <p className="text-[#94A3B8] text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Testimonials ────────────────────────────────────────────────────────── */
const testimonials = [
  { name: 'Arjun M.',    score: 98, text: 'SplitStream saved our whole squad ₹800/month on Netflix. The trust score keeps everyone honest.' },
  { name: 'Priya K.',   score: 94, text: 'Love how transparent everything is. You can see everyone\'s payment status in real time.' },
  { name: 'Rahul S.',   score: 87, text: 'The Stripe integration is seamless. Paid my share in under 10 seconds. Incredibly smooth.' },
];

const Testimonials = () => (
  <section className="py-24 bg-[#0F1115]">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-14">
        <p className="font-mono text-xs text-[#F7931A] uppercase tracking-widest mb-3">Social Proof</p>
        <h2 className="font-heading font-bold text-3xl md:text-4xl text-white">
          Trusted by <span className="gradient-text">Real Users</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <div key={i} className="glass rounded-2xl p-7 flex flex-col gap-4">
            <div className="flex gap-1">
              {Array(5).fill(0).map((_, j) => (
                <Star key={j} size={14} className="text-[#FFD600] fill-[#FFD600]" />
              ))}
            </div>
            <p className="text-[#94A3B8] text-sm leading-relaxed flex-1">"{t.text}"</p>
            <div className="flex items-center justify-between">
              <span className="font-heading font-semibold text-white text-sm">{t.name}</span>
              <TrustBadge score={t.score} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── CTA ─────────────────────────────────────────────────────────────────── */
const CTA = () => (
  <section className="py-24 bg-[#030304]">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
      <div className="relative bg-gradient-to-br from-[#0F1115] to-[#030304] border border-[#F7931A]/20 rounded-3xl p-12 overflow-hidden shadow-[0_0_80px_-20px_rgba(247,147,26,0.2)]">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-[#F7931A] opacity-[0.04] blur-[80px] rounded-3xl pointer-events-none" />

        <p className="font-mono text-xs text-[#F7931A] uppercase tracking-widest mb-4">Start Now</p>
        <h2 className="font-heading font-bold text-3xl md:text-5xl text-white mb-4">
          Ready to Split <span className="gradient-text">Smarter?</span>
        </h2>
        <p className="text-[#94A3B8] mb-10 max-w-md mx-auto">
          Join thousands sharing subscription costs. Test mode available — try with Stripe's test card instantly.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto">
              Create Free Account <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/pools">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Browse Pools
            </Button>
          </Link>
        </div>
        <p className="font-mono text-xs text-[#94A3B8] mt-6">
          Test card: 4242 4242 4242 4242 • No real money required
        </p>
      </div>
    </div>
  </section>
);

/* ─── Landing Page ────────────────────────────────────────────────────────── */
const LandingPage = () => (
  <main>
    {/* Hero */}
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />

      {/* Ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#F7931A] opacity-5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#FFD600] opacity-4 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 grid lg:grid-cols-2 gap-16 items-center relative">
        {/* Copy */}
        <div>
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F7931A]/10 border border-[#F7931A]/30 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F7931A] opacity-70" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F7931A]" />
            </span>
            <span className="font-mono text-xs text-[#F7931A] tracking-wider">Live on Stripe Test Mode</span>
          </div>

          <h1 className="font-heading font-bold text-5xl sm:text-6xl md:text-7xl leading-tight text-white mb-6">
            Split Costs.
            <br />
            Build{' '}
            <span className="gradient-text">Trust.</span>
          </h1>

          <p className="text-[#94A3B8] text-lg leading-relaxed mb-8 max-w-lg">
            SplitStream lets groups share subscription costs with real Stripe payments and a dynamic trust score system. No spreadsheets, no drama.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start Splitting <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/pools">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Browse Pools
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-5">
            {[
              'Stripe Secured',
              'JWT Auth',
              'Trust Scoring',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle size={15} className="text-[#F7931A]" />
                <span className="font-mono text-xs text-[#94A3B8] tracking-wide">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Orbital graphic */}
        <div className="flex justify-center lg:justify-end">
          <OrbitalGraphic />
        </div>
      </div>
    </section>

    <StatsTicker />
    <HowItWorks />
    <Features />
    <Testimonials />
    <CTA />
  </main>
);

export default LandingPage;
