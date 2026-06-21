import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ShieldCheck, XCircle } from 'lucide-react';
import authService from '../../services/authService';

const AcceptInvitation = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [status, setStatus] = React.useState(token ? 'ready' : 'error');
    const [error, setError] = React.useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!token) {
            setStatus('error');
            setError('Invitation link is missing.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setStatus('submitting');
        try {
            await authService.acceptInvitation(token, password);
            setStatus('success');
            setTimeout(() => {
                navigate('/login', {
                    state: { message: 'Invitation accepted. You can now log in with your new password.' },
                });
            }, 2500);
        } catch (err) {
            setStatus('ready');
            setError(err.response?.data?.message || 'This invitation link is invalid or has expired.');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F6F5FA] p-6 font-urbanist">
            <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
                {status === 'success' ? (
                    <div className="text-center">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle size={32} className="text-green-600" />
                        </div>
                        <h1 className="mb-3 text-2xl font-bold text-[#292D32]">Invitation Accepted</h1>
                        <p className="text-sm text-[#5C5C5C]">Your account is active. Redirecting you to login...</p>
                    </div>
                ) : status === 'error' ? (
                    <div className="text-center">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                            <XCircle size={32} className="text-red-600" />
                        </div>
                        <h1 className="mb-3 text-2xl font-bold text-[#292D32]">Invalid Invitation</h1>
                        <p className="mb-6 text-sm text-[#5C5C5C]">
                            This invitation link is missing, invalid, or expired.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="rounded-xl bg-[#292D32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3C4249]"
                        >
                            Go to Login
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D0FFA4]">
                                <ShieldCheck size={32} className="text-[#292D32]" />
                            </div>
                            <h1 className="text-2xl font-bold text-[#292D32]">Accept Invitation</h1>
                            <p className="mt-2 text-sm text-[#5C5C5C]">
                                Choose your password to activate your enterprise workspace account.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-[#5C5C5C]">
                  Password
                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                                    placeholder="Create a secure password"
                                />
                            </label>

                            <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.06em] text-[#5C5C5C]">
                  Confirm Password
                </span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                    className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                                    placeholder="Confirm your password"
                                />
                            </label>

                            {error ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#EF4444]">
                                    {error}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={status === 'submitting'}
                                className="w-full rounded-xl bg-[#292D32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3C4249] disabled:opacity-60"
                            >
                                {status === 'submitting' ? 'Activating account...' : 'Accept Invitation'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default AcceptInvitation;