import React from 'react';
import Modal from '../ui/Modal';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const ExecutionStepsModal = ({ isOpen, onClose, steps, executionId, isLoading }) => {
  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return date.toLocaleTimeString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Execution Logs: #${executionId}`}>
      <div className="space-y-4 font-urbanist max-h-[70vh] overflow-y-auto pr-2">
        {isLoading ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[#5C5C5C]">Loading logs...</p>
          </div>
        ) : steps.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[#5C5C5C]">No steps recorded for this execution.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isSuccess = step.status === 'COMPLETED';
              return (
                <div key={step.id || index} className="rounded-xl border border-[#E2E8F0] p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-md ${isSuccess ? 'bg-[#D0FFA4]/20' : 'bg-red-50'}`}>
                        {isSuccess ? <CheckCircle2 size={14} className="text-[#292D32]" /> : <AlertCircle size={14} className="text-[#EF4444]" />}
                      </div>
                      <span className="text-sm font-semibold text-[#292D32]">{step.nodeName}</span>
                    </div>
                    <span className="text-[10px] font-medium text-[#5C5C5C] flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(step.executedAt)}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#5C5C5C] bg-[#E2E8F0] p-2 rounded-lg break-all">
                    {step.logMessage || 'No log details.'}
                  </p>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#292D32] px-6 py-2 text-sm font-semibold text-white hover:bg-[#3C4249]"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExecutionStepsModal;
