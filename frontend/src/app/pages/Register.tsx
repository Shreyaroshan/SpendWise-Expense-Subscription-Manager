import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, User, Wallet, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const navigate = useNavigate();
  const { register, token } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept Terms & Conditions');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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

          {/* Progress Steps */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-[#10B981] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                1
              </div>
              <div>
                <div className="text-[#10B981] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Create Account
                </div>
                <div className="text-sm text-[#64748B]">Sign up with your details</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-[#1A2540] border-2 border-[#22D3EE] rounded-full flex items-center justify-center text-[#22D3EE] font-semibold text-sm">
                2
              </div>
              <div>
                <div className="text-[#94A3B8] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Set Budget
                </div>
                <div className="text-sm text-[#64748B]">Configure your spending limits</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-[#1A2540] border-2 border-[rgba(255,255,255,0.07)] rounded-full flex items-center justify-center text-[#64748B] font-semibold text-sm">
                3
              </div>
              <div>
                <div className="text-[#94A3B8] font-medium" style={{ fontFamily: "'Sora', sans-serif" }}>
                  Track!
                </div>
                <div className="text-sm text-[#64748B]">Start managing your finances</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-1/2 flex items-center justify-center px-16">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-[#E2E8F0] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
            Create your account
          </h2>
          <p className="text-[#94A3B8] mb-8" style={{ fontFamily: "'Sora', sans-serif" }}>
            Start your journey to better financial management
          </p>

          <form className="space-y-5" onSubmit={onSubmit}>
            {/* Full Name Input */}
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[10px] text-[#E2E8F0] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981]/50 transition-colors"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                />
              </div>
            </div>

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
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[10px] text-[#E2E8F0] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981]/50 transition-colors"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                />
              </div>
              {/* Password strength indicator */}
              <div className="mt-2 h-1.5 bg-[#0B1120] rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-[#F59E0B]"></div>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">Password strength: Medium</p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[10px] text-[#E2E8F0] placeholder:text-[#64748B] focus:outline-none focus:border-[#10B981]/50 transition-colors"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                />
              </div>
            </div>

            {/* Currency Preference */}
            <div>
              <label className="block text-sm text-[#94A3B8] mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                Currency Preference
              </label>
              <div className="relative">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111827] border border-[rgba(255,255,255,0.07)] rounded-[10px] text-[#E2E8F0] focus:outline-none focus:border-[#10B981]/50 transition-colors appearance-none"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  <option value="INR">INR ₹</option>
                  <option value="USD">USD $</option>
                  <option value="EUR">EUR €</option>
                  <option value="GBP">GBP £</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B] pointer-events-none" />
              </div>
            </div>

            {/* Terms & Conditions */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-[rgba(255,255,255,0.07)] bg-[#111827]"
              />
              <span className="text-sm text-[#94A3B8]" style={{ fontFamily: "'Sora', sans-serif" }}>
                I agree to the{' '}
                <a href="#" className="text-[#10B981] hover:text-[#059669]">
                  Terms & Conditions
                </a>
              </span>
            </label>

            {error && (
              <div className="text-sm text-[#F43F5E]" style={{ fontFamily: "'Sora', sans-serif" }}>
                {error}
              </div>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="block w-full py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-center rounded-[10px] font-medium hover:shadow-lg hover:shadow-[#10B981]/20 transition-all"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-[#94A3B8] mt-8" style={{ fontFamily: "'Sora', sans-serif" }}>
            Already have an account?{' '}
            <Link to="/login" className="text-[#10B981] hover:text-[#059669]">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}