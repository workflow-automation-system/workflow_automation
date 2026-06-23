import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { integrationApi } from '../api/integrationApi';
import { useAuthStore } from '../stores/authStore';
import Modal from '../components/ui/Modal';

import {
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  Search,
  Plus,
} from 'lucide-react';

const GmailLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="16" height="16">
    <path fill="#EA4335" d="M34 42H14a8 8 0 0 1-8-8V14a8 8 0 0 1 8-8h20a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8z" />
    <path fill="#fff" d="M34 42H14a8 8 0 0 1-8-8V14a8 8 0 0 1 8-8h20a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8z" />
    <path fill="#4285F4" d="M8 12.5V34a6 6 0 0 0 6 6h20a6 6 0 0 0 6-6V12.5L24 26 8 12.5z" />
    <path fill="#34A853" d="M40 12.5V34a6 6 0 0 1-6 6V21l6-8.5z" />
    <path fill="#FBBC05" d="M8 12.5V34a6 6 0 0 0 6 6V21L8 12.5z" />
    <path fill="#EA4335" d="M40 12.5 24 26 8 12.5C9.1 11 10.9 10 13 10l11 8.5L35 10c2.1 0 3.9 1 5 2.5z" />
  </svg>
);

const SlackLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="16" height="16">
    <path fill="#33D375" d="M10 32a4 4 0 0 1-4-4 4 4 0 0 1 4-4h4v4a4 4 0 0 1-4 4z" />
    <path fill="#33D375" d="M18 40a4 4 0 0 1-4-4 4 4 0 0 1 4-4h4v4a4 4 0 0 1-4 4zm0-16h-8a4 4 0 0 1-4-4 4 4 0 0 1 4-4 4 4 0 0 1 4 4v4h4z" />
    <path fill="#40B4D8" d="M32 10a4 4 0 0 1 4 4 4 4 0 0 1-4 4h-4v-4a4 4 0 0 1 4-4z" />
    <path fill="#40B4D8" d="M24 8a4 4 0 0 1 4-4 4 4 0 0 1 4 4 4 4 0 0 1-4 4h-4V8zm0 10v8h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4v-4h-4z" />
    <path fill="#E8A723" d="M38 32a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4v-4h4z" />
    <path fill="#E8A723" d="M30 24h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4v-4h-4z" />
    <path fill="#E03D52" d="M16 16a4 4 0 0 1-4-4 4 4 0 0 1 4-4 4 4 0 0 1 4 4v4h-4z" />
    <path fill="#E03D52" d="M24 8V0h-4a4 4 0 0 0-4 4 4 4 0 0 0 4 4h4zm-4 16H8a4 4 0 0 0-4 4 4 4 0 0 0 4 4 4 4 0 0 0 4-4v-4h8z" />
  </svg>
);

const NotionLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="16" height="16">
    <path fill="#000000" d="M4.8 6.4C4.8 5.5 5.5 4.8 6.4 4.8H41.6C42.5 4.8 43.2 5.5 43.2 6.4V41.6C43.2 42.5 42.5 43.2 41.6 43.2H6.4C5.5 43.2 4.8 42.5 4.8 41.6V6.4Z" />
    <path fill="#FFFFFF" d="M9.6 11.2H38.4V36.8H9.6V11.2Z" />
    <path fill="#000000" d="M14.4 16H16.8L28.8 28.8V16H33.6V32H31.2L19.2 19.2V32H14.4V16Z" />
  </svg>
);

