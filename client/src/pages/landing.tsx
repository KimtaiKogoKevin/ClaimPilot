import { useLocation } from "wouter";
import { Shield, Brain, Zap, Clock, CheckCircle, ArrowRight, ChevronRight, FileText, BarChart3, Users } from "lucide-react";
import AppHeader from "@/components/AppHeader";

const STATS = [
  { value: "98%", label: "Accuracy rate", sub: "AI damage detection" },
  { value: "4h", label: "Avg. resolution", sub: "From submit to review" },
  { value: "60%", label: "Faster processing", sub: "vs. traditional methods" },
  { value: "24/7", label: "Always available", sub: "Submit anytime" },
];

const FEATURES = [
  {
    icon: Brain,
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
    title: "AI Damage Assessment",
    description: "Computer vision instantly identifies vehicle damage from photos, providing confidence scores and repair cost estimates.",
  },
  {
    icon: FileText,
    color: "from-blue-500 to-blue-700",
    bg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Smart Claim Forms",
    description: "Intelligent multi-step forms with auto-save, draft restoration, and conditional fields that adapt to your situation.",
  },
  {
    icon: BarChart3,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Real-time Analytics",
    description: "Administrators get live dashboards with claim distributions, settlement rates, and trend analytics.",
  },
  {
    icon: Users,
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    title: "Collaborative Review",
    description: "Insurers can review, edit, and approve claims directly, with real-time collaboration and full audit trails.",
  },
  {
    icon: Zap,
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-50",
    iconColor: "text-pink-600",
    title: "Instant Processing",
    description: "Automated validation and AI-assisted triage means claims move through review stages faster than ever.",
  },
  {
    icon: Shield,
    color: "from-slate-600 to-slate-800",
    bg: "bg-slate-50",
    iconColor: "text-slate-600",
    title: "Enterprise Security",
    description: "Role-based access control, encrypted storage, secure authentication, and full audit logging built in.",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Submit your claim", description: "Fill in your policy details, upload photos of the damage, and complete the guided form — takes under 10 minutes." },
  { step: "02", title: "AI analyzes damage", description: "Our computer vision model scans your photos, identifies damage types, and estimates repair costs automatically." },
  { step: "03", title: "Expert review", description: "Your insurer reviews the AI-generated report alongside your submission for fast, accurate processing." },
  { step: "04", title: "Settlement issued", description: "Once approved, settlement is processed and you receive confirmation — no back-and-forth paperwork." },
];

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-violet-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              AI-powered claims management
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6 animate-slide-up">
              Motor insurance claims,{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                resolved faster
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Submit a claim in minutes. Our AI assesses vehicle damage instantly, giving insurers everything they need to process your claim quickly and accurately.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <button
                onClick={() => setLocation('/auth/insured')}
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Submit a claim
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setLocation('/auth')}
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
              >
                Sign in
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-extrabold text-foreground tracking-tight">{stat.value}</div>
                <div className="text-sm font-semibold text-foreground mt-1">{stat.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-slate-50/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              Everything your team needs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From intelligent photo analysis to admin dashboards — the entire claims workflow in one platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
              >
                <div className={`w-11 h-11 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              From accident to settlement in four straightforward steps.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-border -z-0" style={{ width: 'calc(100% - 2.5rem)', left: '2.5rem' }} />
                )}
                <div className="relative z-10">
                  <div className="text-xs font-bold text-primary mb-3 tracking-widest">{item.step}</div>
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-blue-100 mb-10 max-w-xl mx-auto">
            Join thousands of policy holders who process their claims faster with ClaimFlow AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setLocation('/auth/insured')}
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:-translate-y-0.5"
            >
              Create an account
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLocation('/auth')}
              className="inline-flex items-center justify-center gap-2 bg-white/15 text-white font-semibold px-8 py-3.5 rounded-xl border border-white/30 hover:bg-white/25 transition-all duration-200"
            >
              Sign in
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
              <Shield className="text-white h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold text-white">ClaimFlow AI</span>
          </div>
          <p className="text-xs">&copy; {new Date().getFullYear()} ClaimFlow AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
