const DB8_URL = process.env.DB8_AGENT_URL!
const DB8_KEY = process.env.DB8_SERVICE_KEY!

async function db8Fetch(path: string, options?: RequestInit) {
  const res = await fetch(`${DB8_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Service-Key': DB8_KEY,
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`db8-agent ${res.status} ${path}: ${err}`)
  }
  return res
}

async function db8Json(path: string, body: object) {
  const res = await db8Fetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function fetchTrending(niche: string, language = 'pt-BR', limit = 10) {
  return db8Json('/channel/fetch-trending', { niche, language, limit })
}

export async function generateScript(payload: {
  topic: string
  niche: string
  language: string
  source_content?: string
  target_minutes?: number
  financial_data?: object
}) {
  return db8Json('/channel/generate-script', payload)
}

export async function generateVoice(payload: {
  script: string
  voice_id: string
  niche: string
  language?: string
}) {
  return db8Json('/channel/generate-voice', payload)
}

export async function generateVideo(payload: {
  audio_url: string
  niche: string
  template_style?: string
  scene_descriptions?: string[]
}) {
  return db8Fetch('/channel/generate-video', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function generateThumbnail(payload: {
  thumbnail_prompt: string
  title: string
  niche: string
}) {
  return db8Json('/channel/generate-thumbnail', payload)
}

export async function generateShorts(payload: {
  video_url: string
  script: string
  max_shorts?: number
}) {
  return db8Json('/channel/generate-shorts', payload)
}
