import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const EmailVerification = () => {
  const { clearError } = useAuthStore();
  const [resendStatus, setResendStatus] = React.useState(null);

  React.useEffect(() => {
    clearError();
  }, [clearError]);

  const handleResendVerification = async () => {
    setResendStatus('sending');
    try {
      // Here you would call your backend API to resend verification email
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 2000));
      setResendStatus('sent');
      setTimeout(() => setResendStatus(null), 5000);
    } catch (error) {
      setResendStatus('error');
      setTimeout(() => setResendStatus(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F5FA] font-urbanist flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D0FFA4] mb-6">
          <Mail size={32} className="text-[#292D32]" />
        </div>

        <h1 className="text-2xl font-bold text-[#292D32] mb-4">Check Your Email</h1>

        <p className="text-[#5C5C5C] mb-6">
          We've sent a verification link to your email address. Please check your inbox and click the link to activate your account.
        </p>

        <div className="bg-white rounded-xl p-4 mb-6 border border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-[#D0FFA4]" />
            <span className="text-sm text-[#292D32]">Verification email sent successfully</span>
          </div>
        </div>

        <p className="text-sm text-[#5C5C5C] mb-4">
          Didn't receive the email? Check your spam folder or{' '}
          <button
            onClick={handleResendVerification}
            disabled={resendStatus === 'sending'}
            className="text-[#292D32] font-semibold hover:underline disabled:opacity-50"
          >
            {resendStatus === 'sending' ? 'Sending...' : 'resend verification link'}
          </button>
        </p>

        {resendStatus === 'sent' && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            Verification email resent successfully!
          </div>
        )}

        {resendStatus === 'error' && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to resend verification email. Please try again.
          </div>
        )}

        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-[#292D32] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3C4249]"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default EmailVerification;