const AppConnections = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [showModal, setShowModal] = React.useState(false);

  // Gmail States
  const [gmailStatus, setGmailStatus] = React.useState({
    connected: false,
    scope: '',
    updatedAt: null,
  });
  const [connectingGmail, setConnectingGmail] = React.useState(false);
  const gmailConnected = gmailStatus.connected;

  // Slack States
  const [slackStatus, setSlackStatus] = React.useState({
    connected: false,
    scope: '',
    updatedAt: null,
  });
  const [connectingSlack, setConnectingSlack] = React.useState(false);

  // Notion States
  const [notionStatus, setNotionStatus] = React.useState({
    connected: false,
    scope: '',
    updatedAt: null,
  });
  const [connectingNotion, setConnectingNotion] = React.useState(false);

  const [loadingConnections, setLoadingConnections] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

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

  const loadSlackStatus = React.useCallback(async () => {
    const userId = Number(user?.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      setSlackStatus({ connected: false, scope: '', updatedAt: null });
      return;
    }

    setLoadingConnections(true);
    try {
      const status = await integrationApi.getSlackStatus(userId);
      setSlackStatus({
        connected: Boolean(status?.connected),
        scope: status?.scope || '',
        updatedAt: status?.updatedAt || null,
      });
    } catch (err) {
      setSlackStatus({ connected: false, scope: '', updatedAt: null });
      setError(err.message || 'Failed to load Slack connection status.');
    } finally {
      setLoadingConnections(false);
    }
  }, [user?.id]);

  const loadNotionStatus = React.useCallback(async () => {
    const userId = Number(user?.id);
    if (!Number.isFinite(userId) || userId <= 0) {
      setNotionStatus({ connected: false, scope: '', updatedAt: null });
      return;
    }

    setLoadingConnections(true);
    try {
      const status = await integrationApi.getNotionStatus(userId);
      setNotionStatus({
        connected: Boolean(status?.connected),
        scope: status?.scope || '',
        updatedAt: status?.updatedAt || null,
      });
    } catch (err) {
      setNotionStatus({ connected: false, scope: '', updatedAt: null });
      setError(err.message || 'Failed to load Notion connection status.');
    } finally {
      setLoadingConnections(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    loadGmailStatus();
    loadSlackStatus();
    loadNotionStatus();
  }, [loadGmailStatus, loadSlackStatus, loadNotionStatus]);

  React.useEffect(() => {
    if (searchParams.get('gmail') === 'connected') {
      setSuccessMessage('Gmail connected successfully.');
      searchParams.delete('gmail');
      setSearchParams(searchParams, { replace: true });
      loadGmailStatus();
    } else if (searchParams.get('slack') === 'connected') {
      setSuccessMessage('Slack connected successfully.');
      searchParams.delete('slack');
      setSearchParams(searchParams, { replace: true });
      loadSlackStatus();
    } else if (searchParams.get('slack_error')) {
      setError(`Slack connection failed: ${searchParams.get('slack_error')}`);
      searchParams.delete('slack_error');
      setSearchParams(searchParams, { replace: true });
    } else if (searchParams.get('notion') === 'connected') {
      setSuccessMessage('Notion connected successfully.');
      searchParams.delete('notion');
      setSearchParams(searchParams, { replace: true });
      loadNotionStatus();
    } else if (searchParams.get('notion_error')) {
      setError(`Notion connection failed: ${searchParams.get('notion_error')}`);
      searchParams.delete('notion_error');
      setSearchParams(searchParams, { replace: true });
    }
  }, [loadGmailStatus, loadSlackStatus, loadNotionStatus, searchParams, setSearchParams]);

  React.useEffect(() => {
    if (!successMessage) return undefined;
    const timeout = window.setTimeout(() => setSuccessMessage(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const connectedConnections = React.useMemo(() => {
    const list = [];
    if (gmailConnected) {
      const scopeCount = gmailStatus.scope
        ? gmailStatus.scope.split(/\s+/).filter(Boolean).length
        : 2;
      list.push({
        name: 'Gmail',
        domain: 'Email',
        status: 'Healthy',
        lastSync: gmailStatus.updatedAt
          ? new Date(gmailStatus.updatedAt).toLocaleString()
          : 'Connected',
        scopes: scopeCount,
      });
    }

    if (slackStatus.connected) {
      const scopeCount = slackStatus.scope
        ? slackStatus.scope.split(/[,\s]+/).filter(Boolean).length
        : 2;
      list.push({
        name: 'Slack',
        domain: 'Chat',
        status: 'Healthy',
        lastSync: slackStatus.updatedAt
          ? new Date(slackStatus.updatedAt).toLocaleString()
          : 'Connected',
        scopes: scopeCount,
      });
    }

    if (notionStatus.connected) {
      list.push({
        name: 'Notion',
        domain: 'Productivity',
        status: 'Healthy',
        lastSync: notionStatus.updatedAt
          ? new Date(notionStatus.updatedAt).toLocaleString()
          : 'Connected',
        scopes: 1,
      });
    }

    return list;
  }, [gmailConnected, gmailStatus.scope, gmailStatus.updatedAt, slackStatus.connected, slackStatus.scope, slackStatus.updatedAt, notionStatus.connected, notionStatus.updatedAt]);

  const filteredConnections = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return connectedConnections;
    return connectedConnections.filter((connection) =>
      `${connection.name} ${connection.domain} ${connection.status}`.toLowerCase().includes(query)
    );
  }, [connectedConnections, searchQuery]);

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

  const handleConnectSlack = async () => {
    setConnectingSlack(true);
    setError('');
    try {
      const userId = Number(user?.id);
      if (!Number.isFinite(userId) || userId <= 0) {
        throw new Error('Unable to resolve the current user. Please log in again.');
      }
      const response = await integrationApi.getSlackAuthUrl(userId);
      if (!response?.authUrl) {
        throw new Error('Slack auth URL was not returned by backend.');
      }
      window.location.href = response.authUrl;
    } catch (err) {
      setError(err.message || 'Failed to start Slack connection.');
      setConnectingSlack(false);
    }
  };

  const handleConnectNotion = async () => {
    setConnectingNotion(true);
    setError('');
    try {
      const userId = Number(user?.id);
      if (!Number.isFinite(userId) || userId <= 0) {
        throw new Error('Unable to resolve the current user. Please log in again.');
      }
      const response = await integrationApi.getNotionAuthUrl(userId);
      if (!response?.authUrl) {
        throw new Error('Notion auth URL was not returned by backend.');
      }
      window.location.href = response.authUrl;
    } catch (err) {
      setError(err.message || 'Failed to start Notion connection.');
      setConnectingNotion(false);
    }
  };

  const availableIntegrations = [
    {
      name: 'Gmail',
      category: 'Email',
      logo: <GmailLogo />,
      action: handleConnectGmail,
      disabled: connectingGmail,
      buttonLabel: connectingGmail ? 'Connecting...' : gmailConnected ? 'Reconnect' : 'Connect',
    },
    {
      name: 'Slack',
      category: 'Chat',
      logo: <SlackLogo />,
      action: handleConnectSlack,
      disabled: connectingSlack,
      buttonLabel: connectingSlack ? 'Connecting...' : slackStatus.connected ? 'Reconnect' : 'Connect',
    },
    {
      name: 'Notion',
      category: 'Productivity',
      logo: <NotionLogo />,
      action: handleConnectNotion,
      disabled: connectingNotion,
      buttonLabel: connectingNotion ? 'Connecting...' : notionStatus.connected ? 'Reconnect' : 'Connect',
    },
  ];

  return (
    <div className="space-y-5 font-urbanist">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#292D32]">App Connections</h1>
          <p className="mt-1 text-sm text-[#5C5C5C]">
            Govern API integrations and credential hygiene for enterprise automations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#292D32] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3C4249] transition-colors"
        >
          <Plus size={16} />
          Add Connection
        </button>
      </div>

      {successMessage ? (
        <div className="rounded-xl border border-[#D0FFA4] bg-[#F6F5FA] px-4 py-3 text-sm font-semibold text-[#292D32]">
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      ) : null}

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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Connection" size="md">
        <div className="space-y-4 font-urbanist">
          <p className="text-sm text-[#5C5C5C]">
            Select an enterprise application to connect to your workflow automation hub.
          </p>
          <div className="flex flex-col gap-3">
            {availableIntegrations.map((integration) => (
              <div
                key={integration.name}
                className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] p-4 hover:border-[#D0FFA4] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-[#E2E8F0] bg-white p-2.5">
                    {integration.logo}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#292D32]">{integration.name}</h4>
                    <p className="text-xs text-[#5C5C5C]">{integration.category}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    integration.action();
                  }}
                  disabled={integration.disabled}
                  className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-[#292D32] hover:border-[#D0FFA4] hover:bg-[#FDFDFD] disabled:opacity-60 transition-colors"
                >
                  {integration.buttonLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AppConnections;
