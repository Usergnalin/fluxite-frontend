import { useState, useEffect, useRef, useCallback } from 'react'
import { useApi } from '../api/client.jsx'
import { ArrowDownIcon } from 'lucide-react'

export default function LogViewer({
  streamPath,
  historyLines = 100,
  emptyMessage = 'waiting for logs…',
}) {
  const { create_sse } = useApi()

  const [logs, setLogs] = useState([])
  const [connected, setConnected] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)

  const bottomRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!streamPath) return

    const sse = create_sse(`${streamPath}?logs_history_lines=${historyLines}`, {
      onOpen: () => setConnected(true),
      onError: () => setConnected(false),
      events: {
        message: (data) => {
          const logsRaw = data.logs ?? ''

          const isRotation = logsRaw.trimEnd().endsWith('log_rotation')
          const cleaned = isRotation
            ? logsRaw.slice(0, logsRaw.lastIndexOf('log_rotation')).trimEnd()
            : logsRaw

          const newLines = cleaned.split('\n').filter((line) => line.length > 0)

          setLogs((prev) => {
            const next = isRotation ? [] : [...prev]
            return [...next, ...newLines]
          })
        },
      },
    })

    return () => {
      sse.close()
      setConnected(false)
    }
  }, [streamPath, historyLines, create_sse])

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [logs, autoScroll])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 80)
  }, [])

  return (
    <div className="flex flex-col h-full min-h-0 bg-bg-card border border-border-secondary rounded-lg overflow-hidden font-mono text-xs text-text-muted">
      <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border-secondary shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-text-muted text-[11px]">
            {connected ? 'live' : 'offline'}
          </span>
          <span className="text-text-muted text-[11px]">
            {logs.length.toLocaleString()} lines
          </span>
          {!autoScroll && (
            <button
              onClick={() => {
                setAutoScroll(true)
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 hover:bg-emerald-400/20 transition-colors text-[11px] tracking-wide"
            >
              <ArrowDownIcon size={10} strokeWidth={2.5} />
              tail
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-auto min-h-0 py-1 bg-bg-secondary"
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center gap-2.5 h-28 text-text-muted text-[12px] tracking-wide">
            <span>{emptyMessage}</span>
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className="px-3 py-px font-mono text-xs leading-relaxed text-text-primary whitespace-pre-wrap break-all"
            >
              {log}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
