import React from 'react';
import { AlertCircle, CheckCircle2, Monitor, Search, ShieldCheck } from 'lucide-react';
import { AUDIT_ENDPOINT } from '../api/config';
import { API } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

const ACTION_LABELS = {
    ORGANIZATION_MEMBER_INVITED: 'Member invited',
    ORGANIZATION_MEMBER_REMOVED: 'Member removed',
    USER_LOGIN: 'Login',
    USER_LOGIN_FAILED: 'Login failed',
    USER_ROLE_CHANGED: 'Role changed',
    WORKFLOW_ACTIVATED: 'Workflow activated',
    WORKFLOW_CREATED: 'Workflow created',
    WORKFLOW_DEACTIVATED: 'Workflow deactivated',
    WORKFLOW_DELETED: 'Workflow deleted',
    WORKFLOW_MANUAL_TRIGGERED: 'Workflow manually triggered',
    WORKFLOW_PERMISSION_GRANTED: 'Workflow permission granted',
    WORKFLOW_PERMISSION_REVOKED: 'Workflow permission revoked',
    WORKFLOW_PERMISSION_UPDATED: 'Workflow permission updated',
    WORKFLOW_UPDATED: 'Workflow updated',
};

const parseMetadata = (metadata) => {
    if (!metadata) return {};
    if (typeof metadata === 'object') return metadata;
    try {
        return JSON.parse(metadata);
    } catch {
        return {};
    }
};

const formatAction = (action = '') => ACTION_LABELS[action] || action.replaceAll('_', ' ').toLowerCase();

const formatDate = (value) => {
    if (!value) return 'Unknown';
    return new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
};

const outcomeClass = (outcome) => {
    const normalized = (outcome || '').toUpperCase();
    return normalized === 'FAILURE'
        ? 'bg-red-50 text-red-700'
        : 'bg-[#D0FFA4] text-[#292D32]';
};

const AuditLogs = () => {
    const { user } = useAuthStore();
    const [logs, setLogs] = React.useState([]);
    const [query, setQuery] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        const loadAuditLogs = async () => {
            if (!user?.organizationId) {
                setLogs([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError('');
            try {
                const response = await API.get(`${AUDIT_ENDPOINT}/organization/${user.organizationId}`);
                setLogs(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load audit logs.');
            } finally {
                setIsLoading(false);
            }
        };

        loadAuditLogs();
    }, [user?.organizationId]);

    const filteredLogs = logs.filter((log) => {
        const metadata = parseMetadata(log.metadata);
        const haystack = [
            log.actorEmail,
            log.action,
            log.entityType,
            log.outcome,
            log.ipAddress,
            metadata.workflowName,
            metadata.targetEmail,
            metadata.reason,
        ].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
    });

    const totalFailures = logs.filter((log) => (log.outcome || '').toUpperCase() === 'FAILURE').length;
    const uniqueActors = new Set(logs.map((log) => log.actorEmail || log.userId).filter(Boolean)).size;

    return (
        <div className="space-y-5 font-urbanist">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#292D32]">Audit Logs</h1>
                    <p className="mt-1 text-sm text-[#5C5C5C]">
                        Trace security, workflow, member, and permission changes across your organization.
                    </p>
                </div>
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search audit logs"
                        className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none md:w-72"
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="enterprise-card p-5">
                    <p className="text-sm text-[#5C5C5C]">Total Events</p>
                    <p className="mt-2 text-3xl font-bold text-[#292D32]">{logs.length}</p>
                </div>
                <div className="enterprise-card p-5">
                    <p className="text-sm text-[#5C5C5C]">Failures</p>
                    <p className="mt-2 text-3xl font-bold text-[#292D32]">{totalFailures}</p>
                </div>
                <div className="enterprise-card p-5">
                    <p className="text-sm text-[#5C5C5C]">Actors</p>
                    <p className="mt-2 text-3xl font-bold text-[#292D32]">{uniqueActors}</p>
                </div>
            </div>

            <section className="enterprise-card overflow-hidden">
                <div className="flex items-center gap-2 border-b border-[#E2E8F0] px-5 py-4">
                    <ShieldCheck size={18} className="text-[#292D32]" />
                    <h2 className="text-lg font-semibold text-[#292D32]">Organization Activity</h2>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-sm text-[#5C5C5C]">Loading audit logs...</div>
                ) : error ? (
                    <div className="p-5 text-sm text-red-600">{error}</div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[#5C5C5C]">No audit events match your search.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-sm">
                            <thead className="bg-[#F6F5FA] text-xs uppercase text-[#5C5C5C]">
                            <tr>
                                <th className="px-5 py-3 font-semibold">Time</th>
                                <th className="px-5 py-3 font-semibold">Actor</th>
                                <th className="px-5 py-3 font-semibold">Action</th>
                                <th className="px-5 py-3 font-semibold">Resource</th>
                                <th className="px-5 py-3 font-semibold">Result</th>
                                <th className="px-5 py-3 font-semibold">IP / Device</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0] bg-white">
                            {filteredLogs.map((log) => {
                                const metadata = parseMetadata(log.metadata);
                                const outcome = (log.outcome || 'SUCCESS').toUpperCase();
                                const resourceLabel = metadata.workflowName || metadata.targetEmail || log.entityType || 'Resource';

                                return (
                                    <tr key={log.id} className="align-top">
                                        <td className="whitespace-nowrap px-5 py-4 text-[#5C5C5C]">{formatDate(log.timestamp)}</td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-[#292D32]">{log.actorEmail || `User #${log.userId || 'system'}`}</p>
                                            <p className="text-xs text-[#5C5C5C]">Org #{log.organizationId || 'unknown'}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-[#292D32]">{formatAction(log.action)}</p>
                                            {metadata.reason && <p className="text-xs text-[#5C5C5C]">{metadata.reason}</p>}
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-[#292D32]">{resourceLabel}</p>
                                            <p className="text-xs text-[#5C5C5C]">{log.entityType || 'Entity'} #{log.entityId || 'n/a'}</p>
                                        </td>
                                        <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${outcomeClass(outcome)}`}>
                          {outcome === 'FAILURE' ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                            {outcome}
                        </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-start gap-2 text-[#5C5C5C]">
                                                <Monitor size={14} className="mt-0.5 shrink-0" />
                                                <div>
                                                    <p>{log.ipAddress || 'Unknown IP'}</p>
                                                    <p className="max-w-xs truncate text-xs">{log.userAgent || 'Unknown device'}</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default AuditLogs;