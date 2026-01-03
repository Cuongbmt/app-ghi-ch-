
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { AuthState, User, JournalEntry, AIInsight } from './types';
import { getEntries, getEntry, saveEntry, deleteEntry } from './services/journalService';
import { analyzeEntry } from './services/geminiService';
import { supabase } from './lib/supabase';

// --- Icons ---
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const IconChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>;
const IconSparkles = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>;

// --- Components ---

const LandingPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center p-6 text-center">
    <div className="max-w-2xl">
      <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">Your Mind, Organized.<br/><span className="text-indigo-600">ZenJournal AI</span></h1>
      <p className="text-lg text-slate-600 mb-8">A distraction-free space for your daily reflections, enhanced with empathetic AI insights to help you understand yourself better.</p>
      <div className="flex gap-4 justify-center">
        <Link to="/signup" className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">Get Started</Link>
        <Link to="/login" className="px-8 py-3 bg-white text-slate-900 font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm">Login</Link>
      </div>
    </div>
  </div>
);

const Dashboard = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      const data = await getEntries(user.id);
      setEntries(data);
      setLoading(false);
    };
    fetchEntries();
  }, [user.id]);

  const handleDelete = async (id: string) => {
    if (confirm("Delete this entry forever?")) {
      await deleteEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 glass px-6 py-4 flex items-center justify-between border-b border-slate-200">
        <h1 className="text-xl font-bold text-indigo-600">ZenJournal</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 hidden sm:inline">Hello, {user.name}</span>
          <button onClick={onLogout} className="text-sm font-medium text-slate-600 hover:text-slate-900">Logout</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">My Journal</h2>
            <p className="text-slate-500">{loading ? 'Loading...' : `${entries.length} memories captured`}</p>
          </div>
          <button 
            onClick={() => navigate('/edit/new')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
          >
            <IconPlus /> New Entry
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconPlus />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Start your journey</h3>
            <p className="text-slate-500">Capture your first thought today.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {entries.map(entry => (
              <div key={entry.id} className="group relative bg-white p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/view/${entry.id}`)}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{entry.title}</h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-opacity"
                  >
                    <IconTrash />
                  </button>
                </div>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{entry.content}</p>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {entry.aiInsights && (
                      <span className="flex items-center text-xs font-medium text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                        AI Analyzed
                      </span>
                    )}
                  </div>
                  {entry.mood && <span className="text-lg">{entry.mood}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const Editor = ({ user, entryId }: { user: User; entryId?: string }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("😊");
  const [existingInsights, setExistingInsights] = useState<AIInsight | undefined | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(!!(entryId && entryId !== 'new'));

  useEffect(() => {
    if (entryId && entryId !== 'new') {
      const load = async () => {
        setIsLoading(true);
        const existing = await getEntry(entryId);
        if (existing) {
          setTitle(existing.title);
          setContent(existing.content);
          setMood(existing.mood || "😊");
          setExistingInsights(existing.aiInsights);
        } else {
          // Handle 404
          navigate('/dashboard');
        }
        setIsLoading(false);
      };
      load();
    }
  }, [entryId, navigate]);

  const handleSave = async () => {
    if (!content.trim()) return alert("Content cannot be empty");
    setIsSaving(true);
    
    let aiInsights = existingInsights;

    // Only re-analyze if content is long enough
    if (content.length > 50) {
      // Logic: we always try to get fresh insights if content is substantial.
      // In a real app, we might check if content changed significantly.
      setIsAnalyzing(true);
      const newInsights = await analyzeEntry(content);
      if (newInsights) {
        aiInsights = newInsights;
      }
      setIsAnalyzing(false);
    } else {
      // If content is very short, clear insights as they might be irrelevant
      aiInsights = null;
    }

    await saveEntry({
      id: entryId === 'new' ? undefined : entryId,
      userId: user.id,
      title: title || new Date().toDateString(),
      content,
      mood,
      aiInsights: aiInsights
    });

    setIsSaving(false);
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
          <IconChevronLeft />
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {isSaving ? (isAnalyzing ? "AI Analyzing..." : "Saving...") : "Save Entry"}
          </button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-6 md:p-12">
        <div className="flex items-center gap-4 mb-6">
          <select 
            value={mood} 
            onChange={(e) => setMood(e.target.value)}
            className="text-2xl bg-slate-50 border-none rounded-xl p-2 cursor-pointer outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {['😊', '😔', '🚀', '😴', '🤯', '🧘', '🤔', '🔥'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input 
            autoFocus
            type="text" 
            placeholder="Give it a title..." 
            className="w-full text-3xl font-bold text-slate-900 placeholder:text-slate-300 outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <textarea 
          placeholder="Start writing your thoughts..."
          className="w-full h-[60vh] text-lg text-slate-700 placeholder:text-slate-300 resize-none outline-none leading-relaxed"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </main>
    </div>
  );
};

const EntryDetail = ({ user, entryId }: { user: User; entryId: string }) => {
  const navigate = useNavigate();
  const [entry, setEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    const load = async () => {
      const found = await getEntry(entryId);
      setEntry(found || null);
    };
    load();
  }, [entryId]);

  if (!entry) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-slate-100">
        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
          <IconChevronLeft />
        </button>
        <button 
          onClick={() => navigate(`/edit/${entry.id}`)}
          className="text-indigo-600 font-medium hover:underline"
        >
          Edit Entry
        </button>
      </header>
      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        <div className="lg:col-span-2 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
             <span className="text-3xl">{entry.mood}</span>
             <span className="text-slate-400 text-sm">{new Date(entry.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-8">{entry.title}</h2>
          <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed text-lg">
            {entry.content}
          </div>
        </div>

        <div className="space-y-6">
          {entry.aiInsights ? (
            <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
              <div className="flex items-center mb-4">
                <IconSparkles />
                <h3 className="font-bold">AI Reflection</h3>
              </div>
              <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                "{entry.aiInsights.moodSummary}"
              </p>
              <div className="mb-6">
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Key Themes</p>
                <div className="flex flex-wrap gap-2">
                  {entry.aiInsights.keyThemes.map((theme, i) => (
                    <span key={i} className="bg-indigo-500/50 px-3 py-1 rounded-lg text-xs font-medium">#{theme}</span>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl">
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Growth Prompt</p>
                <p className="text-sm font-medium">{entry.aiInsights.suggestions}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center">
              <IconSparkles />
              <h3 className="text-slate-900 font-bold mb-1">No AI Insights yet</h3>
              <p className="text-slate-500 text-sm mt-2">Write a bit more to get AI reflections.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const AuthForm = ({ type }: { type: 'login' | 'signup' }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (type === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name }
          }
        });
        if (error) throw error;
        alert("Success! Check your email to confirm your account (or just login if email verification is disabled).");
        navigate('/login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-indigo-600">ZenJournal</Link>
          <h2 className="text-2xl font-bold text-slate-900 mt-4">{type === 'login' ? 'Welcome Back' : 'Join ZenJournal'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input required type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input required type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-200">
            {loading ? 'Processing...' : (type === 'login' ? 'Login' : 'Create Account')}
          </button>
        </form>
        <div className="mt-8 text-center text-sm text-slate-500">
          {type === 'login' ? <p>New here? <Link to="/signup" className="text-indigo-600 font-medium">Create an account</Link></p> : <p>Already have an account? <Link to="/login" className="text-indigo-600 font-medium">Login</Link></p>}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({ user: null, isAuthenticated: false, isLoading: true });

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthState({
          user: { id: session.user.id, email: session.user.email!, name: session.user.user_metadata.display_name || session.user.email!.split('@')[0] },
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthState({
          user: { id: session.user.id, email: session.user.email!, name: session.user.user_metadata.display_name || session.user.email!.split('@')[0] },
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (authState.isLoading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div></div>;

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={authState.isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
        <Route path="/login" element={<AuthForm type="login" />} />
        <Route path="/signup" element={<AuthForm type="signup" />} />
        <Route path="/dashboard" element={authState.isAuthenticated ? <Dashboard user={authState.user!} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/edit/:id" element={authState.isAuthenticated ? <EditWrapper user={authState.user!} /> : <Navigate to="/login" />} />
        <Route path="/view/:id" element={authState.isAuthenticated ? <ViewWrapper user={authState.user!} /> : <Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
}

const EditWrapper = ({ user }: { user: User }) => {
  const { id } = useParams<{ id: string }>();
  return <Editor user={user} entryId={id} />;
};

const ViewWrapper = ({ user }: { user: User }) => {
  const { id } = useParams<{ id: string }>();
  return <EntryDetail user={user} entryId={id!} />;
};
