import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, Building2, Check, Lock, Mail, User, Workflow, Users, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const Register = () => {
  const navigate = useNavigate();
  const { clearError, error, isAuthenticated, isLoading, register } = useAuthStore();
  const [step, setStep] = React.useState(1);
  const [accountType, setAccountType] = React.useState(null); // 'admin' or 'member'
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    organizationName: '',
    department: '',
    jobTitle: '',
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = React.useState({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  React.useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateStep2 = () => {
    const errors = {};
    if (!formData.organizationName.trim()) {
      errors.organizationName = 'Organization name is required';
    }
    if (!formData.department.trim()) errors.department = 'Department is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step === 1) {
      if (accountType) setStep(2);
      return;
    }
    if (step === 2) {
      if (validateStep2()) setStep(3);
      return;
    }
    if (!validateStep3()) return;

    const submitOrgName = formData.organizationName.trim();

    const result = await register({
      name: formData.name.trim(),
      email: formData.email.trim(),
      organizationName: submitOrgName,
      department: formData.department.trim(),
      jobTitle: formData.jobTitle.trim(),
      password: formData.password,
    });
    if (result.success) navigate('/email-verification');
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
            Orchestrate enterprise operations.
          </h1>

          <p className="mt-4 text-base leading-relaxed text-[#292D32]/80">
            Build and run secure automated pipelines in a single platform.
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

          <h2 className="text-2xl font-bold text-[#292D32]">Create account</h2>
          <p className="mt-1 text-sm text-[#5C5C5C]">
            {step === 1 && "Choose your role to get started."}
            {step === 2 && "Provide your organization details."}
            {step === 3 && "Complete your user profile."}
          </p>

          <form onSubmit={handleSubmit} className="enterprise-card mt-6 space-y-4 p-6 shadow-sm">
            {/* Step Indicator */}
            <div className="mb-6 flex items-center justify-between border-b border-[#E7EBF1] pb-4">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${step > 1 ? 'bg-[#D0FFA4] text-[#292D32]' : 'bg-[#292D32] text-white'}`}>
                {step > 1 ? <Check size={12} /> : '1'}
              </div>
              <div className="mx-2 h-[2px] flex-1 bg-[#E7EBF1]" />
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${step > 2 ? 'bg-[#D0FFA4] text-[#292D32]' : step === 2 ? 'bg-[#292D32] text-white' : 'border border-[#E2E8F0] bg-white text-[#8D95A1]'}`}>
                {step > 2 ? <Check size={12} /> : '2'}
              </div>
              <div className="mx-2 h-[2px] flex-1 bg-[#E7EBF1]" />
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${step === 3 ? 'bg-[#292D32] text-white' : 'border border-[#E2E8F0] bg-white text-[#8D95A1]'}`}>
                3
              </div>
            </div>

            {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-[#EF4444]">{error}</div>}

            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div
                  onClick={() => setAccountType('admin')}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${accountType === 'admin' ? 'border-[#D0FFA4] bg-[#F8FFEE]' : 'border-[#E2E8F0] hover:border-[#292D32]'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accountType === 'admin' ? 'bg-[#D0FFA4] text-[#292D32]' : 'bg-[#E2E8F0] text-[#8D95A1]'}`}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#292D32] text-sm">Create New Workspace</h3>
                      <p className="text-xs text-[#5C5C5C]">I am setting up the platform</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setAccountType('member')}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${accountType === 'member' ? 'border-[#D0FFA4] bg-[#F8FFEE]' : 'border-[#E2E8F0] hover:border-[#292D32]'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accountType === 'member' ? 'bg-[#D0FFA4] text-[#292D32]' : 'bg-[#E2E8F0] text-[#8D95A1]'}`}>
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#292D32] text-sm">Join Existing Workspace</h3>
                      <p className="text-xs text-[#5C5C5C]">I am joining my team</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!accountType}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#292D32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3C4249] disabled:opacity-50"
                >
                  Continue
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <Field
                  label={accountType === 'admin' ? "New Organization Name" : "Existing Organization Name"}
                  icon={Building2}
                  value={formData.organizationName}
                  onChange={(value) => setFormData((prev) => ({ ...prev, organizationName: value }))}
                  placeholder="Acme Corporation"
                  error={formErrors.organizationName}
                />

                <Field
                  label="Department"
                  icon={BriefcaseBusiness}
                  value={formData.department}
                  onChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
                  placeholder="Operations"
                  error={formErrors.department}
                />

                <Field
                  label="Job Title"
                  icon={BriefcaseBusiness}
                  value={formData.jobTitle}
                  onChange={(value) => setFormData((prev) => ({ ...prev, jobTitle: value }))}
                  placeholder="Automation Lead"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#292D32] hover:bg-[#E2E8F0]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#292D32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3C4249]"
                  >
                    Next Step
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <Field
                  label="Full Name"
                  icon={User}
                  value={formData.name}
                  onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
                  placeholder="John Doe"
                  error={formErrors.name}
                />

                <Field
                  label="Work Email"
                  icon={Mail}
                  type="email"
                  value={formData.email}
                  onChange={(value) => setFormData((prev) => ({ ...prev, email: value }))}
                  placeholder="email@example.com"
                  error={formErrors.email}
                />

                <Field
                  label="Password"
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(value) => setFormData((prev) => ({ ...prev, password: value }))}
                  placeholder="••••••••"
                  showPasswordToggle={true}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />

                <Field
                  label="Confirm Password"
                  icon={Lock}
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(value) => setFormData((prev) => ({ ...prev, confirmPassword: value }))}
                  placeholder="••••••••"
                  showPasswordToggle={true}
                  showPassword={showConfirmPassword}
                  onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                />

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#292D32] hover:bg-[#E2E8F0]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#292D32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3C4249] disabled:opacity-60"
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </form >

          <p className="mt-5 text-center text-sm text-[#5C5C5C]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#292D32] hover:underline">
              Sign in
            </Link>
          </p>
        </div >
      </section >
    </div>
  );
};

const Field = ({ label, icon: Icon, value, onChange, type = 'text', placeholder, error, showPasswordToggle, showPassword, onTogglePassword }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-[#5C5C5C]">{label}</span>
    <div className="relative">
      <Icon className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${error ? 'text-[#EF4444]' : 'text-[#8A8A8A]'}`} />
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border ${error ? 'border-[#EF4444] focus:border-[#EF4444]' : 'border-[#E2E8F0] focus:border-[#D0FFA4]'} bg-white py-2.5 pl-9 ${showPasswordToggle ? 'pr-10' : 'pr-3'} text-sm text-[#292D32] focus:outline-none`}
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A8A] hover:text-[#292D32]"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
    {error && <span className="mt-1 block text-xs text-[#EF4444]">{error}</span>}
  </label>
);

export default Register;
