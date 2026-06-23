import { useState } from 'react'
import { Play, Square, RotateCcw, Skull, Send, AlertTriangle } from 'lucide-react'
import LogViewer from '../logViewer.jsx'

export default function OverviewTab({ server, agentId, serverId, auth_client }) {
    const [loadingAction, setLoadingAction] = useState(false)
    const [commandInput, setCommandInput] = useState('')
    const [killWarning, setKillWarning] = useState(false)

    const status = server?.server_status || 'unknown'

    const handleAction = (action) => {
        setLoadingAction(true)
        auth_client.post(`/command/${agentId}`, {
            command: { type: action, server_id: serverId }
        }).finally(() => {
            setTimeout(() => setLoadingAction(false), 2000)
        })
    }

    const handleSendCommand = () => {
        if (!commandInput.trim()) return
        auth_client.post(`/command/${agentId}`, {
            command: { type: 'mc_command', server_id: serverId, command: commandInput.trim() }
        }).then(() => {
            setCommandInput('')
        }).catch((err) => {
            console.error('Failed to send command:', err)
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => handleAction('start_server')}
                    disabled={status !== 'offline' || loadingAction}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        status === 'offline' && !loadingAction
                            ? 'border-transparent bg-status-online text-white hover:opacity-90'
                            : 'border-border-primary bg-bg-tertiary text-text-muted cursor-not-allowed'
                    }`}
                >
                    <Play size={18} />
                    Start
                </button>

                <button
                    onClick={() => handleAction('stop_server')}
                    disabled={status !== 'online' || loadingAction}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        status === 'online' && !loadingAction
                            ? 'border-transparent bg-error text-white hover:opacity-90'
                            : 'border-border-primary bg-bg-tertiary text-text-muted cursor-not-allowed'
                    }`}
                >
                    <Square size={18} />
                    Stop
                </button>

                <button
                    onClick={() => handleAction('restart_server')}
                    disabled={status !== 'online' || loadingAction}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        status === 'online' && !loadingAction
                            ? 'border-transparent bg-accent-primary text-white hover:bg-accent-hover'
                            : 'border-border-primary bg-bg-tertiary text-text-muted cursor-not-allowed'
                    }`}
                >
                    <RotateCcw size={18} />
                    Restart
                </button>

                <button
                    onClick={() => setKillWarning(true)}
                    disabled={status === 'offline' || loadingAction}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        status !== 'offline' && !loadingAction
                            ? 'border-transparent bg-accent-primary text-white hover:bg-accent-hover'
                            : 'border-border-primary bg-bg-tertiary text-text-muted cursor-not-allowed'
                    }`}
                >
                    <Skull size={18} />
                    Kill
                </button>
            </div>

            {killWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-xl border border-border-primary bg-bg-modal p-6 shadow-2xl">
                        <div className="mb-4 flex items-center gap-2">
                            <AlertTriangle size={24} className="text-error" />
                            <h3 className="text-lg font-semibold text-text-primary">Confirm Kill</h3>
                        </div>
                        <p className="mb-6 text-text-secondary">
                            This action will immediately terminate the server process and may cause{" "}
                            <span className="font-bold text-error-light">corruption</span> of your world.{" "}
                            Are you sure you want to <span className="font-bold">continue</span>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setKillWarning(false)}
                                className="flex-1 rounded-lg border border-border-primary bg-bg-surface px-4 py-2 text-text-primary transition-colors hover:bg-bg-card-hover"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setKillWarning(false)
                                    handleAction('kill_server')
                                }}
                                className="flex-1 rounded-lg border border-transparent bg-error px-4 py-2 text-white transition-colors hover:opacity-90"
                            >
                                Kill
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="h-[40rem] overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
                <LogViewer
                    streamPath={`/server/logs/${serverId}/stream`}
                    emptyMessage="waiting for server logs..."
                />
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
                    placeholder="Enter command..."
                    disabled={status !== 'online'}
                    className="flex-1 rounded-lg border border-border-primary bg-bg-input p-3 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent-primary disabled:opacity-50"
                />
                <button
                    onClick={handleSendCommand}
                    disabled={status !== 'online' || !commandInput.trim()}
                    className="flex items-center gap-2 rounded-lg border border-transparent bg-accent-primary px-4 py-2 text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-bg-tertiary disabled:text-text-muted"
                >
                    <Send size={18} />
                    Send
                </button>
            </div>
        </div>
    )
}
