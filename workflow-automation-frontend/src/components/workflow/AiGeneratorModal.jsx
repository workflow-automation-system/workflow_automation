import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { workflowApi } from '../../api/workflowApi';
import { Sparkles } from 'lucide-react';

export function AiGeneratorModal({ isOpen, onClose, onUseWorkflow }) {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const workflow = await workflowApi.generateWorkflow(description);
      setResult(workflow);
    } catch (err) {
      setError('error try agin');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Workflow with AI" size="lg">
      {!result ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Describe the workflow you want to build. Our AI will generate the required nodes, connections, and initial configuration.
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your workflow... e.g., Send me daily emails from Gmail, and if it fails post a message to Slack."
            className="w-full min-h-[140px] p-4 rounded-2xl border border-[#E2E8F0] focus:border-[#D0FFA4] focus:outline-none text-sm text-[var(--text-primary)] resize-none"
            rows="5"
          />
          {error && <p className="text-sm text-[#EF4444]">{error}</p>}
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={loading || !description.trim()}
              loading={loading}
            >
              <Sparkles size={16} className="mr-2" />
              {loading ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Preview the generated workflow structure. You can apply it to your canvas to edit and run it.
          </p>
          <div className="border border-[#E2E8F0] rounded-2xl p-4 bg-[var(--surface)] max-h-96 overflow-auto">
            <h4 className="font-semibold text-sm text-[var(--text-primary)] mb-1">
              {result.name}
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              {result.description}
            </p>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Generated Nodes ({result.nodes?.length || 0})
              </span>
              <div className="grid grid-cols-2 gap-2">
                {result.nodes?.map((node, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2.5 border border-[#E2E8F0] rounded-xl bg-white text-xs text-[var(--text-primary)]"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#D0FFA4]" />
                    <div className="truncate">
                      <p className="font-semibold truncate">{node.name}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] capitalize">
                        {node.type?.toLowerCase()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setResult(null)}>
              Try Again
            </Button>
            <Button variant="success" onClick={() => onUseWorkflow(result)}>
              Use This Workflow
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default AiGeneratorModal;
