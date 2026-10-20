import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUp, Check, Copy, Menu, Plus, Moon, RotateCcw, Square, Sun, Trash2, X } from 'lucide-react'
import { callModel } from './api'
import AnswerBody from './components/AnswerBody'

const FOLLOW_UPS = ['Explain why', 'Show the risks', 'What is a middle option?']

const STEPS = [
  { key: 'F', name: 'Fact' },
  { key: 'L', name: 'Logic' },
  { key: 'R', name: 'Reasoning' },
  { key: 'R', name: 'Representation' },
  { key: 'C', name: 'Conclusion' },
]

const EXAMPLES = [
  'College ki vellala? (attendance 68%, exam in 10 days)',
  'Paytm 6 months unpaid internship vellala vadda? (4-1 starts in 1 week)',
  'Gym ki vellala? (energy 3/10, sleep 5 hrs, exam repu)',
  'Paid course konala? (cost 4000, free alternatives available)',
]

const HISTORY_KEY = 'flrrc-history-v1'
const MODEL_URL = 'https://huggingface.co/bhargavsai2005/flrrc-v1.4-lora'

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []
  } catch {
    return []
  }
}

function Logo({ size, className = '' }) {
  return (
    <img
      src="/flrrc_logo.png"
      alt="FLRRC logo"
      width={size}
      height={size}
      draggable="false"
      className={`logo-blend select-none ${className}`}
    />
  )
}

