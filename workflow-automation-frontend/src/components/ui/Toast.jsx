import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const toneClasses = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-[#D0FFA4] bg-[#F4FFE8] text-[#292D32]',
  info: 'border-[#E2E8F0] bg-white text-[#292D32]',
};

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

const Toast = ({ open, message, tone = 'info', onClose, duration = 3200 }) => {
  React.useEffect(() => {
    if (!open || !onClose) {
      return undefined;
    }

    const timeout = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timeout);
  }, [duration, onClose, open]);

  if (!open || !message) {
    return null;
  }

  const Icon = icons[tone] || Info;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70]">
      <div
        className={[
          'pointer-events-auto flex max-w-sm items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg',
          toneClasses[tone] || toneClasses.info,
        ].join(' ')}
        role="status"
        aria-live="polite"
      >
        <Icon size={16} className="mt-0.5 shrink-0" />
        <p>{message}</p>
      </div>
    </div>
  );
};

export default Toast;
