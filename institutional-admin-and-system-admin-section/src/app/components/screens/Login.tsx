import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock } from 'lucide-react';
export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    const success = await login(email, password, remember);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/src/imports/photo_2026-08-21_17-25-13.jpg" alt="Melu'e Foundation" className="h-16 object-contain" />
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">Sign In to Your Account</h1>
          <p className="text-gray-600 text-center mb-8 text-sm">Melu'e Foundation Therapy Portal</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent outline-none"
                    placeholder="you@melue.org"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#38BDF8] focus:border-transparent outline-none"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#38BDF8] focus:ring-[#38BDF8]"
                />
                <span className="text-sm text-gray-700">Remember this device</span>
              </label>

              <button type="button" className="text-sm text-[#38BDF8] hover:underline">
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-[#FCD34D] hover:bg-[#FBBF24] text-gray-900 font-medium py-3 rounded-lg transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 text-center mb-2">Demo Accounts (any password)</p>
            <div className="grid grid-cols-1 gap-1 text-xs text-gray-500">
              {[
                { label: 'Teacher', email: 'teacher@melue.org' },
                { label: 'Coordinator', email: 'coordinator@melue.org' },
                { label: 'Director', email: 'director@melue.org' },
                { label: 'Program Director', email: 'programdirector@melue.org' },
                { label: 'Institutional Admin', email: 'admin@melue.org' },
                { label: 'System Admin', email: 'sysadmin@melue.org' },
                { label: 'Parent', email: 'parent@melue.org' },
              ].map(({ label, email }) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => { setEmail(email); setPassword('demo'); }}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors text-left"
                >
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="text-gray-400">{email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
