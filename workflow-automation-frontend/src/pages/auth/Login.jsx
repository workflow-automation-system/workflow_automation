import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Workflow } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearError, error, isAuthenticated, isLoading, login } = useAuthStore();
  const [formData, setFormData] = React.useState({ email: '', password: '' });
  const [formErrors, setFormErrors] = React.useState({});
  const [successMessage] = React.useState(location.state?.message || null);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  React.useEffect(() => {
    clearError();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    const errors = {};
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate('/');
    } else if (result.needsVerification) {
      navigate('/email-verification', { state: { email: formData.email } });
    }
  };

  return (
    <div className="min-h-screen bg-white font-urbanist lg:grid lg:grid-cols-[1fr_2fr]">
      <section className="hidden bg-[#D0FFA4] p-16 lg:flex lg:flex-col lg:justify-center relative">
        <div className="max-w-sm mx-auto">
          <div className="mb-10 flex items-center gap-3">
            <Workflow size={28} className="text-[#292D32]" />
            <span className="text-2xl font-bold tracking-tight text-[#292D32]">AutoFlow</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[#292D32]">
            Business Automation for Enterprise.
          </h1>

          <p className="mt-4 text-base leading-relaxed text-[#292D32]/80">
            Build secure, scalable automations across teams with enterprise orchestration and robust execution controls.
          </p>
        </div>
      </section>

      <section className="relative flex items-center justify-center p-6">

        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D0FFA4]">
              <Workflow size={26} className="text-[#292D32]" />
            </div>
            <h1 className="mt-3 text-2xl font-bold text-[#292D32]">AutoFlow</h1>
          </div>

          <h2 className="text-2xl font-bold text-[#292D32]">Welcome back</h2>
          <p className="mt-1 text-sm text-[#5C5C5C]">Sign in to your enterprise workspace.</p>

          <form onSubmit={handleSubmit} className="enterprise-card mt-6 space-y-5 p-6">
            {successMessage && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{successMessage}</div>}
            {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-[#EF4444]">{error}</div>}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#5C5C5C]">Email</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                  placeholder="email@example.com"
                />
              </div>
              {formErrors.email && <span className="mt-1 block text-xs text-[#EF4444]">{formErrors.email}</span>}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#5C5C5C]">Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none"
                  placeholder="Enter your password"
                />
              </div>
              {formErrors.password && <span className="mt-1 block text-xs text-[#EF4444]">{formErrors.password}</span>}
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-xs font-semibold text-[#5C5C5C] hover:text-[#292D32] hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#292D32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3C4249] disabled:opacity-60"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
              <ArrowRight size={14} />
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-[#5C5C5C]">
            Do not have an account?{' '}
            <Link to="/register" className="font-semibold text-[#292D32] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Login;
