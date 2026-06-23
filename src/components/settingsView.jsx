import { Palette, Sparkles, Monitor } from 'lucide-react'
import { THEME_OPTIONS } from '../libs/theme.js'

export default function SettingsView({ themeId, onThemeChange, onBack }) {
    return (
        <div className="mx-auto max-w-5xl space-y-6 p-2">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="rounded-lg border border-border-primary bg-bg-surface px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg-card-hover"
                >
                    &lt;- Back
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
                    <p className="mt-1 text-sm text-text-muted">Customize the look and feel of the dashboard.</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
                <div className="rounded-xl border border-border-primary bg-bg-card p-6 shadow-lg">
                    <div className="mb-5 flex items-center gap-3">
                        <Palette className="text-accent-light" size={22} />
                        <div>
                            <h2 className="text-xl font-semibold text-text-primary">Theme</h2>
                            <p className="text-sm text-text-muted">Switch the palette without changing the app layout.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {THEME_OPTIONS.map((theme) => {
                            const active = theme.id === themeId
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => onThemeChange(theme.id)}
                                    className={`rounded-xl border p-4 text-left transition-all ${
                                        active
                                            ? 'border-accent-primary bg-bg-secondary shadow-[0_0_0_1px_rgba(0,0,0,0.2)]'
                                            : 'border-border-primary bg-bg-surface hover:bg-bg-card-hover'
                                    }`}
                                >
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h3 className="text-base font-semibold text-text-primary">{theme.name}</h3>
                                        {active && (
                                            <span className="rounded-full border border-accent-primary bg-accent-primary/15 px-2 py-1 text-xs font-medium text-accent-light">
                                                Active
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-6 gap-2">
                                            <div className="h-10 rounded-md border border-border-primary" style={{ background: theme.bgSecondary }} />
                                            <div className="h-10 rounded-md border border-border-primary" style={{ background: theme.bgCard }} />
                                            <div className="h-10 rounded-md border border-border-primary" style={{ background: theme.bgSurface }} />
                                            <div className="h-10 rounded-md border border-border-primary" style={{ background: theme.bgTertiary }} />
                                            <div className="h-10 rounded-md border border-border-primary" style={{ background: theme.accent }} />
                                            <div className="h-10 rounded-md border border-border-primary" style={{ background: theme.statusOnline }} />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-text-muted">
                                            <span>Surface</span>
                                            <span>Accent</span>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="rounded-xl border border-border-primary bg-bg-card p-6 shadow-lg">
                    <div className="mb-5 flex items-center gap-3">
                        <Sparkles className="text-status-online" size={22} />
                        <div>
                            <h2 className="text-xl font-semibold text-text-primary">Preview</h2>
                            <p className="text-sm text-text-muted">A quick look at the current palette.</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border-primary bg-bg-surface p-4">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="h-11 w-11 rounded-full bg-accent-primary" />
                            <div>
                                <p className="text-sm font-semibold text-text-primary">Dashboard</p>
                                <p className="text-xs text-text-muted">Theme-aware preview</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="h-3 w-3/4 rounded-full bg-bg-card-hover" />
                            <div className="h-3 w-5/6 rounded-full bg-bg-card-hover" />
                            <div className="h-3 w-2/3 rounded-full bg-bg-card-hover" />
                        </div>
                        <div className="mt-5 flex items-center gap-3">
                            <button className="rounded-lg border border-transparent bg-accent-primary px-3 py-2 text-sm font-medium text-white">
                                Primary
                            </button>
                            <button className="rounded-lg border border-border-primary bg-bg-card px-3 py-2 text-sm font-medium text-text-primary">
                                Secondary
                            </button>
                        </div>
                    </div>

                    <div className="mt-5 flex items-center gap-2 rounded-lg border border-border-primary bg-bg-surface p-3 text-sm text-text-muted">
                        <Monitor size={16} />
                        Changes are saved instantly and kept in your browser.
                    </div>
                </div>
            </div>
        </div>
    )
}
