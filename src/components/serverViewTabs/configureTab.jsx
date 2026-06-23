import { useMemo, useState } from 'react'
import { Trash2, AlertTriangle, Copy } from 'lucide-react'
import { useTeamData } from '../../hooks/useTeamData.jsx'

export default function ConfigureTab({ teamId, agentId, serverId, auth_client, onBack }) {
    const [deleteConfirmation, setDeleteConfirmation] = useState('')
    const [deleting, setDeleting] = useState(false)
    const teamData = useTeamData(teamId)

    const tunnelData = useMemo(
        () => Object.values(teamData?.tunnels || {}).find((tunnel) => tunnel.server_id === serverId),
        [teamData?.tunnels, serverId],
    )
    const serverData = useMemo(
        () => teamData?.servers?.[serverId] || Object.values(teamData?.servers || {}).find((server) => server.server_id === serverId),
        [teamData?.servers, serverId],
    )

    if (!serverData) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <h2 className="mb-6 text-2xl font-bold text-text-primary">Configure Server</h2>
                <div className="rounded-xl border border-border-primary bg-bg-card p-6 shadow-lg">
                    <p className="text-text-muted">Loading server details...</p>
                </div>
            </div>
        )
    }

    const handleDeleteServer = async () => {
        if (deleteConfirmation !== 'DELETE FOREVER') return

        setDeleting(true)
        try {
            await auth_client.post(`/command/${agentId}`, {
                command: {
                    type: 'delete_server',
                    server_id: serverId
                }
            })
            onBack()
        } catch (error) {
            console.error('Failed to delete server:', error)
        } finally {
            setDeleting(false)
        }
    }

    const handleExposePublic = async () => {
        try {
            await auth_client.post(`/tunnel/server/${serverId}`, {})
        } catch (error) {
            console.error('Failed to expose server:', error)
        }
    }

    const handleOffTunnel = async () => {
        try {
            await auth_client.delete(`/tunnel/${tunnelData.tunnel_id}`)
        } catch (error) {
            console.error('Failed to turn off tunnel:', error)
        }
    }

    const copyTunnelUrl = () => {
        navigator.clipboard.writeText(`${tunnelData.subdomain}.fluxite.io`)
    }

    const copyLocalUrl = () => {
        if (serverData?.server_port) {
            navigator.clipboard.writeText(`localhost:${serverData.server_port}`)
        }
    }

    const isDeleteEnabled = deleteConfirmation === 'DELETE FOREVER' && !deleting

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <h2 className="text-2xl font-bold text-text-primary">Configure Server</h2>

            <div className="rounded-xl border border-border-primary bg-bg-card p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-text-primary">Server Access</h3>
                    {tunnelData ? (
                        tunnelData.to_delete ? (
                            <button onClick={handleOffTunnel} className="cursor-not-allowed rounded-lg border border-border-primary bg-bg-surface px-3 py-2 text-text-muted" disabled>
                                Tunnel is being deleted...
                            </button>
                        ) : (
                            <button onClick={handleOffTunnel} className="rounded-lg border border-border-primary bg-bg-surface px-3 py-2 text-text-primary transition-colors hover:bg-bg-card-hover">
                                Turn off Tunnel
                            </button>
                        )
                    ) : (
                        <button onClick={handleExposePublic} className="rounded-lg border border-transparent bg-accent-primary px-3 py-2 text-white transition-colors hover:bg-accent-hover">
                            Expose to public
                        </button>
                    )}
                </div>

                {tunnelData ? (
                    <div className="space-y-2">
                        <p className="text-text-secondary">This server is Publicly accessible on</p>
                        <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-surface px-3 py-2">
                            <span className="flex-1 break-all text-lg text-text-primary">
                                {tunnelData.subdomain}.fluxite.io
                            </span>

                            <button
                                onClick={copyTunnelUrl}
                                className="text-text-muted transition-colors hover:text-text-primary"
                            >
                                <Copy size={24} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-text-secondary">
                            This server is not publicly accessible. Access it locally on
                        </p>
                        <div className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-surface px-3 py-2">
                            <span className="flex-1 break-all text-lg text-text-primary">
                                {serverData?.server_port ? `localhost:${serverData.server_port}` : 'Loading port...'}
                            </span>

                            <button
                                onClick={copyLocalUrl}
                                className="text-text-muted transition-colors hover:text-text-primary"
                            >
                                <Copy size={24} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-[#f85149]/25 bg-[#161b22] p-6 shadow-lg">
                <div className="mb-4 flex items-center gap-3">
                    <AlertTriangle className="text-error" size={24} />
                    <h3 className="text-xl font-semibold text-error">Delete Server</h3>
                </div>

                <div className="space-y-4">
                    <p className="text-error-light">
                        <strong>Warning:</strong> This action will permanently delete all files associated with this server.
                        This operation is <strong>irreversible</strong> and cannot be undone.
                    </p>

                    <p className="text-sm text-text-secondary">
                        Server to be deleted: <span className="font-medium text-text-primary">{serverData.server_name}</span>
                    </p>

                    <div className="space-y-2">
                        <label className="block text-sm text-text-secondary">
                            Type <code className="rounded border border-[#f85149]/20 bg-[#2d1618] px-2 py-1 text-error-light">DELETE FOREVER</code> to enable deletion:
                        </label>
                        <input
                            type="text"
                            value={deleteConfirmation}
                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                            placeholder="DELETE FOREVER"
                            className="w-full rounded-lg border border-border-primary bg-bg-input px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
                        />
                    </div>

                    <button
                        onClick={handleDeleteServer}
                        disabled={!isDeleteEnabled}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 font-medium transition-colors ${
                            isDeleteEnabled
                                ? 'border-transparent bg-error text-white hover:opacity-90'
                                : 'cursor-not-allowed border-border-primary bg-bg-tertiary text-text-muted'
                        }`}
                    >
                        {deleting ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                Deleting Server...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Delete Server
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
