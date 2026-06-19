import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { integrationApi } from '../api/integrationApi';
import { useAuthStore } from '../stores/authStore';

import {
  AlertCircle,
  CheckCircle2,
  Database,
  KeyRound,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Webhook,
} from 'lucide-react';

const baseAvailableIntegrations = [
  { name: 'Salesforce', category: 'CRM' },
  { name: 'Stripe', category: 'Payments' },
  { name: 'Zendesk', category: 'Support' },
  { name: 'GitHub', category: 'Engineering' },
];

const AppConnections = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [gmailStatus, setGmailStatus] = React.useState({
    connected: false,
    scope: '',
    updatedAt: null,
  });
  const [connectingGmail, setConnectingGmail] = React.useState(false);
  const [loadingConnections, setLoadingConnections] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const gmailConnected = gmailStatus.connected;

  const loadGmailStatus = React.useCallback(async () => {
    const userId = Number(user?.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      setGmailStatus({ connected: false, scope: '', updatedAt: null });
      return;
    }

    setLoadingConnections(true);
    try {
      const status = await integrationApi.getGoogleStatus(userId);
      setGmailStatus({
        connected: Boolean(status?.connected),
        scope: status?.scope || '',
        updatedAt: status?.updatedAt || null,
      });
    } catch (err) {
      setGmailStatus({ connected: false, scope: '', updatedAt: null });
      setError(err.message || 'Failed to load Gmail connection status.');
    } finally {
      setLoadingConnections(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    loadGmailStatus();
  }, [loadGmailStatus]);

  React.useEffect(() => {
    if (searchParams.get('gmail') === 'connected') {
      setSuccessMessage('Gmail connected successfully.');
      searchParams.delete('gmail');
      setSearchParams(searchParams, { replace: true });
      loadGmailStatus();
    }
  }, [loadGmailStatus, searchParams, setSearchParams]);

  React.useEffect(() => {
    if (!successMessage) return undefined;

    const timeout = window.setTimeout(() => setSuccessMessage(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const connectedConnections = React.useMemo(() => {
    if (!gmailConnected) return [];
    const scopeCount = gmailStatus.scope
      ? gmailStatus.scope.split(/\s+/).filter(Boolean).length
      : 2;

    return [
      {
        name: 'Gmail',
        domain: 'Email',
        status: 'Healthy',
        lastSync: gmailStatus.updatedAt
          ? new Date(gmailStatus.updatedAt).toLocaleString()
          : 'Connected',
        scopes: scopeCount,
      },
    ];
  }, [gmailConnected, gmailStatus.scope, gmailStatus.updatedAt]);

  const filteredConnections = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return connectedConnections;

    return connectedConnections.filter((connection) =>
      `${connection.name} ${connection.domain} ${connection.status}`.toLowerCase().includes(query)
    );
  }, [connectedConnections, searchQuery]);

  const stats = React.useMemo(() => {
    const connected = connectedConnections.length;
    const healthy = connectedConnections.filter((connection) => connection.status === 'Healthy').length;
    const scopes = connectedConnections.reduce((total, connection) => total + connection.scopes, 0);
    const attention = connectedConnections.filter((connection) => connection.status !== 'Healthy').length;

    return { connected, healthy, scopes, attention };
  }, [connectedConnections]);

  const handleConnectGmail = async () => {
    setConnectingGmail(true);
    setError('');

    try {
      const userId = Number(user?.id);
      if (!Number.isFinite(userId) || userId <= 0) {
        throw new Error('Unable to resolve the current user. Please log in again.');
      }

      const response = await integrationApi.getGoogleAuthUrl(userId);

      if (!response?.authUrl) {
        throw new Error('Google auth URL was not returned by backend.');
      }

      window.location.href = response.authUrl;
    } catch (err) {
      setError(err.message || 'Failed to start Gmail connection.');
      setConnectingGmail(false);
    }
  };

  const availableIntegrations = [
    {
      name: 'Gmail',
      category: 'Email',
      action: handleConnectGmail,
      disabled: connectingGmail,
      buttonLabel: connectingGmail ? 'Connecting...' : gmailConnected ? 'Reconnect' : 'Connect',
    },
    ...baseAvailableIntegrations,
  ];

  return (
    <div className="space-y-5 font-urbanist">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#292D32]">App Connections</h1>
          <p className="mt-1 text-sm text-[#5C5C5C]">
            Govern API integrations, webhook endpoints, and credential hygiene for enterprise automations.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#292D32] px-5 py-3 text-sm font-semibold text-white hover:bg-[#3C4249]"
        >
          <Plus size={16} />
          New Connection
        </button>
      </div>

      {successMessage ? (
        <div className="rounded-xl border border-[#D0FFA4] bg-[#E2E8F0] px-4 py-3 text-sm font-semibold text-[#292D32]">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="enterprise-card p-5">
          <div className="mb-3 w-fit rounded-xl border border-[#E2E8F0] bg-[#D0FFA4] p-2.5">
            <Database size={18} className="text-[#292D32]" />
          </div>
          <p className="text-3xl font-bold text-[#292D32]">{stats.connected}</p>
          <p className="text-sm text-[#5C5C5C]">Connected Apps</p>
        </div>
        <div className="enterprise-card p-5">
          <div className="mb-3 w-fit rounded-xl border border-[#E2E8F0] bg-[#D0FFA4] p-2.5">
            <Webhook size={18} className="text-[#292D32]" />
          </div>
          <p className="text-3xl font-bold text-[#292D32]">{stats.healthy}</p>
          <p className="text-sm text-[#5C5C5C]">Healthy Apps</p>
        </div>
        <div className="enterprise-card p-5">
          <div className="mb-3 w-fit rounded-xl border border-[#E2E8F0] bg-[#E2E8F0] p-2.5">
            <KeyRound size={18} className="text-[#292D32]" />
          </div>
          <p className="text-3xl font-bold text-[#292D32]">{stats.scopes}</p>
          <p className="text-sm text-[#5C5C5C]">Authorized Scopes</p>
        </div>
        <div className="enterprise-card p-5">
          <div className="mb-3 w-fit rounded-xl border border-[#E2E8F0] bg-[#D0FFA4] p-2.5">
            <ShieldCheck size={18} className="text-[#292D32]" />
          </div>
          <p className="text-3xl font-bold text-[#292D32]">{stats.attention}</p>
          <p className="text-sm text-[#5C5C5C]">Attention Needed</p>
        </div>
      </div>

      <section className="enterprise-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#292D32]">Connected Apps</h2>
            <p className="text-sm text-[#5C5C5C]">Integration status, sync health, and permission scope visibility.</p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search connections"
              className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#292D32] focus:border-[#D0FFA4] focus:outline-none md:w-64"
            />
          </div>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {filteredConnections.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[#5C5C5C]">
              {loadingConnections
                ? 'Loading connected applications...'
                : connectedConnections.length === 0
                ? 'No applications connected yet.'
                : 'No connected application matches your search.'}
            </div>
          ) : null}

          {filteredConnections.map((connection) => (
            <div key={connection.name} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#292D32]">{connection.name}</p>
                <p className="text-xs text-[#5C5C5C]">{connection.domain}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#5C5C5C]">
                <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1">{connection.scopes} scopes</span>
                <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1">Connected {connection.lastSync}</span>
                {connection.status === 'Healthy' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#D0FFA4] px-2.5 py-1 font-semibold text-[#292D32]">
                    <CheckCircle2 size={12} />
                    Healthy
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#D0FFA4] px-2.5 py-1 font-semibold text-[#292D32]">
                    <AlertCircle size={12} />
                    Warning
                  </span>
                )}
                <button type="button" className="rounded-lg p-1.5 text-[#5C5C5C] hover:bg-white">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="enterprise-card p-5">
        <h2 className="text-lg font-semibold text-[#292D32]">Available Integrations</h2>
        <p className="mt-1 text-sm text-[#5C5C5C]">Add enterprise services and secure them with scoped credentials.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {availableIntegrations.map((integration) => (
            <button
              key={integration.name}
              type="button"
              onClick={integration.action}
              disabled={integration.disabled}
              className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-left hover:border-[#D0FFA4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-start justify-between gap-3">
                <span>
                  <p className="text-sm font-semibold text-[#292D32]">{integration.name}</p>
                  <p className="text-xs text-[#5C5C5C]">{integration.category}</p>
                </span>

                {integration.buttonLabel ? (
                  <span className="rounded-full border border-[#E2E8F0] px-2.5 py-1 text-xs font-semibold text-[#292D32]">
                    {integration.buttonLabel}
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AppConnections;
