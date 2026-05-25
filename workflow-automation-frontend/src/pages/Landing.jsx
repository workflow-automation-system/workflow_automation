import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Cpu,
  Database,
  GitBranch,
  Globe,
  Layout,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = React.useState(0);

  // Try AI Preview Canvas States
  const [selectedPrompt, setSelectedPrompt] = React.useState(null);
  const [aiStage, setAiStage] = React.useState('idle'); // idle, typing, generating, ready
  const [generatedNodes, setGeneratedNodes] = React.useState([]);

  const steps = [
    {
      title: 'Design Canvas',
      description: 'Map logic visually using custom nodes for triggers, branching condition logic, and loops.',
      icon: <Layout size={18} />,
    },
    {
      title: 'Prompt AI Engine',
      description: 'Describe your automation goal in plain language. Our AI constructs the optimal orchestration topology instantly.',
      icon: <Sparkles size={18} />,
    },
    {
      title: 'Monitor SLAs',
      description: 'Govern and audit operations with granular execution telemetry, failure notifications, and logs.',
      icon: <ShieldCheck size={18} />,
    },
  ];

  const samplePrompts = [
    {
      text: 'Send Slack alert when new Gmail with Invoice matches Stripe payment',
      nodes: [
        { id: 1, label: 'Gmail Trigger', type: 'trigger', icon: <Mail size={16} />, desc: 'On New Message' },
        { id: 2, label: 'Filter Invoice', type: 'condition', icon: <GitBranch size={16} />, desc: 'Has "Invoice"' },
        { id: 3, label: 'Stripe Check', type: 'notion', icon: <Database size={16} />, desc: 'Match Payment ID' },
        { id: 4, label: 'Slack Alert', type: 'slack', icon: <MessageSquare size={16} />, desc: '#billing-alerts' }
      ]
    },
    {
      text: 'Log Webhook payload to Notion database and wait 10 minutes to verify',
      nodes: [
        { id: 1, label: 'Webhook Trigger', type: 'trigger', icon: <Globe size={16} />, desc: 'POST request' },
        { id: 2, label: 'Notion Sync', type: 'notion', icon: <Database size={16} />, desc: 'Append page' },
        { id: 3, label: 'Delay 10m', type: 'delay', icon: <Cpu size={16} />, desc: 'Pause Execution' },
        { id: 4, label: 'Health Status', type: 'chatgpt', icon: <Bot size={16} />, desc: 'GPT verification' }
      ]
    },
    {
      text: 'Trigger weekly ChatGPT summary of Notion docs and email to team',
      nodes: [
        { id: 1, label: 'Cron Schedule', type: 'trigger', icon: <Zap size={16} />, desc: 'Every Monday 9AM' },
        { id: 2, label: 'Notion Fetch', type: 'notion', icon: <Database size={16} />, desc: 'Read docs list' },
        { id: 3, label: 'GPT Summarize', type: 'chatgpt', icon: <Bot size={16} />, desc: 'Condense data' },
        { id: 4, label: 'Email Send', type: 'email', icon: <Mail size={16} />, desc: 'Send to staff' }
      ]
    }
  ];

  const handleRunAiPreview = async (prompt) => {
    setSelectedPrompt(prompt.text);
    setAiStage('typing');
    setGeneratedNodes([]);

    await new Promise((r) => setTimeout(r, 1000));
    setAiStage('generating');

    await new Promise((r) => setTimeout(r, 1200));
    setGeneratedNodes(prompt.nodes);
    setAiStage('ready');
  };

  return (
    <div className="min-h-screen bg-[#1E2125] text-white font-urbanist selection:bg-[#D0FFA4] selection:text-[#292D32] overflow-x-hidden relative">

      {/* Decorative Glow Elements using brand colors */}
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[#D0FFA4]/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] h-[700px] w-[700px] rounded-full bg-blue-500/5 blur-[180px] pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 z-50 w-full border-b border-[#3C4249] bg-[#1E2125]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl h-20 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D0FFA4]">
              <Sparkles size={20} className="text-[#292D32]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">FlowForge</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-400 md:flex">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">How It Works</a>
            <a href="#ai-preview" className="hover:text-white transition-colors">AI Playground</a>
            <a href="#integrations" className="hover:text-white transition-colors">Integrations</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D0FFA4] px-4 py-2.5 text-sm font-semibold text-[#292D32] hover:bg-[#bbef89] transition-all"
            >
              Get Started
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pt-36 pb-20 text-center relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D0FFA4]/20 bg-[#D0FFA4]/5 px-4 py-1.5 text-sm font-semibold text-[#D0FFA4] mb-8">
          <Sparkles size={14} className="animate-pulse text-[#D0FFA4]" />
          Enterprise Automation Orchestration
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl leading-tight text-white">
          Automating Your Workflows <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#D0FFA4] via-teal-300 to-blue-400 bg-clip-text text-transparent">
            On a Single Platform
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-slate-400 leading-relaxed font-light">
          Build, govern, and scale robust business processes. Design canvas connections manually or bootstrap complex pipelines instantly using generative AI helper nodes.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#D0FFA4] px-8 py-4 text-base font-bold text-[#292D32] hover:bg-[#bbef89] hover:scale-[1.02] shadow-[0_0_30px_rgba(208,255,164,0.15)] transition-all"
          >
            Start Building Free
            <ArrowRight size={18} />
          </button>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 rounded-2xl border border-[#3C4249] bg-[#292D32] hover:bg-[#3C4249] px-8 py-4 text-base font-bold text-white transition-all"
          >
            See How it Works
          </a>
        </div>

        {/* Hero mockup */}

      </section>

      {/* Bento Grid Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Engineered for Operational Excellence</h2>
          <p className="text-slate-400 mt-4">Automate without losing governance. We combine the agility of AI generation with the control of enterprise runtimes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <div className="border border-[#3C4249] bg-[#292D32] rounded-3xl p-8 hover:border-[#D0FFA4] shadow-md transition-all group">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D0FFA4]/10 text-[#D0FFA4] mb-6 group-hover:scale-110 transition-transform"><Layout size={22} /></span>
            <h3 className="text-xl font-bold text-white mb-2">Visual Logic Canvas</h3>
            <p className="text-slate-400">Map logic visually using custom trigger and action nodes. Build condition rules, delays, and loop blocks directly on canvas.</p>
          </div>

          <div className="border border-[#3C4249] bg-[#292D32] rounded-3xl p-8 hover:border-[#D0FFA4] shadow-md transition-all group">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 mb-6 group-hover:scale-110 transition-transform"><ShieldCheck size={22} /></span>
            <h3 className="text-xl font-bold text-white mb-2">SLA Telemetry & Audits</h3>
            <p className="text-slate-400">Keep tabs on performance compliance. Gain access to run graphs, successful completion rates, and error traces inside the execution panel.</p>
          </div>

          <div className="border border-[#3C4249] bg-[#292D32] rounded-3xl p-8 hover:border-[#D0FFA4] shadow-md transition-all group">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D0FFA4]/10 text-[#D0FFA4] mb-6 group-hover:scale-110 transition-transform"><Sparkles size={22} /></span>
            <h3 className="text-xl font-bold text-white mb-2">Generative AI Blueprinting</h3>
            <p className="text-slate-400">Provide a simple sentence describing your target workflow and our AI maps out actions, conditions, and settings automatically.</p>
          </div>

        </div>
      </section>

      {/* Interactive Step-by-Step Simulator */}
      <section id="demo" className="bg-[#1E2125] py-20 border-y border-[#3C4249] relative">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight text-white">FlowForge in Action</h2>
              <p className="text-slate-400">Understand the simplified, bulletproof three-step workflow that powers enterprise operations on our platform.</p>

              <div className="mt-8 space-y-4">
                {steps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all flex gap-4 items-start ${activeStep === idx
                      ? 'border-[#D0FFA4] bg-[#D0FFA4]/5 text-white'
                      : 'border-[#3C4249] bg-[#292D32] hover:border-[#D0FFA4] text-slate-300'
                      }`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${activeStep === idx ? 'bg-[#D0FFA4] text-[#292D32]' : 'bg-[#1E2125] text-slate-400'
                      }`}>
                      {step.icon}
                    </span>
                    <div>
                      <h4 className="font-bold text-white">{step.title}</h4>
                      <p className="text-sm text-slate-400 mt-1">{step.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 border border-[#3C4249] bg-[#292D32] rounded-3xl p-6 shadow-2xl relative h-[480px] overflow-hidden flex flex-col justify-between">

              {/* Step 1 Visualizer */}
              {activeStep === 0 && (
                <div className="w-full h-full flex flex-col justify-between animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-[#3C4249] pb-4">
                    <span className="text-sm font-bold text-slate-400">Visual Blueprint Canvas</span>
                    <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center items-center gap-6">

                    <div className="flex items-center gap-4 border border-[#3C4249] bg-[#1E2125] p-4 rounded-xl w-[280px] shadow-md">
                      <span className="h-9 w-9 rounded-lg bg-[#D0FFA4]/10 text-[#D0FFA4] flex items-center justify-center"><Zap size={16} /></span>
                      <div>
                        <h5 className="font-bold text-sm text-white">Stripe Webhook Event</h5>
                        <p className="text-xs text-slate-400">Trigger: charge.succeeded</p>
                      </div>
                    </div>

                    <div className="h-8 w-0.5 bg-gradient-to-b from-[#D0FFA4] to-blue-500" />

                    <div className="flex items-center gap-4 border border-[#3C4249] bg-[#1E2125] p-4 rounded-xl w-[280px] shadow-md">
                      <span className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center"><MessageSquare size={16} /></span>
                      <div>
                        <h5 className="font-bold text-sm text-white">Slack Notify Channel</h5>
                        <p className="text-xs text-slate-400">Action: #billing-logs</p>
                      </div>
                    </div>

                  </div>
                  <p className="text-xs text-center text-slate-500">Visual logic connects endpoints cleanly without manual script writing.</p>
                </div>
              )}

              {/* Step 2 Visualizer */}
              {activeStep === 1 && (
                <div className="w-full h-full flex flex-col justify-between animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-[#3C4249] pb-4">
                    <span className="text-sm font-bold text-slate-400">AI Prompt Processor</span>
                    <span className="text-xs text-[#D0FFA4] font-bold flex items-center gap-1"><Sparkles size={10} /> Model: gemini-flash-latest</span>
                  </div>

                  <div className="flex-1 flex flex-col justify-center px-4">
                    <div className="bg-[#1E2125] rounded-xl p-4 border border-[#3C4249] font-mono text-sm space-y-4 shadow-md">
                      <div className="flex items-start gap-2 text-slate-400">
                        <span className="text-[#D0FFA4] font-bold">&gt;</span>
                        <span>Prompt: "Send a slack notification and email whenever someone completes Stripe checkout"</span>
                      </div>
                      <div className="text-emerald-400 text-xs animate-pulse font-semibold">
                        Analyzing instruction structure...
                      </div>
                      <div className="text-slate-300 text-xs pl-4 space-y-1">
                        <p className="text-white font-bold">Generated Flowchart Draft:</p>
                        <p>1. [Stripe Trigger] -&gt; On charge.succeeded</p>
                        <p>2. [Slack Node] -&gt; Send channel warning log</p>
                        <p>3. [Gmail Node] -&gt; Email buyer invoice receipt</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-center text-slate-500">Natural language translates to production-ready JSON node definitions instantly.</p>
                </div>
              )}

              {/* Step 3 Visualizer */}
              {activeStep === 2 && (
                <div className="w-full h-full flex flex-col justify-between animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-[#3C4249] pb-4">
                    <span className="text-sm font-bold text-slate-400">Operational SLA Compliance</span>
                    <span className="text-xs uppercase bg-[#D0FFA4]/10 text-[#D0FFA4] font-bold px-2 py-0.5 rounded-full">Live Stats</span>
                  </div>

                  <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                    <div className="border border-[#3C4249] bg-[#1E2125] rounded-xl p-4 text-center shadow-md">
                      <span className="text-xs text-slate-400">Active SLA</span>
                      <p className="text-2xl font-bold text-[#D0FFA4] mt-1">99.8%</p>
                    </div>
                    <div className="border border-[#3C4249] bg-[#1E2125] rounded-xl p-4 text-center shadow-md">
                      <span className="text-xs text-slate-400">Total Runs</span>
                      <p className="text-2xl font-bold text-white mt-1">42,860</p>
                    </div>
                    <div className="border border-[#3C4249] bg-[#1E2125] rounded-xl p-4 text-center shadow-md">
                      <span className="text-xs text-slate-400">Failed (24h)</span>
                      <p className="text-2xl font-bold text-rose-500 mt-1">0</p>
                    </div>
                  </div>

                  <div className="bg-[#1E2125] text-slate-300 rounded-xl p-3 border border-[#3C4249] font-mono text-[10px] space-y-1 shadow-md">
                    <p className="text-emerald-400">[19:42:01] Execution #298374 completed successfully in 120ms</p>
                    <p className="text-emerald-400">[19:42:04] Execution #298375 completed successfully in 84ms</p>
                    <p className="text-[#D0FFA4]">[19:42:15] Stripe Event registered: Invoice Sent</p>
                  </div>

                  <p className="text-xs text-center text-slate-500">Monitor telemetry log queues and gauge performance compliance in real-time.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* AI Playground Simulator */}
      <section id="ai-preview" className="mx-auto max-w-6xl px-6 py-20 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Try Our AI Generator</h2>
          <p className="text-slate-400 mt-4">Select a prompt template below to simulate how the FlowForge AI compiles custom workflows in real-time.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunAiPreview(p)}
                  disabled={aiStage === 'typing' || aiStage === 'generating'}
                  className={`w-full text-left p-5 rounded-2xl border transition-all flex flex-col gap-2 ${selectedPrompt === p.text
                    ? 'border-[#D0FFA4] bg-[#292D32] ring-2 ring-[#D0FFA4]/20'
                    : 'border-[#3C4249] bg-[#292D32] hover:bg-[#3C4249]'
                    }`}
                >
                  <span className="text-xs font-bold text-[#D0FFA4] uppercase tracking-wider">Example {idx + 1}</span>
                  <p className="text-sm text-gray-200 font-semibold">"{p.text}"</p>
                </button>
              ))}
            </div>

            <div className="border border-[#3C4249] bg-[#292D32] p-5 rounded-2xl space-y-4 shadow-md">
              <h4 className="font-bold flex items-center gap-2 text-sm text-white">
                <Terminal size={14} className="text-[#D0FFA4]" />
                Generator Console
              </h4>
              <div className="font-mono text-xs text-slate-400 space-y-2 h-24 overflow-y-auto">
                {aiStage === 'idle' && <p className="text-slate-500">Select a prompt template above to initialize...</p>}
                {aiStage === 'typing' && (
                  <p className="text-white animate-pulse">Typing prompt descriptor into parsing queue...</p>
                )}
                {aiStage === 'generating' && (
                  <>
                    <p className="text-slate-300">&gt; Invoking Gemini AI model API...</p>
                    <p className="text-blue-400 animate-pulse">&gt; Compiling JSON pipeline schema nodes...</p>
                  </>
                )}
                {aiStage === 'ready' && (
                  <>
                    <p className="text-emerald-400 font-semibold">&gt; Completed. Model generated 4 connected canvas nodes.</p>
                    <p className="text-white">&gt; Graph is active. Canvas loaded below.</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 border border-[#3C4249] bg-[#292D32] rounded-3xl p-6 flex flex-col justify-between h-[420px] relative overflow-hidden shadow-md">

            {/* Visual grid pattern */}
            <div className="absolute inset-0 canvas-grid-bg opacity-10" />

            <div className="flex justify-between items-center border-b border-[#3C4249] pb-3 z-10">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Mock Sandbox Canvas</span>
              <span className="text-xs text-[#D0FFA4] font-semibold">{aiStage === 'ready' ? 'Flow Rendered' : 'Waiting...'}</span>
            </div>

            <div className="flex-1 flex items-center justify-center z-10 relative">
              {aiStage === 'idle' && (
                <div className="text-center max-w-sm space-y-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D0FFA4]/10 text-[#D0FFA4] mx-auto shadow-md"><Bot size={22} /></span>
                  <p className="text-sm font-semibold text-slate-300">Select a prompt template to start the generator.</p>
                </div>
              )}

              {(aiStage === 'typing' || aiStage === 'generating') && (
                <div className="text-center space-y-3">
                  <div className="h-10 w-10 border-2 border-t-[#D0FFA4] border-r-transparent border-slate-700 rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-slate-400">FlowForge AI is mapping node connections...</p>
                </div>
              )}

              {aiStage === 'ready' && (
                <div className="flex flex-col md:flex-row items-center gap-4 w-full justify-center px-4 animate-scaleUp">
                  {generatedNodes.map((n, index) => (
                    <React.Fragment key={n.id}>
                      {index > 0 && (
                        <div className="hidden md:block w-8 h-[2px] bg-[#D0FFA4]" />
                      )}
                      <div className="border border-[#3C4249] bg-[#1E2125] rounded-xl p-3 w-[150px] shadow-md flex items-center gap-2">
                        <span className="h-7 w-7 rounded-lg bg-[#D0FFA4]/15 text-[#D0FFA4] flex items-center justify-center shrink-0">
                          {n.icon}
                        </span>
                        <div className="min-w-0 text-left">
                          <h6 className="font-bold text-xs truncate text-white">{n.label}</h6>
                          <p className="text-[10px] text-slate-400 truncate">{n.desc}</p>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            <div className="text-center text-[10px] text-slate-500 z-10">
              Note: This is a preview. To create custom canvas flows, log in or sign up.
            </div>

          </div>

        </div>
      </section>

      {/* Integrations Grid */}
      <section id="integrations" className="bg-[#1E2125] border-t border-[#3C4249] py-20 relative">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Connect Your Entire Tool Stack</h2>
            <p className="text-slate-400 mt-4">FlowForge links natively with key workspace suites out of the box, with zero plugin installations required.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 max-w-5xl mx-auto">
            <AppBadge icon={<Mail size={22} />} name="Gmail" />
            <AppBadge icon={<MessageSquare size={22} />} name="Slack" />
            <AppBadge icon={<Database size={22} />} name="Notion" />
            <AppBadge icon={<Bot size={22} />} name="ChatGPT" />
            <AppBadge icon={<Globe size={22} />} name="Webhooks" />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-5xl px-6 py-24 relative z-10 text-center">
        <div className="border border-[#3C4249] bg-[#292D32] rounded-3xl p-12 md:p-16 shadow-2xl relative overflow-hidden">

          <div className="absolute inset-0 bg-gradient-to-r from-[#D0FFA4]/10 to-blue-500/5 pointer-events-none" />

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Ready to Forge Your Automations?</h2>
          <p className="text-slate-400 mt-4 max-w-xl mx-auto font-light">Join product and engineering teams using FlowForge to run reliable, governed logic flows powered by Gemini AI.</p>

          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="rounded-xl bg-[#D0FFA4] px-6 py-3.5 text-sm font-bold text-[#292D32] hover:bg-[#bbef89] transition-all"
            >
              Create Free Account
            </button>
            <button
              onClick={() => navigate('/login')}
              className="rounded-xl border border-[#3C4249] bg-transparent hover:bg-[#3C4249] px-6 py-3.5 text-sm font-bold text-white transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#3C4249] py-12 text-center text-sm text-slate-500 relative z-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#D0FFA4]" />
            <span className="font-bold text-white">FlowForge Inc.</span>
          </div>
          <p>© 2026 FlowForge Inc. All rights reserved. Secure enterprise automation orchestration.</p>
        </div>
      </footer>

    </div>
  );
};

const AppBadge = ({ icon, name }) => (
  <div className="border border-[#3C4249] bg-[#292D32] rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:border-[#D0FFA4] shadow-md transition-all hover:-translate-y-1">
    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E2125] text-[#D0FFA4]">
      {icon}
    </span>
    <span className="font-semibold text-sm text-slate-300">{name}</span>
  </div>
);

export default Landing;
