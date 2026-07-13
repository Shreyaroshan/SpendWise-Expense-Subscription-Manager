import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, Eye, Wallet, TrendingUp, RefreshCw, Target } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login, token } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex">
      {/* Left Panel - Decorative */}
      <div className="w-1/2 bg-gradient-to-br from-[#1A2540] to-[#0B1120] relative overflow-hidden flex flex-col justify-center px-16">
        {/* Emerald radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#10B981]/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-xl flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-[#E2E8F0]" style={{ fontFamily: "'Sora', sans-serif" }}>
              SpendWise
            </span>
          </div>

          {/* Tagline */}
          <p className="text-lg text-[#94A3B8] mb-12" style={{ fontFamily: "'Sora', sans-serif" }}>
            Track expenses, manage subscriptions, stay within budget
          </p>

          {/* Feature Highlights */}
          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#10B981]/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#10B981]" />
              </div>
              <div>
                <div className="text-[#E2E8F0] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Smart Expense Tracking
                </div>
                <div className="text-sm text-[#64748B]">Monitor every rupee you spend</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#22D3EE]/10 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-[#22D3EE]" />
              </div>
              <div>
                <div className="text-[#E2E8F0] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Subscription Manager
                </div>
                <div className="text-sm text-[#64748B]">Never miss a renewal date</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#8B5CF6]/10 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-[#8B5CF6]" />
              </div>
              <div>
                <div className="text-[#E2E8F0] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Budget Monitoring
                </div>
                <div className="text-sm text-[#64748B]">Stay on track with your goals</div>
              </div>
            </div>
          </div>

          {/* Floating mockup card */}
          <div className="bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[18px] p-6">
            <div className="text-xs text-[#94A3B8] mb-2">TOTAL SPENT THIS MONTH</div>
            <div className="text-3xl font-medium text-[#E2E8F0]" style={{ fontFamily: "'DM Mono', monospace" }}>
              ₹18,420
            </div>
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs bg-[#10B981]/10 text-[#10B981]">
              <TrendingUp className="w-3 h-3" />
              <span style={{ fontFamily: "'DM Mono', monospace" }}>12% vs last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-1/2 flex items-center justify-center px-16">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-[#E2E8F0] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
            Welcome back
          </h2>
          <p className="text-[#94A3B8] mb-8" style={{ fontFamily: "'Sora', sans-serif" }}>
            Sign in to your SpendWise account
          </p>

          <form className="space-y-5" onSubmit={onSubmit}>
            {/* Email Input */}
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[10px] text-[#E2E8F0] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981]/50 transition-colors"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-11 py-3 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[10px] text-[#E2E8F0] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981]/50 transition-colors"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <Eye className="w-5 h-5 text-[#64748B] hover:text-[#94A3B8]" />
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-[rgba(255,255,255,0.07)] bg-[#111827]" />
                <span className="text-sm text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Remember me
                </span>
              </label>
              <a href="#" className="text-sm text-[#10B981] hover:text-[#059669]" style={{ fontFamily: "'Sora', sans-serif" }}>
                Forgot password?
              </a>
            </div>

            {error && (
              <div className="text-sm text-[#F43F5E]" style={{ fontFamily: "'Sora', sans-serif" }}>
                {error}
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="block w-full py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-center rounded-[10px] font-medium hover:shadow-lg hover:shadow-[#10B981]/20 transition-all"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(255,255,255,0.07)]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0B1120] px-2 text-[#64748B]" style={{ fontFamily: "'Sora', sans-serif" }}>
                  or continue with
                </span>
              </div>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              className="w-full py-3 bg-transparent border border-[rgba(255,255,255,0.07)] text-[#E2E8F0] rounded-[10px] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Continue with Google
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-[#94A3B8] mt-8" style={{ fontFamily: "'Sora', sans-serif" }}>
            Don't have an account?{' '}
            <Link to="/register" className="text-[#10B981] hover:text-[#059669]">
              Register →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}