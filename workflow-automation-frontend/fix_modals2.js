const fs = require('fs');
const file = 'c:/dev/my-projects/pfa/workflow-automation-frontend/src/pages/WorkflowDetail.jsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const correctEnd = `      <ExecuteWorkflowModal
        isOpen={showExecuteModal}
        onClose={() => setShowExecuteModal(false)}
        onExecute={handleExecuteWorkflow}
        workflow={workflow}
        workflowName={workflow.name}
      />

      <ExecutionStepsModal
        isOpen={showStepsModal}
        onClose={() => setShowStepsModal(false)}
        steps={executionSteps}
        executionId={selectedExecutionId}
        isLoading={isLoading}
      />

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Workflow">
        <p className="mb-5 text-sm text-[#5C5C5C]">
          Delete <strong className="text-[#292D32]">{workflow.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowDeleteModal(false)}
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-semibold text-[#5C5C5C] hover:border-[#D0FFA4]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteWorkflow}
            disabled={action === 'delete'}
            className="rounded-xl bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white hover:bg-[#DC2626] disabled:opacity-60"
          >
            {action === 'delete' ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>

      <Toast
        open={toast.open}
        message={toast.message}
        tone={toast.tone}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />
    </div>
  );
};

export default WorkflowDetail;`.split('\n');

// Find the line that ends the layout grid: '      </div>'
let gridEndIdx = -1;
for (let i = 400; i < lines.length; i++) {
  if (lines[i].includes(') : null}') && lines[i+1].trim() === '</div>' && lines[i+2].trim() === '</div>') {
    gridEndIdx = i + 2;
    break;
  }
}

if (gridEndIdx !== -1) {
  lines.splice(gridEndIdx + 1, lines.length - gridEndIdx - 1, ...correctEnd);
  fs.writeFileSync(file, lines.join('\n'));
} else {
  console.log('Could not find grid end idx');
}
