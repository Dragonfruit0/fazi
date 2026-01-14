import React, { useState, useEffect, useCallback } from 'react';
import { 
  Zap, 
  Plus, 
  History, 
  CreditCard, 
  LogOut, 
  LayoutDashboard, 
  ExternalLink, 
  Copy, 
  Check,
  Search,
  ChevronRight,
  Menu,
  Terminal,
  MousePointer2,
  Layers,
  Maximize2,
  X,
  User as UserIcon
} from 'lucide-react';
import { AppView, UserState, Project, UIVariant } from './types.ts';
import { PRICING_PLANS, FEATURES } from './constants.tsx';
import { Button } from './components/Button.tsx';
import { PaywallModal } from './components/PaywallModal.tsx';
import { ProjectNamingModal } from './components/ProjectNamingModal.tsx';
import { generateUIVariants } from './services/geminiService.ts';
import { UIPreview } from './components/UIPreview.tsx';
import { AuthPage } from './components/AuthPage.tsx';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [user, setUser] = useState<UserState & { details?: any }>({
    isLoggedIn: false,
    flashesRemaining: 1,
    plan: 'FREE'
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isNamingModalOpen, setIsNamingModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fullscreenVariant, setFullscreenVariant] = useState<UIVariant | null>(null);

  const handleStartAuth = () => {
    setView(AppView.AUTH);
  };

  const handleAuthComplete = (userData: any) => {
    setUser(prev => ({ 
      ...prev, 
      isLoggedIn: true, 
      details: userData 
    }));
    setView(AppView.STUDIO);
  };

  const handleLogout = () => {
    setUser({ isLoggedIn: false, flashesRemaining: 1, plan: 'FREE' });
    setView(AppView.LANDING);
    setFullscreenVariant(null);
    setProjects([]);
    setCurrentProject(null);
    setPrompt('');
  };

  const handleInitialGenerate = () => {
    if (!prompt.trim()) return;
    
    // GATE: User must be logged in to generate
    if (!user.isLoggedIn) {
      setView(AppView.AUTH);
      return;
    }

    if (user.flashesRemaining <= 0) {
      setIsPaywallOpen(true);
      return;
    }

    if (!currentProject) {
      setIsNamingModalOpen(true);
    } else {
      executeGeneration(currentProject.name);
    }
  };

  const executeGeneration = async (projectName: string) => {
    setIsNamingModalOpen(false);
    setIsGenerating(true);
    try {
      const variants = await generateUIVariants(prompt);
      
      const projectToUpdate = currentProject || {
        id: `project-${Date.now()}`,
        name: projectName,
        prompt: prompt,
        variants: [],
        createdAt: Date.now()
      };

      const updatedProject = {
        ...projectToUpdate,
        prompt: prompt,
        variants: variants
      };

      if (!currentProject) {
        setProjects(prev => [updatedProject, ...prev]);
      } else {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      }
      
      setCurrentProject(updatedProject);
      setUser(prev => ({ ...prev, flashesRemaining: Math.max(0, prev.flashesRemaining - 1) }));
    } catch (err) {
      console.error(err);
      alert("Generation failed. Please ensure your environment is configured correctly.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderLanding = () => (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center">
      <nav className="w-full max-w-7xl px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setView(AppView.LANDING)}>
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-sm transform rotate-45" />
          </div>
          <span className="font-bold text-xl tracking-tighter">Anqair</span>
        </div>
        <Button variant="ghost" onClick={handleStartAuth}>Log in</Button>
      </nav>

      <main className="flex-1 w-full max-w-5xl px-6 pt-24 pb-32 text-center">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[0.9]">
          Design <span className="text-zinc-600">→</span> Code at the speed of thought
        </h1>
        <p className="text-zinc-500 text-xl md:text-2xl max-w-2xl mx-auto mb-12">
          Prompt once. Get 3 production-ready UI variations instantly. High performance, zero friction.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
          <Button size="lg" onClick={() => setView(AppView.STUDIO)} className="w-full sm:w-auto text-lg h-14 px-10">
            Try 1 Free Flash
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14 px-10">
            View Examples
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-12 text-left pt-24 border-t border-zinc-900">
          {FEATURES.map((f, i) => (
            <div key={i} className="space-y-4">
              <f.icon className={`w-10 h-10 ${f.iconColor}`} />
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-32 py-4 px-8 bg-zinc-900/50 border border-zinc-800 rounded-full inline-flex items-center gap-8 text-sm text-zinc-400">
          <span>1 Free Generation</span>
          <div className="w-1 h-1 bg-zinc-700 rounded-full" />
          <span>₹10 for 3 Generations</span>
          <div className="w-1 h-1 bg-zinc-700 rounded-full" />
          <span>Monthly Plans Available</span>
        </div>
      </main>

      <footer className="w-full max-w-7xl px-6 py-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 text-zinc-600 text-sm">
        <div>© 2024 Anqair Studio Inc.</div>
        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );

  const renderStudio = () => (
    <div className="h-screen flex flex-col bg-[#050505] overflow-hidden">
      <header className="h-16 border-b border-zinc-900 px-4 flex items-center justify-between bg-black/50 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.LANDING)}>
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-black rounded-sm transform rotate-45" />
            </div>
            <span className="font-bold tracking-tighter hidden sm:inline">Anqair</span>
          </div>
          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
          <span className="text-sm font-medium text-zinc-400 truncate max-w-[200px]">
            {currentProject ? currentProject.name : 'Untitled Project'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user.isLoggedIn ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm">
                <Zap className={`w-3.5 h-3.5 ${user.flashesRemaining > 0 ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-600'}`} />
                <span className="text-zinc-300">Flashes: {user.flashesRemaining}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsPaywallOpen(true)} className="hidden sm:flex">
                Refill
              </Button>
              <div className="h-8 w-px bg-zinc-800 mx-2 hidden sm:block" />
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-colors"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <Button size="sm" onClick={handleStartAuth} className="gap-2">
              <UserIcon className="w-4 h-4" />
              Sign in to save
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-zinc-900 bg-[#050505] flex flex-col hidden lg:flex">
          <div className="p-4">
            <Button 
              className="w-full justify-start gap-2 h-10" 
              onClick={() => {
                if (!user.isLoggedIn) {
                  setView(AppView.AUTH);
                } else {
                  setCurrentProject(null);
                  setPrompt('');
                }
              }}
            >
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 space-y-6">
            <div>
              <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 px-2">Projects</h4>
              <div className="space-y-1">
                {user.isLoggedIn ? (
                  projects.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => {
                        setCurrentProject(p);
                        setPrompt(p.prompt);
                      }}
                      className={`w-full text-left px-2 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${currentProject?.id === p.id ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
                    >
                      <LayoutDashboard className="w-4 h-4 opacity-70" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-2 py-4 text-xs text-zinc-600 italic">
                    Log in to view your projects.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-zinc-900 space-y-1">
            <button 
               onClick={() => {
                 if (user.isLoggedIn) setView(AppView.BILLING);
                 else setView(AppView.AUTH);
               }}
               className="w-full text-left px-2 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Billing
            </button>
          </div>
        </aside>

        <main className="flex-1 relative flex flex-col bg-[#050505]">
          {(!currentProject || currentProject.variants.length === 0) && !isGenerating ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="max-w-md w-full text-center space-y-8">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
                    <MousePointer2 className="w-8 h-8 text-zinc-700" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-center">Describe the UI you want</h2>
                  <p className="text-zinc-500 text-center">
                    Anqair will generate 3 unique design directions. Be as specific as you like.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {isGenerating ? (
                 <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] space-y-6">
                    <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
                    <div className="text-center">
                       <h3 className="text-xl font-bold mb-2">Architecting your designs...</h3>
                       <p className="text-zinc-500">Flash UI is generating three distinct directions.</p>
                    </div>
                 </div>
              ) : (
                currentProject?.variants.map((v) => (
                  <div key={v.id} className="flex flex-col h-[600px] bg-[#0f0f0f] border border-zinc-800 rounded-2xl overflow-hidden group shadow-xl">
                    <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-black/20">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded uppercase tracking-wider">
                        {v.label}
                      </span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => copyToClipboard(v.html, v.id)}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        >
                          {copiedId === v.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => setFullscreenVariant(v)}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 relative">
                      <UIPreview html={v.html} />
                    </div>
                    <div className="p-4 border-t border-zinc-800 bg-black/20">
                      <p className="text-xs text-zinc-500 italic">{v.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="p-6 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent">
            <div className="max-w-4xl mx-auto flex items-end gap-2 bg-[#0f0f0f] border border-zinc-800 rounded-2xl p-2 shadow-2xl focus-within:border-zinc-700 transition-all">
              <textarea 
                rows={1}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleInitialGenerate();
                  }
                }}
                placeholder="Describe your UI idea... (e.g., A minimalist checkout form)"
                className="flex-1 bg-transparent text-white px-4 py-3 resize-none focus:outline-none text-sm placeholder:text-zinc-600 min-h-[48px]"
              />
              <Button 
                isLoading={isGenerating}
                onClick={handleInitialGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="h-10 px-6 rounded-xl shrink-0"
              >
                {user.isLoggedIn ? 'Generate' : 'Sign in to generate'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="h-screen flex bg-[#050505]">
      <aside className="w-64 border-r border-zinc-900 bg-[#050505] flex flex-col">
        <div className="p-8">
           <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.STUDIO)}>
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-black rounded-sm transform rotate-45" />
            </div>
            <span className="font-bold tracking-tighter">Anqair</span>
          </div>
        </div>
        <nav className="flex-1 px-4">
           <button 
            onClick={() => setView(AppView.STUDIO)}
            className="w-full text-left px-2 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 flex items-center gap-2 mb-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Back to Studio
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Billing & Usage</h1>
        <div className="space-y-8">
          <section className="p-8 bg-[#0f0f0f] border border-zinc-800 rounded-2xl">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-6">Usage Overview</h3>
            <div className="grid grid-cols-2 gap-12">
              <div>
                <div className="text-zinc-400 text-sm mb-1">Flashes Remaining</div>
                <div className="text-4xl font-bold">{user.flashesRemaining}</div>
              </div>
              <div>
                <div className="text-zinc-400 text-sm mb-1">Current Plan</div>
                <div className="text-4xl font-bold text-white uppercase">{user.plan}</div>
              </div>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-6">
            <div className="p-8 bg-[#0f0f0f] border border-zinc-800 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">Buy More Credits</h3>
                <p className="text-sm text-zinc-500 mb-6">Refill instantly and keep generating.</p>
              </div>
              <Button onClick={() => setIsPaywallOpen(true)}>₹10 → 3 Generations</Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen text-white">
      {view === AppView.LANDING && renderLanding()}
      {view === AppView.AUTH && <AuthPage onComplete={handleAuthComplete} onBack={() => setView(AppView.STUDIO)} />}
      {view === AppView.STUDIO && renderStudio()}
      {view === AppView.BILLING && renderBilling()}
      
      <PaywallModal 
        isOpen={isPaywallOpen} 
        onClose={() => setIsPaywallOpen(false)}
        onSelectSub={() => setIsPaywallOpen(false)}
      />

      <ProjectNamingModal
        isOpen={isNamingModalOpen}
        onClose={() => setIsNamingModalOpen(false)}
        onConfirm={executeGeneration}
        defaultName={prompt.substring(0, 20)}
      />

      {fullscreenVariant && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-black animate-in fade-in duration-200">
          <header className="h-16 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-4">
              <span className="font-bold tracking-tighter text-lg">Anqair Preview</span>
              <div className="h-4 w-px bg-zinc-800" />
              <span className="text-sm text-zinc-400 uppercase tracking-widest">{fullscreenVariant.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => copyToClipboard(fullscreenVariant.html, 'fs-copy')}
              >
                {copiedId === 'fs-copy' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="ml-2">{copiedId === 'fs-copy' ? 'Copied' : 'Copy HTML'}</span>
              </Button>
              <button onClick={() => setFullscreenVariant(null)} className="p-2 ml-4">
                <X className="w-6 h-6" />
              </button>
            </div>
          </header>
          <div className="flex-1">
            <UIPreview html={fullscreenVariant.html} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;