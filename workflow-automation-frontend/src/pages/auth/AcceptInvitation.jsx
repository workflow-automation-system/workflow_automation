import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import authService from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';
const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await authService.acceptInvitation(token, password);
      localStorage.setItem('token', res.token);
      await initializeAuth();
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };
  if (!token) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F6F5FA] font-urbanist">
          <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#EF4444]">
              <AlertCircle size={32} />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-[#292D32]">Invalid Link</h2>
            <p className="text-[#5C5C5C]">The invitation link is invalid or missing the required token.</p>
          </div>
        </div>
    );
  }
  if (success) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F6F5FA] font-urbanist">
          <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D0FFA4] text-[#292D32]">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-[#292D32]">Welcome Aboard!</h2>
            <p className="mb-6 text-[#5C5C5C]">Your invitation has been accepted and your password is set. Redirecting to your dashboard...</p>
            <div className="flex justify-center">
              <Loader2 size={24} className="animate-spin text-[#292D32]" />
            </div>
          </div>
        </div>
    );
  }
  return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F5FA] font-urbanist px-4">
        <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-[#292D32]">Accept Invitation</h1>
            <p className="mt-2 text-sm text-[#5C5C5C]">Choose a secure password to activate your account</p>
          </div>
          {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#EF4444]">
                {error}
              </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#292D32]">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#8A8A8A]">
                  <Lock size={18} />
                </div>
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min. 8 characters"
                    className="w-full rounded-2xl border border-[#E2E8F0] bg-white py-3 pl-11 pr-11 text-[15px] text-[#292D32] outline-none transition-all placeholder:text-[#8A8A8A] focus:border-[#D0FFA4] focus:ring-4 focus:ring-[#D0FFA4]/20"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#8A8A8A] hover:text-[#292D32]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#292D32]">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#8A8A8A]">
                  <Lock size={18} />
                </div>
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat password"
                    className="w-full rounded-2xl border border-[#E2E8F0] bg-white py-3 pl-11 pr-4 text-[15px] text-[#292D32] outline-none transition-all placeholder:text-[#8A8A8A] focus:border-[#D0FFA4] focus:ring-4 focus:ring-[#D0FFA4]/20"
                />
              </div>
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#292D32] py-3.5 text-[15px] font-bold text-white transition-all hover:bg-[#1a1c1e] hover:shadow-lg disabled:opacity-70"
            >
              {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
              ) : (
                  'Accept Invitation'
              )}
            </button>
          </form>
        </div>
      </div>
  );
};

export default AcceptInvitation;