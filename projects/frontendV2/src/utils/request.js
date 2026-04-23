const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000'

const cache = {}

export async function requestJson(path) {
  if (cache[path]) return cache[path]

  const parts = path.split('/')
  const last = parts.pop()
  const sanitized = last.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]/g, '_')
  parts.push(sanitized)

  const fullUrl = `${SERVER_URL}/${parts.join('/')}.json`
  const res = await fetch(encodeURI(fullUrl))
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${path}`)

  cache[path] = await res.json()
  return cache[path]
}
