import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Globe,
  Layout,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#292D32] font-urbanist selection:bg-[#D0FFA4] selection:text-[#292D32] overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 left-0 z-50 w-full border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D0FFA4]">
              <Workflow size={20} className="text-[#292D32]" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#292D32]">AutoFlow</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-bold text-[#64748B] md:flex">
            <a href="#features" className="hover:text-[#292D32] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#292D32] transition-colors">How it Works</a>
            <a href="#integrations" className="hover:text-[#292D32] transition-colors">Integrations</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-[#64748B] hover:text-[#292D32] transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D0FFA4] px-5 py-2.5 text-sm font-bold text-[#292D32] hover:bg-[#BDEB94] transition-all"
            >
              Get Started
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-6 pt-40 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-bold text-[#64748B] mb-8 shadow-sm">
          The Modern Automation Platform
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl leading-tight">
          <span className="text-[#292D32]">Automate your work.</span><br className="hidden sm:inline" />
          <span className="inline-block bg-[#D0FFA4] text-[#292D32] px-6 py-2 mt-4 rounded-[2rem] transform -rotate-2 border-4 border-[#292D32] shadow-[4px_4px_0px_#292D32]">Without the complexity.</span>
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-lg text-[#64748B] leading-relaxed">
          Build, govern, and scale robust business processes effortlessly.
          Use our visual canvas or let AI generate your entire workflow in seconds.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/register')}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[#D0FFA4] px-8 py-4 text-sm font-bold text-[#292D32] hover:bg-[#BDEB94] transition-all shadow-sm"
          >
            Start Building
            <ArrowRight size={16} />
          </button>
          <a
            href="#features"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-8 py-4 text-sm font-bold text-[#292D32] hover:bg-[#F8FAFC] transition-all shadow-sm"
          >
            See Features
          </a>
        </div>
      </section>

      {/* Minimal Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <div className="bg-white rounded-[2rem] p-8 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
            <div className="h-14 w-14 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center mb-6">
              <Layout size={24} className="text-[#292D32]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#292D32] mb-3">Visual Canvas</h3>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Drag and drop nodes to build complex logic. Add conditions, loops, and integrations without writing a single line of code.
            </p>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
            <div className="h-14 w-14 rounded-2xl bg-[#D0FFA4]/20 border border-[#D0FFA4]/50 flex items-center justify-center mb-6">
              <Sparkles size={24} className="text-[#292D32]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#292D32] mb-3">AI Generation</h3>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Just describe what you want to automate in plain English. Our Gemini-powered AI will instantly construct the perfect workflow.
            </p>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
            <div className="h-14 w-14 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center mb-6">
              <ShieldCheck size={24} className="text-[#292D32]" />
            </div>
            <h3 className="text-xl font-extrabold text-[#292D32] mb-3">Enterprise Ready</h3>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Full RBAC permissions, execution telemetry, audit logs, and secure integrations built directly into the platform.
            </p>
          </div>

        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24 border-t border-[#E2E8F0]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-xs font-bold text-[#292D32] mb-6">
            <Zap size={14} className="text-[#D0FFA4] fill-[#D0FFA4]" />
            Simple workflow
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#292D32]">Three steps to automation</h2>
          <p className="text-[#64748B] mt-4">We've removed the learning curve. If you can describe it, you can automate it.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-[#E2E8F0] z-0"></div>

          {[
            { step: '01', title: 'Connect Accounts', desc: 'Securely link your favorite apps with a single click. No API keys needed.' },
            { step: '02', title: 'Design or Generate', desc: 'Drag-and-drop actions on the canvas, or let our AI generate the perfect flow.' },
            { step: '03', title: 'Set Live', desc: 'Hit deploy. We handle the infrastructure, logging, and error retries automatically.' }
          ].map((item, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-white border-8 border-[#F8FAFC] flex items-center justify-center shadow-sm mb-6">
                <span className="text-2xl font-extrabold text-[#292D32]">{item.step}</span>
              </div>
              <h3 className="text-xl font-extrabold text-[#292D32] mb-3">{item.title}</h3>
              <p className="text-sm text-[#64748B] leading-relaxed max-w-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>



      {/* Integrations */}
      <section id="integrations" className="mx-auto max-w-6xl px-6 py-24 border-t border-[#E2E8F0]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-[#292D32]">Connect your tools</h2>
          <p className="text-[#64748B] mt-4">Native integrations with the apps you already use.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          <AppBadge icon={<Mail size={24} />} name="Gmail" />
          <AppBadge icon={<MessageSquare size={24} />} name="Slack" />
          <AppBadge icon={<Sparkles size={24} />} name="Gemini AI" />
          <AppBadge icon={<Globe size={24} />} name="Webhooks" />
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-white border-t border-[#E2E8F0] py-24 text-center">
        <h2 className="text-4xl font-extrabold text-[#292D32]">Ready to automate?</h2>
        <p className="text-[#64748B] mt-4 mb-10">Join thousands of teams building better workflows.</p>
        <button
          onClick={() => navigate('/register')}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#D0FFA4] px-10 py-4 text-sm font-bold text-[#292D32] hover:bg-[#BDEB94] transition-all shadow-sm"
        >
          Get Started Now
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-[#F8FAFC] py-8 text-center text-xs font-bold text-[#64748B] border-t border-[#E2E8F0]">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Workflow size={14} className="text-[#292D32]" />
          <span className="text-[#292D32]">AutoFlow</span>
        </div>
        <p>© 2026 AutoFlow Inc. All rights reserved.</p>
      </footer>

    </div>
  );
};

const AppBadge = ({ icon, name }) => (
  <div className="flex flex-col items-center justify-center gap-4 bg-white border border-[#E2E8F0] rounded-[2rem] w-32 h-32 hover:border-[#292D32] hover:shadow-md transition-all cursor-pointer">
    <div className="text-[#292D32]">
      {icon}
    </div>
    <span className="font-extrabold text-sm text-[#292D32]">{name}</span>
  </div>
);

export default Landing;
;
