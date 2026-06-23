import { useMemo, useState } from 'react'
import { Copy, FileTerminal, ListOrdered, ArrowLeft, Activity } from 'lucide-react'
import { useTeamConnection } from '../hooks/useTeamConnection.jsx'
import { useTeamData } from '../hooks/useTeamData.jsx'
import { useTeamStatus, useTeamIsLoading } from '../hooks/useTeamStatus.jsx'
import LogViewer from './logViewer.jsx'

const TABS = [
  { id: 'logs', label: 'Logs', icon: FileTerminal },
  { id: 'commands', label: 'Commands', icon: ListOrdered },
]

export default function AgentView({ teamId, agentId, onBack }) {
  useTeamConnection(teamId)
  const teamData = useTeamData(teamId)
  const status = useTeamStatus(teamId)
  const isLoading = useTeamIsLoading(teamId)
  const [activeTab, setActiveTab] = useState('logs')

  const agent = teamData?.agents?.[agentId]
  const commands = useMemo(() => {
    return Object.values(teamData?.commands || {})
      .filter((command) => command.agent_id === agentId)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  }, [teamData?.commands, agentId])

  const copyAgentId = async () => {
    if (!agent?.agent_id) return
    await navigator.clipboard.writeText(agent.agent_id)
  }

  const getStatusColor = (value) => {
    switch (value) {
      case 'online':
        return 'bg-status-online'
      case 'offline':
        return 'bg-status-offline'
      default:
        return 'bg-status-offline'
    }
  }

  if (isLoading || status === 'idle') {
    return <p className="text-text-muted">Loading agent...</p>
  }

  if (!agent) {
    return (
      <div className="rounded-lg border border-border-primary bg-bg-card p-6">
        <p className="text-text-muted">Agent not found</p>
        <button
          onClick={onBack}
          className="mt-4 px-3 py-1.5 text-sm font-medium bg-bg-surface text-text-primary rounded-lg hover:bg-bg-card-hover transition-colors"
        >
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="max-h-[90vh] overflow-y-auto pr-2 px-3">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={onBack}
          className="px-3 py-1.5 text-sm font-medium bg-bg-surface text-text-primary rounded-lg hover:bg-bg-card-hover transition-colors border-2 border-border-primary"
        >
          <ArrowLeft size={16} className="inline mr-1" />
          Back
        </button>

        <div>
          <h1 className="text-2xl font-bold text-text-primary">{agent.agent_name}</h1>
          <p className="text-sm text-text-muted">{agent.agent_id}</p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className={`w-4 h-4 rounded-full ${getStatusColor(agent.agent_status)}`} />
          <span className="text-sm text-text-primary capitalize">{agent.agent_status}</span>
        </div>

        <button
          onClick={copyAgentId}
          className="px-3 py-1.5 text-sm font-medium bg-bg-surface text-text-primary rounded-lg hover:bg-bg-card-hover transition-colors"
        >
          <Copy size={16} className="inline mr-1" />
          Copy ID
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_24rem] gap-4">
        <div className="space-y-4">
          <div className="bg-bg-card border border-border-secondary rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-bg-surface flex items-center justify-center">
                <Activity size={18} className="text-text-muted" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Agent activity</p>
                <p className="text-text-primary">
                  Last online: {agent.last_online ? new Date(agent.last_online).toLocaleString() : 'unknown'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-1 border-b border-border-secondary">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-t-lg transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-bg-card text-text-primary border-t border-l border-r border-border-secondary'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="pb-4">
            {activeTab === 'logs' && (
              <div className="h-[40rem]">
                <LogViewer
                  streamPath={`/agent/logs/${agentId}/stream`}
                  emptyMessage="waiting for agent logs…"
                />
              </div>
            )}

            {activeTab === 'commands' && (
              <div className="bg-bg-card border border-border-secondary rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border-secondary bg-bg-secondary">
                  <h2 className="font-semibold text-text-primary">Commands</h2>
                  <p className="text-sm text-text-muted">{commands.length.toLocaleString()} queued or historical commands</p>
                </div>

                <div className="max-h-[40rem] overflow-y-auto divide-y divide-border-secondary">
                  {commands.length === 0 ? (
                    <div className="p-6 text-text-muted text-sm">No commands found for this agent.</div>
                  ) : (
                    commands.map((command) => (
                      <div key={command.command_id} className="p-4">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <p className="text-text-primary font-medium">
                              {command.command?.type || 'unknown command'}
                            </p>
                            <p className="text-xs text-text-muted font-mono">
                              {command.command_id}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-bg-surface text-text-primary capitalize">
                            {command.command_status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="bg-bg-surface rounded p-3">
                            <p className="text-xs text-text-muted mb-1">Created</p>
                            <p className="text-text-primary">
                              {command.created_at ? new Date(command.created_at).toLocaleString() : 'unknown'}
                            </p>
                          </div>
                          <div className="bg-bg-surface rounded p-3">
                            <p className="text-xs text-text-muted mb-1">Updated</p>
                            <p className="text-text-primary">
                              {command.updated_at ? new Date(command.updated_at).toLocaleString() : 'unknown'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 bg-bg-surface rounded p-3">
                          <p className="text-xs text-text-muted mb-1">Payload</p>
                          <pre className="text-xs text-text-primary whitespace-pre-wrap break-all font-mono">
                            {JSON.stringify(command.command, null, 2)}
                          </pre>
                        </div>

                        {command.command_feedback && (
                          <div className="mt-3 text-sm text-yellow-300 bg-yellow-900/10 border border-yellow-500/20 rounded p-3">
                            {command.command_feedback}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="bg-bg-card border border-border-secondary rounded-lg p-4 h-fit">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Agent Summary</h2>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-text-muted">Name</dt>
              <dd className="text-text-primary">{agent.agent_name}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Status</dt>
              <dd className="text-text-primary capitalize">{agent.agent_status}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Revision</dt>
              <dd className="text-text-primary">{agent.revision ?? 'n/a'}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Team</dt>
              <dd className="text-text-primary">{teamData?.team_name}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  )
}
