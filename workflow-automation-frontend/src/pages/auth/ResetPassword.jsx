import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Lock, Workflow } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword, isLoading } = useAuthStore();
  
  const [passwords, setPasswords] = React.useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (passwords.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await resetPassword(token, passwords.newPassword);
    if (result.success) {
      navigate('/login', { state: { message: 'Password reset successfully. Please sign in.' } });
    } else {
      setError(result.error || 'An error occurred');
    }
  };

  if (!token) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F5FA] font-urbanist">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D0FFA4]">
              <Workflow size={26} className="text-[#292D32]" />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-[#292D32]">Set New Password</h1>
            <p className="mt-2 text-sm text-[#5C5C5C]">
              Please enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="enterprise-card p-6 shadow-sm">
            <div className="space-y-5">
              {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-[#EF4444]">{error}</div>}

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#5C5C5C]">New Password</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#5C5C5C]">Confirm New Password</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                    placeholder="Confirm password"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#292D32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3C4249] disabled:opacity-60"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
