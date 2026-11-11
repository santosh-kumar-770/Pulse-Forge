import React, { useState } from 'react';
import { Flame, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginView() {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleTitle, setRoleTitle] = useState('Full-Stack Engineer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    {
      name: 'Alex Rivera',
      email: 'alex@pulseforge.dev',
      role: 'Principal Architect & Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80',
    },
    {
      name: 'Sophia Chen',
      email: 'sophia@pulseforge.dev',
      role: 'AI/ML Engineer',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80',
    },
    {
      name: 'Marcus Vance',
      email: 'marcus@pulseforge.dev',
      role: 'Product Designer & Frontend',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80',
    },
    {
      name: 'Elena Rostova',
      email: 'elena@pulseforge.dev',
      role: 'Full-Stack & DevOps',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await signup({
          name: name.trim(),
          email: email.trim(),
          password,
          role_title: roleTitle.trim(),
        });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail) => {
    setError('');
    setIsSubmitting(true);
    try {
      await login(demoEmail, 'hackathon123');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 selection:bg-indigo-500/30">
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl shadow-xl shadow-indigo-600/30 text-white mb-3">
            <Flame className="w-8 h-8 fill-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            PulseForge
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-md">
              WAR ROOM
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            High-velocity workspace & roadmap tracker for hackathons & startup sprints
          </p>
        </div>

        {/* Auth Box */}
        <div className="p-5 sm:p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl mb-6">
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{typeof error === 'string' ? error : JSON.stringify(error)}</span>
              </div>
              {mode === 'login' && typeof error === 'string' && error.includes('Create Account') && (
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className="self-start text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition"
                >
                  👉 Click here to switch to Create Account
                </button>
              )}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role / Focus</label>
                  <input
                    type="text"
                    placeholder="AI Engineer / Lead Architect"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="alex@pulseforge.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-2 active:scale-95"
            >
              {isSubmitting ? (
                'Processing...'
              ) : mode === 'login' ? (
                <>
                  Enter War Room <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                'Create Hacker Account & Enter'
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts (Only on login) */}
          {mode === 'login' && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                <span>Quick Demo Hackers</span>
                <span className="text-[10px] text-indigo-400 font-mono">1-Click Login</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleDemoLogin(account.email)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 p-2 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all group active:scale-95"
                  >
                    <img
                      src={account.avatar}
                      alt={account.name}
                      className="w-7 h-7 rounded-lg object-cover border border-slate-700 shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 truncate">
                        {account.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{account.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
