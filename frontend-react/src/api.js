const SPACE_CALL_URL = "https://bhargavsai2005-flrrc-v1-3.hf.space/gradio_api/call/decide"

// Optional: set VITE_LOCAL_API_URL=http://localhost:8000 in .env.local to use the local FastAPI
// (python3 -m uvicorn src.api:app --port 8000) instead of the Hugging Face Space.
const LOCAL_API_URL = import.meta.env.VITE_LOCAL_API_URL

function spaceErrorMessage(payload) {
  try {
    const err = JSON.parse(payload)
    const title = err.title ? `${err.title}. ` : ""
    return `${title}${err.error || "Space reported an error."}`
  } catch {
    return "Space reported an error. Try again."
  }
}

// Gradio call API: POST -> event_id, then GET the event stream for the result
async function callSpace(query, signal) {
  const start = await fetch(SPACE_CALL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [query] }),
    signal
  })
  if (!start.ok) throw new Error(`Space returned ${start.status}`)
  const { event_id } = await start.json()

  const stream = await fetch(`${SPACE_CALL_URL}/${event_id}`, { signal })
  if (!stream.ok) throw new Error(`Space returned ${stream.status}`)
  const body = await stream.text()

  let event = ""
  for (const line of body.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim()
    } else if (line.startsWith("data:")) {
      const payload = line.slice(5).trim()
      if (event === "complete") return JSON.parse(payload)[0]
      if (event === "error") throw new Error(spaceErrorMessage(payload))
    }
  }
  throw new Error("No result from Space")
}

async function callLocal(query, signal) {
  const res = await fetch(`${LOCAL_API_URL}/decide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: query }),
    signal
  })
  if (!res.ok) throw new Error(`Local API returned ${res.status}`)
  const data = await res.json()
  return data.flrrc_decision
}

export function callModel(query, signal) {
  return LOCAL_API_URL ? callLocal(query, signal) : callSpace(query, signal)
}
