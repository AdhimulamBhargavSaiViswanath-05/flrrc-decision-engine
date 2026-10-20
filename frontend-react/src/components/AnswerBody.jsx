import { useEffect, useState } from 'react'
import { ChevronsRight } from 'lucide-react'
import Markdown from './Markdown'
import FlrrcBoxes from './FlrrcBoxes'
import { parseDecision } from '../lib/parseDecision'

// Renders a model answer: FLRRC 5-box cards if the answer is the trained JSON format,
// otherwise markdown with a typewriter reveal (like ChatGPT / Claude / Gemini).
export default function AnswerBody({ text, animate, onGrow }) {
  const decision = parseDecision(text)
  const [shown, setShown] = useState(animate && !decision ? 0 : text.length)
  const typing = shown < text.length

  useEffect(() => {
    if (!typing) return
    const t = setInterval(() => {
      setShown((s) => Math.min(text.length, s + 4))
      onGrow?.()
    }, 18)
    return () => clearInterval(t)
  }, [typing, text.length, onGrow])

  if (decision) return <FlrrcBoxes data={decision} />

  return (
    <div>
      <Markdown>{text.slice(0, shown) + (typing ? ' ▍' : '')}</Markdown>
      {typing && (
        <button
          onClick={() => setShown(text.length)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-dim hover:text-fg transition"
        >
          <ChevronsRight size={14} /> Skip
        </button>
      )}
    </div>
  )
}
