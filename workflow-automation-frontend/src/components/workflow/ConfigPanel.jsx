import React from 'react';
import { Settings2, Trash2, X } from 'lucide-react';
import {
  createNodeDataFromFunction,
  FALLBACK_WORKFLOW_CONFIGURATION,
  getFirstFunctionForEntity,
  getFunctionDefinition,
  normalizeEntity,
} from '../../services/workflowConverter';

const nodeColor = {
  trigger: '#D0FFA4',
  condition: '#E2E8F0',
  data_mapper: '#E2E8F0',
  error_handler: '#D0FFA4',
  notion: '#D0FFA4',
  google_sheets: '#D0FFA4',
  chatgpt: '#D0FFA4',
  slack: '#D0FFA4',
  gmail: '#D0FFA4',
  email: '#D0FFA4',
  webhook: '#E2E8F0',
  delay: '#F6F5FA',
};

const inputStyle =
  'w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none';

const ConfigPanel = ({ node, onClose, onUpdate, onDelete, workflowConfiguration }) => {
  const activeConfiguration =
    Array.isArray(workflowConfiguration?.functions) && workflowConfiguration.functions.length > 0
      ? workflowConfiguration
      : FALLBACK_WORKFLOW_CONFIGURATION;
  const activeFunctionKey = node.data?.functionKey || node.type;
  const nodeConfig =
    getFunctionDefinition(activeConfiguration, activeFunctionKey) ||
    getFirstFunctionForEntity(activeConfiguration, node.data?.entity || node.type);
  const selectedEntity = normalizeEntity(node.data?.entity || nodeConfig?.entity, activeFunctionKey);
  const availableEntities =
    Array.isArray(activeConfiguration.entities) && activeConfiguration.entities.length > 0
      ? activeConfiguration.entities
      : FALLBACK_WORKFLOW_CONFIGURATION.entities;
  const availableFunctions = activeConfiguration.functions.filter(
    (item) => item.entity === selectedEntity
  );
  const functionOptions = availableFunctions.length ? availableFunctions : activeConfiguration.functions;

  const update = (field, value) => {
    onUpdate(node.id, { [field]: value });
  };

  const updateNodeFunction = (entity, functionKey) => {
    const nextFunction =
      getFunctionDefinition(activeConfiguration, functionKey) ||
      getFirstFunctionForEntity(activeConfiguration, entity);
    if (!nextFunction) return;

    const nextData = createNodeDataFromFunction(nextFunction, {
      label: node.data?.label || nextFunction.label,
    });
    onUpdate(node.id, { ...nextData, __nodeType: nextFunction.key });
  };

  const renderFields = () => {
    switch (activeFunctionKey) {
      case 'trigger':
        return (
          <>
            <Field label="Event Type">
              <select
                value={node.data?.eventType || 'manual'}
                onChange={(event) => update('eventType', event.target.value)}
                className={inputStyle}
              >
                <option value="manual">Manual Trigger</option>
                <option value="webhook">Webhook Event</option>
                <option value="schedule">Schedule</option>
                <option value="customer_created">Customer Created</option>
                <option value="order_created">Order Created</option>
              </select>
            </Field>
          </>
        );
      case 'condition':
        return (
          <>
            <Field label="Expression">
              <input
                value={node.data?.expression || ''}
                onChange={(event) => update('expression', event.target.value)}
                placeholder="order.total > 1000"
                className={inputStyle}
              />
            </Field>
            <Field label="True Path Name">
              <input
                value={node.data?.truePath || ''}
                onChange={(event) => update('truePath', event.target.value)}
                placeholder="High value"
                className={inputStyle}
              />
            </Field>
            <Field label="False Path Name">
              <input
                value={node.data?.falsePath || ''}
                onChange={(event) => update('falsePath', event.target.value)}
                placeholder="Standard"
                className={inputStyle}
              />
            </Field>
          </>
        );
      case 'data_mapper':
        return (
          <>
            <Field label="Source Path">
              <input
                value={node.data?.source || ''}
                onChange={(event) => update('source', event.target.value)}
                placeholder="payload.customer"
                className={inputStyle}
              />
            </Field>
            <Field label="Target Path">
              <input
                value={node.data?.target || ''}
                onChange={(event) => update('target', event.target.value)}
                placeholder="crm.contact"
                className={inputStyle}
              />
            </Field>
            <Field label="Mapping Mode">
              <select
                value={node.data?.mappingMode || 'strict'}
                onChange={(event) => update('mappingMode', event.target.value)}
                className={inputStyle}
              >
                <option value="strict">Strict</option>
                <option value="lenient">Lenient</option>
              </select>
            </Field>
          </>
        );
      case 'error_handler':
        return (
          <>
            <Field label="Policy">
              <select
                value={node.data?.policy || 'retry'}
                onChange={(event) => update('policy', event.target.value)}
                className={inputStyle}
              >
                <option value="retry">Retry</option>
                <option value="fallback">Fallback</option>
                <option value="stop">Stop Workflow</option>
              </select>
            </Field>
            <Field label="Retry Count">
              <input
                type="number"
                value={node.data?.retries ?? 3}
                onChange={(event) => update('retries', Number(event.target.value) || 0)}
                className={inputStyle}
              />
            </Field>
          </>
        );
      case 'notion':
        return (
          <>
            <Field label="Action">
              <select
                value={node.data?.action || 'create_page'}
                onChange={(event) => update('action', event.target.value)}
                className={inputStyle}
              >
                <option value="create_page">Create Page</option>
                <option value="update_page">Update Page</option>
                <option value="query_database">Query Database</option>
              </select>
            </Field>
            <Field label="Database ID">
              <input
                value={node.data?.database || ''}
                onChange={(event) => update('database', event.target.value)}
                placeholder="notion_database_id"
                className={inputStyle}
              />
            </Field>
          </>
        );
      case 'google_sheets':
        return (
          <>
            <Field label="Spreadsheet ID">
              <input
                value={node.data?.spreadsheetId || ''}
                onChange={(event) => update('spreadsheetId', event.target.value)}
                placeholder="sheet_id"
                className={inputStyle}
              />
            </Field>
            <Field label="Worksheet">
              <input
                value={node.data?.worksheet || ''}
                onChange={(event) => update('worksheet', event.target.value)}
                placeholder="Sheet1"
                className={inputStyle}
              />
            </Field>
          </>
        );
      case 'chatgpt':
        return (
          <>
            <Field label="Model">
              <select
                value={node.data?.model || 'gpt-5.4-mini'}
                onChange={(event) => update('model', event.target.value)}
                className={inputStyle}
              >
                <option value="gpt-5.4-mini">gpt-5.4-mini</option>
                <option value="gpt-5.4">gpt-5.4</option>
              </select>
            </Field>
            <Field label="Prompt">
              <textarea
                value={node.data?.prompt || ''}
                onChange={(event) => update('prompt', event.target.value)}
                placeholder="Summarize incident details and propose next actions."
                className={`${inputStyle} min-h-[90px] resize-y`}
              />
            </Field>
          </>
        );
      case 'slack':
        return (
          <>
            <Field label="Channel">
              <input
                value={node.data?.channel || ''}
                onChange={(event) => update('channel', event.target.value)}
                placeholder="#ops-alerts"
                className={inputStyle}
              />
            </Field>
            <Field label="Message">
              <textarea
                value={node.data?.message || ''}
                onChange={(event) => update('message', event.target.value)}
                placeholder="Incident detected. Investigating now."
                className={`${inputStyle} min-h-[90px] resize-y`}
              />
            </Field>
          </>
        );
       
        case 'gmail':
        case 'email':
          return (
            <>
              <Field label="To">
                <input
                  type="email"
                  value={node.data?.to || ''}
                  onChange={(event) => update('to', event.target.value)}
                  placeholder="recipient@example.com"
                  className={inputStyle}
                />
              </Field>
              <Field label="Subject">
                <input
                  value={node.data?.subject || ''}
                  onChange={(event) => update('subject', event.target.value)}
                  placeholder="Workflow update"
                  className={inputStyle}
                />
              </Field>
              <Field label="Body">
                <textarea
                  value={node.data?.body || ''}
                  onChange={(event) => update('body', event.target.value)}
                  placeholder="Email content"
                  className={`${inputStyle} min-h-[90px] resize-y`}
                />
              </Field>
            </>
          );
        case 'gmail_read':
          return (
            <>
              <Field label="Query">
                <input
                  value={node.data?.query || ''}
                  onChange={(event) => update('query', event.target.value)}
                  placeholder="is:unread"
                  className={inputStyle}
                />
              </Field>

              <Field label="Max Results">
                <input
                  type="number"
                  value={node.data?.maxResults ?? 10}
                  onChange={(event) => update('maxResults', Number(event.target.value) || 1)}
                  className={inputStyle}
                />
              </Field>
            </>
          );

      case 'webhook':
        return (
          <>
            <Field label="URL">
              <input
                value={node.data?.url || ''}
                onChange={(event) => update('url', event.target.value)}
                placeholder="https://api.example.com/endpoint"
                className={inputStyle}
              />
            </Field>
            <Field label="Method">
              <select
                value={node.data?.method || 'GET'}
                onChange={(event) => update('method', event.target.value)}
                className={inputStyle}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </Field>
          </>
        );
      case 'delay':
        return (
          <>
            <Field label="Duration">
              <input
                type="number"
                value={node.data?.duration ?? 5}
                onChange={(event) => update('duration', Number(event.target.value) || 0)}
                className={inputStyle}
              />
            </Field>
            <Field label="Unit">
              <select
                value={node.data?.unit || 'minutes'}
                onChange={(event) => update('unit', event.target.value)}
                className={inputStyle}
              >
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </Field>
          </>
        );
      default:
        return (
          <Field label="Configuration JSON">
            <textarea
              value={JSON.stringify(node.data || {}, null, 2)}
              onChange={(event) => {
                try {
                  const parsed = JSON.parse(event.target.value);
                  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    onUpdate(node.id, parsed);
                  }
                } catch (error) {
                  // Keep editing experience tolerant of incomplete JSON.
                }
              }}
              className={`${inputStyle} min-h-[120px] resize-y font-mono text-xs`}
            />
          </Field>
        );
    }
  };

  return (
    <aside className="enterprise-card h-full w-full min-w-[300px] max-w-[320px] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] p-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0]"
            style={{ backgroundColor: node.data?.color || nodeColor[node.type] || '#D0FFA4' }}
          >
            <Settings2 size={16} className="text-[#292D32]" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#292D32]">{nodeConfig?.label || 'Node'} Settings</p>
            <p className="text-xs text-[#5C5C5C]">Configure data, mapping, and behavior.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-[#5C5C5C] hover:bg-white"
          aria-label="Close node settings"
        >
          <X size={16} />
        </button>
      </div>

      <div className="max-h-[calc(100vh-18rem)] space-y-3 overflow-y-auto p-4">
        <Field label="Entity">
          <select
            value={selectedEntity}
            onChange={(event) => {
              const nextEntity = event.target.value;
              const firstFunction = getFirstFunctionForEntity(activeConfiguration, nextEntity);
              updateNodeFunction(nextEntity, firstFunction?.key);
            }}
            className={inputStyle}
          >
            {availableEntities.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Function">
          <select
            value={activeFunctionKey}
            onChange={(event) => updateNodeFunction(selectedEntity, event.target.value)}
            className={inputStyle}
          >
            {functionOptions.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Label">
          <input
            value={node.data?.label || ''}
            onChange={(event) => update('label', event.target.value)}
            placeholder="Node label"
            className={inputStyle}
          />
        </Field>
        {renderFields()}
      </div>

      <div className="border-t border-[#E2E8F0] p-4">
        <button
          type="button"
          onClick={onDelete}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-[#EF4444] hover:bg-red-100"
        >
          <Trash2 size={14} />
          Delete Node
        </button>
      </div>
    </aside>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-[#5C5C5C]">{label}</span>
    {children}
  </label>
);

export default ConfigPanel;
