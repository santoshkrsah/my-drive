import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HardDrive, Eye, EyeOff, Sun, Moon, RefreshCw } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

function generateCaptcha() {
  return {
    a: Math.floor(Math.random() * 10) + 1,
    b: Math.floor(Math.random() * 10) + 1,
  };
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggle } = useDarkMode();

  // CAPTCHA — shown after the first failed login attempt
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const showCaptcha = failedAttempts >= 1;

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setCaptchaError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (showCaptcha) {
      if (parseInt(captchaInput, 10) !== captcha.a + captcha.b) {
        setCaptchaError('Incorrect answer — please try again.');
        refreshCaptcha();
        return;
      }
    }

    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
      setFailedAttempts(prev => prev + 1);
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <style>{`
          @keyframes float1 {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.1; }
            33% { transform: translate(30px, -30px) scale(1.1); opacity: 0.15; }
            66% { transform: translate(-20px, 20px) scale(0.9); opacity: 0.08; }
          }
          @keyframes float2 {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.12; }
            33% { transform: translate(-40px, 30px) scale(0.9); opacity: 0.08; }
            66% { transform: translate(25px, -25px) scale(1.1); opacity: 0.16; }
          }
          @keyframes float3 {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.1; }
            33% { transform: translate(20px, 40px) scale(1.05); opacity: 0.14; }
            66% { transform: translate(-30px, -20px) scale(0.95); opacity: 0.09; }
          }
          @keyframes float4 {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.08; }
            50% { transform: translate(40px, -40px) scale(1.15); opacity: 0.12; }
          }
          @keyframes float5 {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.1; }
            50% { transform: translate(-35px, 35px) scale(0.85); opacity: 0.15; }
          }
          @keyframes pulse1 {
            0%, 100% { transform: scale(1); opacity: 0.05; }
            50% { transform: scale(1.3); opacity: 0.1; }
          }
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-float1 { animation: float1 20s ease-in-out infinite; }
          .animate-float2 { animation: float2 25s ease-in-out infinite; }
          .animate-float3 { animation: float3 30s ease-in-out infinite; }
          .animate-float4 { animation: float4 18s ease-in-out infinite; }
          .animate-float5 { animation: float5 22s ease-in-out infinite; }
          .animate-pulse1 { animation: pulse1 8s ease-in-out infinite; }
          .gradient-animated {
            background: linear-gradient(120deg, #2563eb, #4f46e5, #7c3aed, #2563eb);
            background-size: 300% 300%;
            animation: gradient-shift 15s ease infinite;
          }
        `}</style>
        <div className="absolute inset-0 gradient-animated opacity-50" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-float1" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-float2" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-indigo-400 rounded-full blur-3xl animate-float3" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-400 rounded-full blur-3xl animate-float4" />
          <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-cyan-300 rounded-full blur-3xl animate-float5" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse1" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/15 backdrop-blur-sm rounded-xl">
              <HardDrive size={32} />
            </div>
            <span className="text-3xl font-bold tracking-tight">My Drive</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Your files,<br />anywhere you go.
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-md">
            Securely store, manage, and share your files with a powerful cloud storage platform built for teams and individuals.
          </p>
          <div className="mt-12 flex gap-8 text-blue-200 text-sm">
            <div>
              <p className="text-2xl font-bold text-white">Secure</p>
              <p>Encrypted storage</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Fast</p>
              <p>Lightning uploads</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Simple</p>
              <p>Intuitive interface</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-6 relative overflow-hidden">
        {/* Premium animated background elements for right panel */}
        <style>{`
          @keyframes float-right-1 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(-15px, 15px) rotate(90deg); }
            50% { transform: translate(-25px, 25px) rotate(180deg); }
            75% { transform: translate(-10px, 30px) rotate(270deg); }
          }
          @keyframes float-right-2 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(25px, -20px) rotate(-90deg); }
            50% { transform: translate(35px, -35px) rotate(-180deg); }
            75% { transform: translate(15px, -25px) rotate(-270deg); }
          }
          @keyframes float-right-3 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, 15px) scale(1.1); }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%) rotate(25deg); }
            100% { transform: translateX(200%) rotate(25deg); }
          }
          @keyframes glow-pulse {
            0%, 100% { opacity: 0.04; transform: scale(1); }
            50% { opacity: 0.08; transform: scale(1.15); }
          }
          @keyframes glow-pulse-2 {
            0%, 100% { opacity: 0.03; transform: scale(1.1); }
            50% { opacity: 0.07; transform: scale(0.95); }
          }
          @keyframes orbit {
            0% { transform: rotate(0deg) translateX(150px) rotate(0deg); }
            100% { transform: rotate(360deg) translateX(150px) rotate(-360deg); }
          }
          @keyframes orbit-reverse {
            0% { transform: rotate(360deg) translateX(100px) rotate(-360deg); }
            100% { transform: rotate(0deg) translateX(100px) rotate(0deg); }
          }
          @keyframes gradient-flow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes particle-float {
            0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
            10% { opacity: 0.6; }
            90% { opacity: 0.6; }
            100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 0.3; }
            50% { transform: scale(1.2); opacity: 0; }
            100% { transform: scale(0.8); opacity: 0; }
          }
          .animate-float-right-1 { animation: float-right-1 20s ease-in-out infinite; }
          .animate-float-right-2 { animation: float-right-2 25s ease-in-out infinite; }
          .animate-float-right-3 { animation: float-right-3 15s ease-in-out infinite; }
          .animate-glow-pulse { animation: glow-pulse 8s ease-in-out infinite; }
          .animate-glow-pulse-2 { animation: glow-pulse-2 10s ease-in-out infinite; }
          .animate-orbit { animation: orbit 45s linear infinite; }
          .animate-orbit-reverse { animation: orbit-reverse 35s linear infinite; }
          .animate-shimmer { animation: shimmer 6s ease-in-out infinite; }
          .animate-pulse-ring { animation: pulse-ring 3s ease-out infinite; }
          .gradient-flow-bg {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.04), rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.04), rgba(59, 130, 246, 0.04));
            background-size: 400% 400%;
            animation: gradient-flow 15s ease infinite;
          }
          .dark .gradient-flow-bg {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.03), rgba(99, 102, 241, 0.04), rgba(139, 92, 246, 0.03), rgba(59, 130, 246, 0.03));
          }
        `}</style>

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 gradient-flow-bg" />

        {/* Animated geometric shapes - circles */}
        <div className="absolute top-10 right-10 w-72 h-72 border-2 border-blue-300/20 dark:border-blue-400/10 rounded-full animate-float-right-1" />
        <div className="absolute bottom-20 left-10 w-56 h-56 border-2 border-indigo-300/20 dark:border-indigo-400/10 rounded-full animate-float-right-2" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 border border-purple-300/15 dark:border-purple-400/10 rounded-full animate-float-right-3" />

        {/* Animated squares */}
        <div className="absolute top-1/4 left-1/6 w-24 h-24 border border-blue-200/15 dark:border-blue-400/10 rounded-2xl rotate-45 animate-float-right-1" style={{ animationDelay: '-8s' }} />
        <div className="absolute bottom-1/4 right-1/6 w-20 h-20 border border-indigo-200/15 dark:border-indigo-400/10 rounded-xl rotate-12 animate-float-right-2" style={{ animationDelay: '-12s' }} />

        {/* Orbiting dots - multiple layers */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
          <div className="animate-orbit">
            <div className="w-2.5 h-2.5 bg-blue-400/30 dark:bg-blue-400/15 rounded-full blur-[1px]" />
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
          <div className="animate-orbit" style={{ animationDuration: '55s', animationDelay: '-15s' }}>
            <div className="w-2 h-2 bg-indigo-400/25 dark:bg-indigo-400/12 rounded-full blur-[1px]" />
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
          <div className="animate-orbit-reverse">
            <div className="w-1.5 h-1.5 bg-purple-400/20 dark:bg-purple-400/10 rounded-full" />
          </div>
        </div>

        {/* Glowing orbs with enhanced visibility */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-blue-300/15 to-cyan-300/10 dark:from-blue-500/8 dark:to-cyan-500/5 rounded-full blur-3xl animate-glow-pulse" />
        <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] bg-gradient-to-tr from-indigo-300/15 to-purple-300/10 dark:from-indigo-500/8 dark:to-purple-500/5 rounded-full blur-3xl animate-glow-pulse-2" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-gradient-to-r from-violet-300/10 to-pink-300/8 dark:from-violet-500/5 dark:to-pink-500/4 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '-4s' }} />

        {/* Pulse rings */}
        <div className="absolute top-1/4 right-1/3 w-32 h-32">
          <div className="absolute inset-0 border-2 border-blue-300/20 dark:border-blue-400/10 rounded-full animate-pulse-ring" />
          <div className="absolute inset-0 border-2 border-blue-300/20 dark:border-blue-400/10 rounded-full animate-pulse-ring" style={{ animationDelay: '-1s' }} />
          <div className="absolute inset-0 border-2 border-blue-300/20 dark:border-blue-400/10 rounded-full animate-pulse-ring" style={{ animationDelay: '-2s' }} />
        </div>

        {/* Floating particles */}
        <div className="absolute bottom-0 left-1/4 w-1 h-1 bg-blue-400/40 dark:bg-blue-400/20 rounded-full" style={{ animation: 'particle-float 8s ease-in-out infinite' }} />
        <div className="absolute bottom-0 left-1/3 w-1.5 h-1.5 bg-indigo-400/35 dark:bg-indigo-400/18 rounded-full" style={{ animation: 'particle-float 10s ease-in-out infinite', animationDelay: '-2s' }} />
        <div className="absolute bottom-0 left-1/2 w-1 h-1 bg-purple-400/40 dark:bg-purple-400/20 rounded-full" style={{ animation: 'particle-float 12s ease-in-out infinite', animationDelay: '-4s' }} />
        <div className="absolute bottom-0 left-2/3 w-1.5 h-1.5 bg-blue-400/35 dark:bg-blue-400/18 rounded-full" style={{ animation: 'particle-float 9s ease-in-out infinite', animationDelay: '-6s' }} />
        <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-cyan-400/40 dark:bg-cyan-400/20 rounded-full" style={{ animation: 'particle-float 11s ease-in-out infinite', animationDelay: '-3s' }} />

        {/* Shimmer effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -inset-full w-[300%] h-full bg-gradient-to-r from-transparent via-white/[0.07] to-transparent dark:via-white/[0.03] animate-shimmer" />
        </div>
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition z-20"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="w-full max-w-[420px] animate-in relative z-10">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl">
              <HardDrive size={24} />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">My Drive</span>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in to access your files</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                  <svg className="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Username or Email</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-gray-50/50 focus:bg-white dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:placeholder-gray-400 dark:focus:bg-slate-700/50"
                  placeholder="Enter username or email"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-gray-50/50 focus:bg-white dark:border-slate-600 dark:bg-slate-700/50 dark:text-white dark:placeholder-gray-400 dark:focus:bg-slate-700/50"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* CAPTCHA — shown after the first failed login attempt */}
              {showCaptcha && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    Security Check
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 font-mono select-none">
                      {captcha.a} + {captcha.b} = ?
                    </span>
                    <input
                      type="number"
                      value={captchaInput}
                      onChange={(e) => { setCaptchaInput(e.target.value); setCaptchaError(''); }}
                      className="w-20 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-center focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white dark:bg-slate-700 dark:text-white"
                      placeholder="?"
                      required
                    />
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/30 transition"
                      title="New question"
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>
                  {captchaError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{captchaError}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner spinner-sm border-white/30 border-t-white" />
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 flex flex-col items-center gap-1">
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              My Drive &middot; Cloud Storage Platform
            </p>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              &copy; {new Date().getFullYear()} | Designed By &ndash;{' '}
              <span className="relative group inline-block">
                <a
                  href="https://santoshkr.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition"
                >
                  Santosh Kr.
                </a>
                {/* Tooltip */}
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  All About Me
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
                </span>
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
