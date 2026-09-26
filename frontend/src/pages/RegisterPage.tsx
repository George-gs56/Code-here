import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { ShieldCheck, User, Mail, Lock, CheckCircle2, Code2 } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmationMessage(null);

    if (!terms) {
      setError('You must accept the terms and conditions');
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, username, email, password, confirmPassword, terms }),
      });

      if (res.confirmationRequired) {
        setConfirmationMessage(res.message);
      } else {
        login(res.token, res.user);
        onNavigate('onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-zinc-100 py-12 px-4">
      <div className="w-full max-w-md space-y-8 bg-zinc-900/90 rounded-3xl p-8 border border-zinc-800 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/30 mb-3 shadow-lg shadow-red-500/10">
            <Code2 className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Create your CodeSphere account</h2>
          <p className="mt-2 text-xs text-zinc-400">Join thousands of engineers learning, practising, and excelling.</p>
        </div>

        {confirmationMessage ? (
          <div className="space-y-4 text-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Check Your Inbox!</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">{confirmationMessage}</p>
            <button
              onClick={() => onNavigate('login')}
              className="w-full rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-bold text-white mt-2 shadow-lg shadow-red-600/20"
            >
              Proceed to Sign In
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="User Williams"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-red-500/80 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Unique Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Userw"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-red-500/80 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="User@example.com"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-red-500/80 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-red-500/80 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-red-500/80 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-950 text-red-500 focus:ring-red-500 h-4 w-4"
                />
                <label htmlFor="terms" className="text-xs text-zinc-400">
                  I agree to the <a href="#" className="text-red-400 hover:underline">Terms of Service</a> and <a href="#" className="text-red-400 hover:underline">Privacy Policy</a>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-extrabold text-white transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} className="font-bold text-red-400 hover:underline">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};
