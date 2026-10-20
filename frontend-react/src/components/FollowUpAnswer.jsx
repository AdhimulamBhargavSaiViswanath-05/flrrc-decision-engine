import { extractScore } from '../lib/parseDecision'
import { biggestDriver, buildFactors } from '../lib/decisionViz'

function Line({ label, value }) {
  if (!value) return null
  return (
    <div className="mb-2 last:mb-0">
      <p className="text-[11px] uppercase tracking-wider text-dim">{label}</p>
      <p className="text-sm text-fg2 leading-relaxed">{value}</p>
    </div>
  )
}

function whySummary(data) {
  const b2 = data.box_2_equation || {}
  const go = extractScore(b2.go_score)
  const nogo = extractScore(b2.nogo_score)
  if (go === null || nogo === null) return null
  const winner = go >= nogo ? 'Go' : 'No-Go'
  const gap = Math.round(Math.abs(go - nogo) * 100) / 100
  const driver = biggestDriver(buildFactors(b2))
  let text = `${winner} scores higher (Go ${go} vs No-Go ${nogo}, gap ${gap}).`
  if (gap <= 0.5) text += ' This is a close call, so treat the numbers as a tie-breaker, not a verdict.'
  if (driver) {
    text += ` The biggest difference comes from "${driver.name}" (Go ${driver.goValue}/10 vs No-Go ${driver.noGoValue}/10).`
  }
  return text
}

// Answers the follow-up buttons from the result that is already on screen.
// The model is trained for one question at a time, so nothing is sent to it again.
export default function FollowUpAnswer({ kind, data }) {
  const b1 = data.box_1_flrrc || {}
  const b2 = data.box_2_equation || {}
  const b4 = data.box_4_risk || {}

  return (
    <div>
      {kind === 'why' && (
        <>
          <Line label="Result" value={whySummary(data)} />
          <Line label="Fact" value={b1.fact} />
          <Line label="Logic" value={b1.logic} />
          <Line label="Reasoning" value={b1.reasoning} />
        </>
      )}
      {kind === 'risks' && (
        <>
          <Line label="Best case" value={b4.best} />
          <Line label="Worst case" value={b4.worst} />
          <Line label="Regret probability" value={b2.regret_probability} />
        </>
      )}
      {kind === 'middle' && (
        <>
          <Line label="Middle path" value={b4.middle} />
          <Line label="Next action" value={data.box_5_next_action} />
        </>
      )}
      <p className="mt-3 text-[11px] text-dim">Taken from the decision above. No new model call.</p>
    </div>
  )
}