function Thinking() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 1300)
    return () => clearInterval(t)
  }, [])

  return (
    <div>
      <p className="text-sm text-muted mb-3 animate-blink">
        Calculating... first request can take up to 30s while the GPU warms up
      </p>
      <div className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <span
            key={s.name}
            className={`px-3 py-1 rounded-full text-xs border transition-all duration-300 ${
              i === active
                ? 'border-cyan/60 bg-cyan/10 text-cyan'
                : 'border-line text-dim'
            }`}
          >
            {s.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function ActionButton({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg text-dim hover:text-fg hover:bg-hover transition"
    >
      {children}
    </button>
  )
}

function AnswerCard({ item, isLast, busy, onRetry, onFollowUp, onGrow }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.answer)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <div className="flex gap-3 animate-fade-up">
      <div className="shrink-0 w-9 h-9 rounded-xl bg-black border border-line overflow-hidden flex items-center justify-center">
        <Logo size={30} />
      </div>
      <div className="flex-1 min-w-0">
        {item.status === 'loading' && (
          <div className="rounded-2xl rounded-tl-md bg-panel border border-line p-5">
            <Thinking />
          </div>
        )}

        {(item.status === 'error' || item.status === 'stopped') && (
          <div className="rounded-2xl rounded-tl-md bg-panel border border-line p-5">
            <p className={`text-sm ${item.status === 'error' ? 'text-danger' : 'text-muted'}`}>
              {item.status === 'error' ? item.error : 'Generation stopped.'}
            </p>
            <button
              onClick={() => onRetry(item.question)}
              disabled={busy}
              className="mt-3 inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-line hover:bg-hover text-fg2 disabled:opacity-50 transition"
            >
              <RotateCcw size={13} /> Try again
            </button>
          </div>
        )}

        {item.status === 'done' && (
          <>
            <div className="rounded-2xl rounded-tl-md bg-panel border border-line p-5">
              <AnswerBody text={item.answer} animate={item.animate} onGrow={onGrow} />
            </div>

            <div className="mt-2 flex items-center gap-1">
              <ActionButton onClick={copy} title="Copy">
                {copied ? <Check size={15} className="text-mint" /> : <Copy size={15} />}
              </ActionButton>
              <ActionButton onClick={() => !busy && onRetry(item.question)} title="Regenerate">
                <RotateCcw size={15} />
              </ActionButton>
              <span className="ml-2 text-xs text-dim">
                v1.4 POC, scores and facts can be wrong. Final decision neethi.
              </span>
            </div>

            {isLast && !busy && (
              <div className="mt-3 flex flex-wrap gap-2">
                {FOLLOW_UPS.map((f) => (
                  <button
                    key={f}
                    onClick={() => onFollowUp(item.question, f)}
                    className="px-3 py-1.5 rounded-full text-xs border border-line text-muted hover:border-cyan/50 hover:text-fg transition"
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Hero({ onPick }) {
  return (
    <div className="max-w-3xl mx-auto px-6 pt-10 pb-6 text-center animate-fade-up">
      <div className="relative inline-block">
        <div className="absolute inset-0 -z-0 blur-3xl opacity-40 brand-gradient rounded-full scale-75" />
        <div className="hero-logo-wrap relative animate-float">
          <Logo size={168} />
        </div>
      </div>

      <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight brand-text">
        FLRRC Decision Engine
      </h1>
      <p className="mt-3 text-fg2 text-lg">Not a Chatbot. A Decision Calculator.</p>
      <p className="mt-1 text-dim text-sm">Converts confusion into math clarity.</p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s.name}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-panel border border-line"
          >
            <span
              className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center text-on-brand ${
                i % 2 === 0 ? 'bg-violet' : 'bg-azure'
              }`}
            >
              {s.key}
            </span>
            <span className="text-xs text-fg2">{s.name}</span>
          </div>
        ))}
      </div>

      <p className="mt-10 mb-3 text-xs uppercase tracking-widest text-dim">Try an example</p>
      <div className="grid sm:grid-cols-2 gap-3 text-left">
        {EXAMPLES.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="p-4 rounded-2xl bg-panel border border-line hover:border-cyan/50 hover:bg-panel-2 text-sm text-fg2 transition"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [items, setItems] = useState([])
  const [history, setHistory] = useState(loadHistory)
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('flrrc-theme', theme)
    } catch {
      // storage unavailable, ignore
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const textareaRef = useRef(null)
  const endRef = useRef(null)
  const controllers = useRef({})

  const busy = items.some((i) => i.status === 'loading')

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch {
      /* storage full or blocked */
    }
  }, [history])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [items])

  const run = async (question) => {
    const id = crypto.randomUUID()
    const controller = new AbortController()
    controllers.current[id] = controller
    setItems((prev) => [...prev, { id, question, status: 'loading' }])
    try {
      const answer = await callModel(question, controller.signal)
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'done', answer, animate: true } : i))
      )
      setHistory((h) => [{ id, question, answer, ts: Date.now() }, ...h].slice(0, 30))
    } catch (e) {
      const aborted = e.name === 'AbortError'
      const message = e.message || 'Could not reach the FLRRC Space'
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? aborted
              ? { ...i, status: 'stopped' }
              : { ...i, status: 'error', error: message }
            : i
        )
      )
    } finally {
      delete controllers.current[id]
    }
  }

  const stop = () => {
    Object.values(controllers.current).forEach((c) => c.abort())
  }

  const followUp = (question, extra) => {
    if (!busy) run(`${question}. ${extra}`)
  }

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [])

  const send = (text) => {
    const q = (text ?? input).trim()
    if (!q || busy) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    run(q)
  }

  const retry = (question) => {
    if (!busy) run(question)
  }

  const newDecision = () => {
    if (busy) return
    setItems([])
    setInput('')
    setSidebarOpen(false)
  }

  const openHistory = (h) => {
    if (busy) return
    setItems([{ id: h.id, question: h.question, answer: h.answer, status: 'done' }])
    setSidebarOpen(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const onInput = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px'
  }

  return (
    <div className="app-bg flex h-dvh text-fg2">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-40 inset-y-0 left-0 w-72 bg-panel border-r border-line flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black border border-line overflow-hidden flex items-center justify-center">
              <Logo size={36} />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-fg">FLRRC</p>
              <p className="text-[11px] text-dim">Decision Calculator</p>
            </div>
          </div>
          <button
            className="md:hidden p-2 text-muted hover:text-fg"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4">
          <button
            onClick={newDecision}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl brand-gradient text-on-brand font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition"
          >
            <Plus size={16} /> New decision
          </button>
        </div>

        <div className="mt-5 px-4 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-widest text-dim">Recent</p>
          {history.length > 0 && (
            <button
              onClick={() => setHistory([])}
              title="Clear history"
              className="p-1 text-dim hover:text-danger transition"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div className="mt-2 flex-1 overflow-y-auto px-2 pb-2">
          {history.length === 0 && (
            <p className="px-3 py-2 text-sm text-dim">No decisions yet</p>
          )}
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() => openHistory(h)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted hover:bg-hover hover:text-fg truncate transition"
              title={h.question}
            >
              {h.question}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-line text-xs text-dim space-y-1">
          <a
            href={MODEL_URL}
            target="_blank"
            rel="noreferrer"
            className="block hover:text-cyan transition"
          >
            TinyLlama 1.1B + LoRA adapter
          </a>
          <p>v1.4 POC</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 px-4 flex items-center justify-between border-b border-line backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              className="md:hidden p-2 -ml-2 text-muted hover:text-fg"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <span className="font-semibold text-fg">Decision Calculator</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={MODEL_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-line hover:border-cyan/50 text-fg2 transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-warn" />
              v1.4 POC
            </a>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-fg2 hover:bg-hover hover:border-cyan/50 transition"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <Hero onPick={(q) => send(q)} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
              {items.map((item, idx) => (
                <div key={item.id} className="space-y-4">
                  <div className="flex justify-end animate-fade-up">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-md brand-gradient text-on-brand px-4 py-3 text-[15px] font-medium whitespace-pre-wrap shadow-lg shadow-black/10">
                      {item.question}
                    </div>
                  </div>
                  <AnswerCard
                    item={item}
                    isLast={idx === items.length - 1}
                    busy={busy}
                    onRetry={retry}
                    onFollowUp={followUp}
                    onGrow={scrollToEnd}
                  />
                </div>
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 px-4 sm:px-6 pb-4 pt-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 rounded-2xl bg-panel border border-line focus-within:border-cyan/60 transition p-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={onInput}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Question + details in brackets: Gym ki vellala? (energy 3/10, sleep 5 hrs)"
                className="flex-1 bg-transparent resize-none px-3 py-2.5 text-[15px] text-fg placeholder:text-dim max-h-44"
              />
              {busy ? (
                <button
                  onClick={stop}
                  aria-label="Stop generating"
                  className="shrink-0 w-10 h-10 rounded-xl bg-fg text-ink flex items-center justify-center hover:opacity-90 transition"
                >
                  <Square size={14} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={() => send()}
                  disabled={!input.trim()}
                  aria-label="Calculate decision"
                  className="shrink-0 w-10 h-10 rounded-xl brand-gradient text-on-brand flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ArrowUp size={18} />
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-[11px] text-dim">
              Idi Decision Support Tool matrame. Final decision neethi. Manam proofs istham, choose chesedi nuvve.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
