type Attempt = { count: number; resetAt: number }

const store = new Map<string, Attempt>()
const WINDOW_MS = 60_000
const MAX_ATTEMPTS = 5

let cleanupTimer: ReturnType<typeof setInterval> | null = null
function startCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, val] of store) {
      if (val.resetAt <= now) store.delete(key)
    }
  }, 60_000).unref()
}
startCleanup()

export function rateLimit(request: Request): { allowed: boolean; remaining: number } {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || '127.0.0.1'
  const now = Date.now()
  const key = `login:${ip}`

  const entry = store.get(key)
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count }
}
