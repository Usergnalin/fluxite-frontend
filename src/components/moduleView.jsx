import { useState, useEffect, useCallback } from 'react'
import { useApi } from '../api/client.jsx'
import { useTeamData } from '../hooks/useTeamData.jsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { resolveDependencies } from '../libs/modrinthResolver.js'
import { Download, Calendar, Hash, FileCode, CheckCircle, X, Package, AlertTriangle, AlertCircle } from 'lucide-react'

export default function ModuleView({ teamId, agentId, serverId, projectId, onClose, isInstalled = false }) {
    const [project, setProject] = useState(null)
    const [versions, setVersions] = useState([])
    const [_members, setMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedVersion, setSelectedVersion] = useState(null)
    const { modrinth_client, auth_client } = useApi()
    const teamData = useTeamData(teamId)
    const [showModpackSetup, setShowModpackSetup] = useState(false)
    const [modpackName, setModpackName] = useState('')
    const [modpackThumbnailUrl, setModpackThumbnailUrl] = useState('')

    // Install modal state
    const [installing, setInstalling] = useState(false)
    const [installSuccess, setInstallSuccess] = useState(false)
    const [installError, setInstallError] = useState(null)

    // Dependency resolution state
    const [showResolveModal, setShowResolveModal] = useState(false)
    const [resolvedDeps, setResolvedDeps] = useState(null)
    const [resolvingDeps, setResolvingDeps] = useState(false)

    const getInitials = (name) => {
        if (!name) return ''
        const words = name.trim().split(/\s+/)
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase()
        }
        return name.slice(0, 2).toUpperCase()
    }

    const getBestVersion = useCallback((versions) => {
        const mc_version = teamData?.servers?.[serverId]?.properties?.mc_version
        const loader_type = teamData?.servers?.[serverId]?.properties?.loader_type
        if (!mc_version || !loader_type) return null
        // Filter versions by minecraft version and loader type
        const filteredVersions = versions.filter(version =>
            version.game_versions.includes(mc_version) &&
            version.loaders.includes(loader_type)
        )
        // Return null if no matching version found (requires manual selection)
        if (filteredVersions.length === 0) return null
        return filteredVersions.sort((a, b) => new Date(b.date_published) - new Date(a.date_published))[0]
    }, [teamData, serverId])

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch project metadata and versions in parallel
                const [projectRes, versionsRes, membersRes] = await Promise.all([
                    modrinth_client.get(`/project/${projectId}`),
                    modrinth_client.get(`/project/${projectId}/version?include_changelog=false`),
                    modrinth_client.get(`/project/${projectId}/members`)
                ])
                setProject(projectRes.data)
                setVersions(versionsRes.data)
                setMembers(membersRes.data)
                // Select best matching version by default (null if no match, requires manual selection)
                if (versionsRes.data.length > 0) {
                    const bestVersion = getBestVersion(versionsRes.data)
                    setSelectedVersion(bestVersion)
                }
            } catch (error) {
                console.error('Failed to fetch module data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [projectId, modrinth_client, getBestVersion])

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-5xl rounded-lg bg-bg-card p-6 shadow-xl border border-border-secondary">
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-5xl rounded-lg bg-bg-card p-6 shadow-xl border border-border-secondary">
                    <p className="text-text-muted text-center">Failed to load project data</p>
                    <button 
                        className="mt-4 w-full rounded-lg border border-border-primary bg-bg-surface py-2 text-text-primary transition-colors hover:bg-bg-card-hover" 
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        )
    }

    const openModpackSetup = () => {
        setModpackName(project.title || '')
        setModpackThumbnailUrl(project.icon_url || '')
        setShowModpackSetup(true)
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-7xl rounded-lg bg-bg-card shadow-xl border border-border-secondary overflow-hidden max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border-secondary bg-bg-secondary">
                    <div className="flex items-center gap-3">
                        {project.icon_url ? (
                            <img src={project.icon_url} alt={project.title} className="w-25 h-25 rounded-lg object-cover" />
                        ) : (
                            <div className="w-10 h-10 bg-bg-surface rounded-lg flex items-center justify-center text-text-muted">
                                <FileCode size={20} />
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <h1 className="text-lg font-bold text-text-primary">{project.title}</h1>
                            <p className="text-sm opacity-60">{project.description}</p>
                            <div className="flex items-center gap-2">
                                {/* Stats */}
                                <span className="flex items-center gap-3 opacity-60">
                                    <Download size={14} />
                                    {project.downloads.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-3 opacity-60">
                                    <Hash size={14} />
                                    {project.followers} followers
                                </span>
                                <span className="flex items-center gap-3 opacity-60">
                                    <Calendar size={14} />
                                    {new Date(project.updated).toLocaleDateString()}
                                </span>
                                {/* Categories */}
                                {project.categories.map(cat => (
                                    <span key={cat} className="text-xs bg-bg-surface text-text-primary px-2 py-1 rounded capitalize">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </div>                    
                    </div>
                    {!isInstalled && (
                        <button
                            className="flex h-20 w-40 items-center justify-center rounded-lg border border-transparent bg-accent-primary text-lg text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!selectedVersion || resolvingDeps}
                            onClick={handleInstallClick}
                        >
                            {resolvingDeps ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <><Download size={20} /> <span className="ml-2">Install</span></>
                            )}
                        </button>
                    )}
                </div>

                {/* 2-Column Layout */}
                <div className="flex flex-col md:flex-row h-[calc(85vh-140px)]">
                    {/* Left Column - Project Details */}
                    <div className="flex-1 p-4 overflow-y-auto border-r border-border-secondary">

                        {/* Description with Markdown */}
                        <article className="prose prose-invert max-w-none prose-headings:font-bold">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]} 
                                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                            >
                                {project.body}
                            </ReactMarkdown>
                        </article>

                        {/* License */}
                        {project.license?.id && (
                            <div className="mt-4 pt-4 border-t border-border-secondary">
                                <p className="text-xs text-text-muted">
                                    License: <span className="text-text-primary">{project.license.id}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Versions List */}
                    <div className="w-full md:w-80 bg-bg-secondary overflow-y-auto">
                        <div className="p-3 border-b border-border-secondary">
                            <h2 className="text-sm font-semibold text-text-primary">Versions</h2>
                        </div>
                        <div className="divide-y divide-border-secondary">
                            {versions.length === 0 ? (
                                <p className="p-4 text-sm text-text-muted text-center">No versions found</p>
                            ) : (
                                (() => {
                                    const bestVersion = getBestVersion(versions)
                                    return versions.map(version => {
                                        const isBest = bestVersion?.id === version.id
                                        return (
                                    <button
                                        key={version.id}
                                        onClick={() => setSelectedVersion(version)}
                                        className={`w-full p-3 text-left hover:bg-bg-surface transition-colors ${
                                            selectedVersion?.id === version.id ? 'bg-bg-surface' : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-text-primary">{version.version_number}</span>
                                                {isBest && (
                                                    <span className="rounded bg-accent-primary px-1.5 py-0.5 text-xs font-medium text-white">
                                                        Best Match
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-text-muted">{version.version_type}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {version.game_versions?.slice(0, 3).map(v => (
                                                <span key={v} className="text-xs bg-bg-card text-text-muted px-1.5 py-0.5 rounded">
                                                    {v}
                                                </span>
                                            ))}
                                            {version.game_versions?.length > 3 && (
                                                <span className="text-xs text-text-muted">+{version.game_versions.length - 3}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-text-muted">
                                            <Download size={12} />
                                            {version.downloads.toLocaleString()}
                                            {version.loaders?.map(loader => (
                                                <span key={loader} className="capitalize">• {loader}</span>
                                            ))}
                                        </div>
                                    </button>
                                )})
                                })()
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Installation Status Modal */}
            {(installing || installSuccess || installError) && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-lg bg-bg-card shadow-xl border border-border-secondary overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border-secondary bg-bg-secondary">
                            <h2 className="text-lg font-bold text-text-primary">
                                {installSuccess ? 'Installation Complete' : installing ? `Installing ${project?.project_type || 'Module'}...` : 'Installation Failed'}
                            </h2>
                            {!installing && (
                                <button
                                    onClick={() => {
                                        setInstallSuccess(false)
                                        setInstallError(null)
                                    }}
                                    className="text-text-muted hover:text-text-primary text-2xl"
                                >
                                    <X size={24} />
                                </button>
                            )}
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {installing ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-text-primary text-lg">Installing {project?.project_type || 'module'}...</p>
                                    <p className="text-text-muted text-sm mt-2">This may take a few moments</p>
                                </div>
                            ) : installSuccess ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <CheckCircle size={48} className="mb-4 text-status-online" />
                                    <p className="text-text-primary text-lg">{project?.project_type ? project.project_type.charAt(0).toUpperCase() + project.project_type.slice(1) : 'Module'} installed successfully!</p>
                                    <p className="text-text-muted text-sm mt-2">{project.title} has been installed</p>
                                </div>
                            ) : installError ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <X size={48} className="mb-4 text-error" />
                                    <p className="text-text-primary text-lg">Installation failed</p>
                                    <p className="mt-2 text-center text-sm text-error-light">{installError}</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* Dependency Resolution Confirmation Modal */}
            {showResolveModal && resolvedDeps && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-lg rounded-lg bg-bg-card shadow-xl border border-border-secondary overflow-hidden max-h-[80vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border-secondary bg-bg-secondary flex-shrink-0">
                            <h2 className="text-lg font-bold text-text-primary">
                                Confirm Installation
                            </h2>
                            <button
                                onClick={() => {
                                    setShowResolveModal(false)
                                    setResolvedDeps(null)
                                }}
                                className="text-text-muted hover:text-text-primary text-2xl"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-4 overflow-y-auto flex-1">
                            {/* Main module being installed */}
                            <div className="mb-4 p-3 bg-bg-surface rounded-lg border border-border-primary">
                                <p className="text-sm text-text-muted mb-1">Installing:</p>
                                <p className="font-semibold text-text-primary">{project.title}</p>
                            </div>

                            {/* Dependencies to install */}
                            {resolvedDeps.modules.length > 1 && (
                                <div className="mb-4">
                                    <p className="text-sm text-text-muted mb-2">
                                        The following {resolvedDeps.modules.length - 1} dependenc{resolvedDeps.modules.length - 1 === 1 ? 'y' : 'ies'} will also be installed:
                                    </p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {resolvedDeps.modules.filter(m => m.project_id !== projectId).map((module) => (
                                            <div key={module.project_id} className="flex items-center gap-2 p-2 bg-bg-secondary rounded">
                                                <Package size={16} className="text-text-muted" />
                                                <span className="text-sm text-text-primary">{module.module_name}</span>
                                                <span className="text-xs text-text-muted ml-auto">{module.project_id}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {resolvedDeps.modules.length === 1 && (
                                <p className="text-sm text-text-muted mb-4">No additional dependencies required.</p>
                            )}

                            {/* Warnings */}
                            {resolvedDeps.warnings.length > 0 && (
                                <div className="mb-4">
                                    <div className="mb-2 flex items-center gap-2 text-warning">
                                        <AlertTriangle size={16} />
                                        <p className="font-semibold text-sm">Warnings:</p>
                                    </div>
                                    <div className="space-y-2">
                                        {resolvedDeps.warnings.map((warning, idx) => (
                                            <div key={idx} className="flex items-start gap-2 rounded border border-warning/30 bg-warning/10 p-2">
                                                <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-warning" />
                                                <p className="text-sm text-warning">{warning}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 p-4 border-t border-border-secondary bg-bg-secondary flex-shrink-0">
                            <button
                                onClick={() => {
                                    setShowResolveModal(false)
                                    setResolvedDeps(null)
                                }}
                                className="flex-1 py-2 bg-bg-surface hover:bg-bg-card-hover text-text-primary rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowResolveModal(false)
                                    handleModuleInstall(resolvedDeps.modules)
                                }}
                                className="flex-1 rounded-lg border border-transparent bg-accent-primary py-2 text-white transition-colors hover:bg-accent-hover"
                            >
                                Install {resolvedDeps.modules.length} Module{resolvedDeps.modules.length !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showModpackSetup && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
                    <div
                        className="w-full max-w-4xl rounded-lg bg-bg-card shadow-xl border border-border-secondary overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-border-secondary bg-bg-secondary">
                            <h2 className="text-lg font-bold text-text-primary">Prepare Modpack Install</h2>
                            <button
                                onClick={() => setShowModpackSetup(false)}
                                className="text-text-muted hover:text-text-primary text-2xl"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex gap-6 mb-6">
                                <div className="w-1/3">
                                    <h2 className="text-lg font-semibold mb-4">
                                        {modpackThumbnailUrl ? 'Public server icon' : 'Private placeholder icon'}
                                    </h2>
                                    <div className={`w-full aspect-square rounded ${modpackThumbnailUrl ? '' : 'bg-bg-surface'} flex items-center justify-center overflow-hidden transition-colors duration-300`}>
                                        {modpackThumbnailUrl ? (
                                            <img
                                                src={modpackThumbnailUrl}
                                                alt={getInitials(modpackName || project.title)}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-5xl text-text-primary">
                                                {getInitials(modpackName || project.title)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="w-2/3">
                                    <h2 className="text-lg font-semibold mb-4">Enter a Server Name</h2>
                                    <input
                                        type="text"
                                        value={modpackName}
                                        placeholder={project.title || 'My Modpack Server'}
                                        className="mb-4 w-full rounded-lg border border-border-primary bg-bg-surface p-3 text-text-primary transition-colors focus:border-accent-primary focus:outline-none"
                                        onChange={(e) => setModpackName(e.target.value)}
                                    />

                                    <h3 className="text-sm font-semibold mt-2 mb-2 text-text-secondary">Custom Thumbnail URL (Optional)</h3>
                                    <input
                                        type="text"
                                        value={modpackThumbnailUrl}
                                        placeholder="https://example.com/image.png"
                                        className="mb-4 w-full rounded-lg border border-border-primary bg-bg-surface p-3 text-text-primary transition-colors focus:border-accent-primary focus:outline-none"
                                        onChange={(e) => setModpackThumbnailUrl(e.target.value)}
                                    />

                                    <p className="text-sm text-text-muted leading-relaxed">
                                        Add an image link to set your server icon for players.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowModpackSetup(false)}
                                    className="flex-1 rounded-lg border border-border-primary bg-bg-surface py-2 transition-colors hover:bg-bg-card-hover"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowModpackSetup(false)
                                        handleModuleInstall()
                                    }}
                                    disabled={!modpackName.trim()}
                                    className="flex-1 rounded-lg border border-transparent bg-accent-primary py-2 text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-bg-tertiary disabled:text-text-muted"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    async function handleInstallClick() {
        if (!selectedVersion) return

        const projectType = project.project_type

        if (projectType === 'modpack') {
            // Modpacks need the same naming/icon step as custom servers
            openModpackSetup()
            return
        }

        // For mods, plugins, resourcepacks, datapacks: resolve dependencies first
        setResolvingDeps(true)
        setInstallError(null)

        try {
            // Get installed mods for the server
            const installedMods = Object.values(teamData?.modules || {}).filter(
                m => m.server_id === serverId && m.module_type === 'mod'
            )

            // Get server properties for game version and loader
            const server = teamData?.servers?.[serverId]
            const gameVersion = server?.properties?.mc_version
            const loader = server?.properties?.loader_type

            // Resolve dependencies
            const result = await resolveDependencies(
                projectId,
                selectedVersion.id,
                installedMods,
                gameVersion,
                loader
            )

            setResolvedDeps(result)
            setShowResolveModal(true)
        } catch (error) {
            console.error('Failed to resolve dependencies:', error)
            setInstallError(error.message)
        } finally {
            setResolvingDeps(false)
        }
    }

    async function handleModuleInstall(modulesToInstall = null) {
        if (!selectedVersion) return

        setInstalling(true)
        setInstallError(null)
        setInstallSuccess(false)

        try {
            const projectType = project.project_type

            if (projectType === 'modpack') {
                // For modpacks: find .mrpack file and install directly without dependency resolution
                const mrpackFile = selectedVersion.files.find(file => file.filename.endsWith('.mrpack'))

                if (!mrpackFile) {
                    throw new Error('No .mrpack file found in this version')
                }

                await auth_client.post(`/command/${agentId}`, {
                    command: {
                        type: 'create_modpack',
                        name: modpackName.trim() || project.title,
                        server_thumbnail: modpackThumbnailUrl.trim() || undefined,
                        manifest_hash: mrpackFile.hashes.sha1 || mrpackFile.hashes.sha512,
                        project_id: projectId,
                        version_id: selectedVersion.id,
                        file_name: mrpackFile.filename
                    }
                })
            } else {
                // For mods, plugins, resourcepacks, datapacks: install with resolved dependencies
                // Use modulesToInstall if provided (from dependency resolution), otherwise use single module
                const modules = modulesToInstall || [{
                    hash: selectedVersion.files[0]?.hashes?.sha1 || '',
                    project_id: projectId,
                    version_id: selectedVersion.id,
                    module_name: project.title,
                    module_type: projectType,
                    file_name: selectedVersion.files[0]?.filename || `${projectId}-${selectedVersion.id}`
                }]

                await auth_client.post(`/command/${agentId}`, {
                    command: {
                        type: 'install_modules',
                        server_id: serverId,
                        modules: modules
                    }
                })
            }

            setInstallSuccess(true)
            setResolvedDeps(null)
        } catch (error) {
            console.error('Failed to install module:', error)
            setInstallError(error.message)
        } finally {
            setInstalling(false)
        }
    }
}
