import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Workflow } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const ForgotPassword = () => {
  const { requestPasswordReset, isLoading } = useAuthStore();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!email) {
      setError('Email is required');
      return;
    }

    const result = await requestPasswordReset(email);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'An error occurred');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F5FA] font-urbanist">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D0FFA4]">
              <Workflow size={26} className="text-[#292D32]" />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-[#292D32]">Recover Password</h1>
            <p className="mt-2 text-sm text-[#5C5C5C]">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="enterprise-card p-6 shadow-sm">
            {success ? (
              <div className="text-center">
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                  If an account with that email exists, we've sent a password reset link. Please check your inbox.
                </div>
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#292D32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3C4249]"
                >
                  Return to Login
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-[#EF4444]">{error}</div>}

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#5C5C5C]">Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                      placeholder="you@company.com"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#292D32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3C4249] disabled:opacity-60"
                >
                  {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                  <ArrowRight size={14} />
                </button>

                <p className="text-center text-sm text-[#5C5C5C]">
                  Remember your password?{' '}
                  <Link to="/login" className="font-semibold text-[#292D32] hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
