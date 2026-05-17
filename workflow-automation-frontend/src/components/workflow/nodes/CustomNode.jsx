import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  BookCopy,
  Bot,
  Clock,
  GitBranch,
  Globe,
  Mail,
  MessageSquare,
  Sheet,
  ShieldAlert,
  Table2,
  Zap,
} from 'lucide-react';

const iconMap = {
  Zap,
  GitBranch,
  Table2,
  ShieldAlert,
  BookCopy,
  Sheet,
  Bot,
  MessageSquare,
  Mail,
  Globe,
  Clock,
};

const nodeIconByType = {
  trigger: 'Zap',
  condition: 'GitBranch',
  data_mapper: 'Table2',
  error_handler: 'ShieldAlert',
  notion: 'BookCopy',
  google_sheets: 'Sheet',
  chatgpt: 'Bot',
  slack: 'MessageSquare',
  email: 'Mail',
  gmail: 'Mail',
  webhook: 'Globe',
  delay: 'Clock',
};

const nodeBg = {
  trigger: '#D0FFA4',
  condition: '#E2E8F0',
  data_mapper: '#E2E8F0',
  error_handler: '#D0FFA4',
  notion: '#D0FFA4',
  google_sheets: '#D0FFA4',
  chatgpt: '#D0FFA4',
  slack: '#D0FFA4',
  email: '#D0FFA4',
  gmail: '#D0FFA4',
  webhook: '#E2E8F0',
  delay: '#F6F5FA',
};

const getSubtitle = (type, data) => {
  switch (type) {
    case 'trigger':
      return data?.eventType || 'Manual event';
    case 'condition':
      return data?.expression || 'branch expression';
    case 'data_mapper':
      return data?.mappingMode || 'strict mapping';
    case 'error_handler':
      return data?.policy || 'retry policy';
    case 'notion':
      return data?.action || 'create page';
    case 'google_sheets':
      return data?.worksheet || 'Sheet1';
    case 'chatgpt':
      return data?.model || 'gpt model';
    case 'slack':
      return data?.channel || '#channel';
    case 'email':
    case 'gmail':
      return data?.to || 'recipient';
    case 'webhook':
      return data?.method || 'GET';
    case 'delay':
      return data?.duration ? `${data.duration} ${data.unit}` : '5 minutes';
    default:
      return data?.entity || data?.functionKey || 'Configure node';
  }
};

const CustomNode = ({ data, selected, type }) => {
  const iconKey = data?.icon || nodeIconByType[type];
  const Icon = iconMap[iconKey] || Zap;

  return (
    <div
      className={[
        'min-w-[230px] rounded-2xl border bg-white px-4 py-3 shadow-card transition-all',
        selected ? 'border-[#D0FFA4] ring-2 ring-[#D0FFA4]/40' : 'border-[#E2E8F0]',
      ].join(' ')}
    >
      {type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !border-white !bg-[#D0FFA4]"
        />
      )}

      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E2E8F0]"
          style={{ backgroundColor: data?.color || nodeBg[type] || '#D0FFA4' }}
        >
          <Icon size={16} className="text-[#292D32]" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#292D32]">
            {data?.label || data?.functionLabel || type || 'Node'}
          </p>
          <p className="truncate text-xs text-[#5C5C5C]">{getSubtitle(type, data)}</p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-white !bg-[#D0FFA4]"
      />
    </div>
  );
};

export default CustomNode;
