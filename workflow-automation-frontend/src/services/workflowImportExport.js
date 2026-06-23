import { generateId } from '../mock/data';
import {
  FALLBACK_WORKFLOW_CONFIGURATION,
  normalizeWorkflow,
  normalizeStatus,
} from './workflowConverter';

export const WORKFLOW_EXPORT_VERSION = '1.0';

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const safeTrim = (value) => (typeof value === 'string' ? value.trim() : '');

const slugify = (value) =>
  safeTrim(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'workflow';

const stripFields = (workflow = {}) => {
  const copy = { ...workflow };
  delete copy.id;
  delete copy.workflowId;
  delete copy.userId;
  delete copy.organizationId;
  delete copy.executionCount;
  delete copy.createdAt;
  delete copy.updatedAt;
  delete copy.lastExecution;
  return copy;
};

const toPortableNode = (node, index) => ({
  clientId: String(node?.id ?? `node-${index + 1}`),
  type: node?.type || node?.data?.functionKey || 'trigger',
  position: {
    x: Number(node?.position?.x ?? node?.positionX ?? 0),
    y: Number(node?.position?.y ?? node?.positionY ?? 0),
  },
  data: isObject(node?.data) ? { ...node.data } : {},
});

const toPortableEdge = (edge) => ({
  source: String(edge?.source ?? edge?.sourceNodeId ?? edge?.sourceClientId ?? ''),
  target: String(edge?.target ?? edge?.targetNodeId ?? edge?.targetClientId ?? ''),
});

// 1) Construire le document JSON exporté
export const buildWorkflowExportDocument = (
  workflow,
  configuration = FALLBACK_WORKFLOW_CONFIGURATION
) => {
  const normalized = normalizeWorkflow(workflow, configuration);
  const portable = stripFields(normalized);

  const nodes = (portable.nodes || []).map(toPortableNode);
  const nodeIds = new Set(nodes.map((n) => n.clientId));
  const edges = (portable.edges || [])
    .map(toPortableEdge)
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

  return {
    exportVersion: WORKFLOW_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    source: 'autoflow',
    workflow: {
      name: portable.name || 'Untitled workflow',
      description: portable.description || '',
      status: normalizeStatus(portable.status, 'INACTIVE'),
      nodes,
      edges,
    },
  };
};

// 2) Télécharger le fichier .json
export const downloadWorkflowJson = (
  workflow,
  configuration = FALLBACK_WORKFLOW_CONFIGURATION
) => {
  const doc = buildWorkflowExportDocument(workflow, configuration);
  const fileName = `${slugify(doc.workflow.name)}-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);

  return fileName;
};

// 3) Parser le contenu du fichier
export const parseWorkflowImportDocument = (rawText) => {
  if (!safeTrim(rawText)) throw new Error('The selected file is empty.');

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Invalid workflow file: JSON parsing failed.');
  }

  const payload = parsed.workflow || (Array.isArray(parsed.nodes) ? parsed : null);
  if (!payload) throw new Error('Invalid workflow file: missing workflow definition.');

  const nodes = Array.isArray(payload.nodes) ? payload.nodes : [];
  const edges = Array.isArray(payload.edges)
    ? payload.edges
    : Array.isArray(payload.connections)
      ? payload.connections
      : [];

  if (!nodes.length) throw new Error('Invalid workflow file: at least one node is required.');

  return {
    name: safeTrim(payload.name) || 'Imported workflow',
    description: safeTrim(payload.description),
    status: normalizeStatus(payload.status, 'INACTIVE'),
    nodes,
    edges,
  };
};

// 4) Lire un File depuis l'input
export const readWorkflowImportFile = (file) =>
  new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected.'));
    if (!file.name.toLowerCase().endsWith('.json')) {
      return reject(new Error('Please select a .json workflow file.'));
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(parseWorkflowImportDocument(String(reader.result || '')));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the selected file.'));
    reader.readAsText(file);
  });

// 5) Régénérer de nouveaux IDs pour éviter les conflits
const remapImportedGraph = (nodes, edges) => {
  const idMap = new Map();

  const remappedNodes = nodes.map((node, index) => {
    const oldId = String(node?.clientId ?? node?.id ?? `imported-node-${index + 1}`);
    const newId = generateId('node');
    idMap.set(oldId, newId);

    return {
      id: newId,
      type: node?.type || node?.data?.functionKey || 'trigger',
      position: node.position || { x: 0, y: 0 },
      data: isObject(node?.data) ? { ...node.data } : {},
    };
  });

  const remappedEdges = edges
    .map((edge) => {
      const source = idMap.get(String(edge.source ?? edge.sourceClientId ?? edge.sourceNodeId));
      const target = idMap.get(String(edge.target ?? edge.targetClientId ?? edge.targetNodeId));
      if (!source || !target) return null;
      return { id: generateId('edge'), source, target };
    })
    .filter(Boolean);

  return { nodes: remappedNodes, edges: remappedEdges };
};

// 6) Préparer le workflow pour le builder
export const prepareImportedWorkflowForBuilder = (
  importedPayload,
  configuration = FALLBACK_WORKFLOW_CONFIGURATION
) => {
  const normalized = normalizeWorkflow(importedPayload, configuration);
  const { nodes, edges } = remapImportedGraph(normalized.nodes, normalized.edges);

  const baseName = safeTrim(normalized.name) || 'Imported workflow';

  return {
    name: baseName.toLowerCase().includes('imported') ? baseName : `${baseName} (imported)`,
    description: normalized.description || '',
    status: 'INACTIVE',
    nodes,
    edges,
  };
};