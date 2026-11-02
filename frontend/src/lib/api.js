const BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

async function post(path, body, signal) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = typeof data.detail === 'string' ? data.detail : `Request failed (${res.status})`
    throw new Error(detail)
  }
  return data
}

async function request(path, init) {
  const res = await fetch(`${BASE}${path}`, init)
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `Request failed (${res.status})`)
  return data
}

/** -> { id, content, context_ids } */
export const generateDocument = (prompt, contextIds = [], signal) =>
  post('/generate', { prompt, context_ids: contextIds }, signal)

/**
 * payload: { document, selected_text, instruction, start, end, document_id, context_ids }
 * -> { replacement, start, end, document, context_ids }
 */
export const refineSelection = (payload, signal) => post('/refine', payload, signal)

/* ---------------- Context pinboard ---------------- */

/** files: File[] -> [{ id, filename, char_count }] */
export function uploadContextFiles(files) {
  const form = new FormData()
  for (const f of files) form.append('files', f)
  return request('/context/upload', { method: 'POST', body: form })
}

/** url -> { id, filename, char_count } (web page or YouTube transcript) */
export const addContextUrl = (url) => post('/context/url', { url })

export const listContextFiles = () => request('/context')

export const deleteContextFile = (id) => request(`/context/${id}`, { method: 'DELETE' })
