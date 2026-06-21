import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import authService from '../../services/authService';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearError } = useAuthStore();
  const [status, setStatus] = React.useState('verifying'); // verifying, success, error

  React.useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    const verifyEmail = async () => {
      try {
        // Call backend API to verify email with token
        await authService.verifyEmail(token);
        setStatus('success');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { state: { message: 'Email verified successfully! Please log in.' } });
        }, 3000);
      } catch (error) {
        setStatus('error');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  React.useEffect(() => {
    clearError();
  }, [clearError]);

  return (
      <div className="min-h-screen bg-[#F6F5FA] font-urbanist flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          {status === 'verifying' && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D0FFA4] mb-6 animate-pulse">
                  <CheckCircle size={32} className="text-[#292D32]" />
                </div>
                <h1 className="text-2xl font-bold text-[#292D32] mb-4">Verifying Your Email</h1>
                <p className="text-[#5C5C5C]">Please wait while we verify your email address...</p>
              </>
          )}

          {status === 'success' && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-[#292D32] mb-4">Email Verified!</h1>
                <p className="text-[#5C5C5C] mb-4">Your email has been successfully verified.</p>
                <p className="text-sm text-[#5C5C5C]">Redirecting to login...</p>
              </>
          )}

          {status === 'error' && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
                  <XCircle size={32} className="text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-[#292D32] mb-4">Verification Failed</h1>
                <p className="text-[#5C5C5C] mb-6">The verification link is invalid or has expired.</p>
                <button
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#292D32] px-6 py-3 text-sm font-semibold text-white hover:bg-[#3C4249]"
                >
                  Go to Login
                </button>
              </>
          )}
        </div>
      </div>
  );
};

export default VerifyEmail;