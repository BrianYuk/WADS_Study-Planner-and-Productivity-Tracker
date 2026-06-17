'use client'

// Centralized sound-effect helpers for the whole app.
// All clips live in /public/sounds. Playback uses the Web Audio API so effects
// fire with near-zero latency and can overlap freely (rapid clicks never cut
// each other off); an <audio> element is used as a fallback until a clip's
// buffer has been decoded.

const SRC = {
  click:   '/sounds/mouse-click.m4a',
  mission: '/sounds/Mission-complete.mp3',
  chime:   '/sounds/happy-chime.mp3',
  bell:    '/sounds/bell.m4a',
  alarm:   '/sounds/alarm_sound.m4a',
} as const

// ── Enabled flag ──────────────────────────────────────────────────
// Persisted alongside the rest of the app's settings (localStorage:studySettings).
// Lazily seeded from storage so sounds respect the user's choice even on pages
// that never mount the dashboard settings UI (landing, login, …).
let soundEnabled = true
let seeded = false

function ensureSeeded() {
  if (seeded || typeof window === 'undefined') return
  seeded = true
  try {
    const saved = localStorage.getItem('studySettings')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed.soundEffects === 'boolean') soundEnabled = parsed.soundEffects
    }
  } catch {}
}

export function setSoundEnabled(on: boolean) {
  seeded = true
  soundEnabled = on
}

export function isSoundEnabled() {
  ensureSeeded()
  return soundEnabled
}

// ── Web Audio engine ──────────────────────────────────────────────
let audioCtx: AudioContext | null = null
const buffers: Partial<Record<string, AudioBuffer>> = {}
const decoding: Partial<Record<string, boolean>> = {}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    try { audioCtx = new AC() } catch { return null }
  }
  // Browsers start the context suspended until a user gesture — resume on demand.
  if (audioCtx.state === 'suspended') void audioCtx.resume().catch(() => {})
  return audioCtx
}

function decode(src: string) {
  const ctx = getCtx()
  if (!ctx || buffers[src] || decoding[src]) return
  decoding[src] = true
  void (async () => {
    try {
      const res = await fetch(src)
      const arr = await res.arrayBuffer()
      buffers[src] = await ctx.decodeAudioData(arr)
    } catch {} finally {
      delete decoding[src]
    }
  })()
}

// Decode every clip up front so the very first interaction has no load latency.
export function preloadSounds() {
  Object.values(SRC).forEach(decode)
}

// Low-level: play one clip. Prefers the decoded Web Audio buffer (instant,
// overlapping); falls back to an <audio> element if it isn't decoded yet.
// onEnded is always invoked exactly once when the clip finishes (or fails).
function playClip(src: string, volume: number, rate: number, onEnded?: () => void) {
  if (typeof window === 'undefined' || !isSoundEnabled()) { onEnded?.(); return }
  const ctx = getCtx()
  const buf = buffers[src]
  if (ctx && buf) {
    try {
      const source = ctx.createBufferSource()
      source.buffer = buf
      source.playbackRate.value = rate
      const gain = ctx.createGain()
      gain.gain.value = Math.min(1, Math.max(0, volume))
      source.connect(gain).connect(ctx.destination)
      if (onEnded) source.onended = onEnded
      source.start()
      return
    } catch {}
  }
  // Not decoded yet (or Web Audio unavailable): warm the cache for next time and
  // fall back to a plain <audio> element this once.
  decode(src)
  try {
    const audio = new Audio(src)
    audio.volume = Math.min(1, Math.max(0, volume))
    audio.playbackRate = rate
    if (onEnded) audio.addEventListener('ended', onEnded, { once: true })
    void audio.play().catch(() => onEnded?.())
    return
  } catch {}
  onEnded?.()
}

// Every user click → full-volume mouse click, played at 2x speed.
export function playClickSound() {
  playClip(SRC.click, 1, 2)
}

// Hovering a box with a hover effect → same click clip, quiet (10%) and 3x speed.
export function playHoverSound() {
  playClip(SRC.click, 0.1, 3)
}

// A task is completed → happy chime.
export function playTaskCompleteSound() {
  playClip(SRC.chime, 1, 1)
}

// A mission is completed → Mission-complete.mp3.
// onFinished fires when the clip ends so the celebration GIF stays up for exactly
// that long.
let fanfareActive = false
let fanfareEndsAt = 0
export function playMissionCompleteSound(onFinished?: () => void) {
  if (typeof window === 'undefined') { onFinished?.(); return }
  // Sound off: still let the visual celebration run for a sensible default.
  if (!isSoundEnabled()) { if (onFinished) setTimeout(onFinished, 4000); return }

  const now = Date.now()
  if (fanfareActive && now < fanfareEndsAt) {
    // Already playing — don't stack; sync callback to the in-flight clip's end.
    if (onFinished) setTimeout(onFinished, fanfareEndsAt - now + 60)
    return
  }
  fanfareActive = true

  const dur = (buffers[SRC.mission]?.duration ?? 5) * 1000
  fanfareEndsAt = now + dur + 400

  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    fanfareActive = false
    onFinished?.()
  }
  setTimeout(finish, dur + 1500)

  playClip(SRC.mission, 1, 1, finish)
}

// A study session finishes and is successfully recorded → bell chime.
export function playBellSound() {
  playClip(SRC.bell, 1, 1)
}

// ── Alarm (timer ran out) ────────────────────────────────────────
// Loops until stopAlarmSound() is called (the user dismisses the popup).
let alarmSource: AudioBufferSourceNode | null = null
let alarmAudioEl: HTMLAudioElement | null = null

export function playAlarmSound() {
  if (typeof window === 'undefined' || !isSoundEnabled()) return
  stopAlarmSound()

  const ctx = getCtx()
  const buf = buffers[SRC.alarm]
  if (ctx && buf) {
    try {
      const source = ctx.createBufferSource()
      source.buffer = buf
      source.loop = true
      const gain = ctx.createGain()
      gain.gain.value = 1
      source.connect(gain).connect(ctx.destination)
      source.start()
      alarmSource = source
      return
    } catch {}
  }
  // Not decoded yet: warm the cache for next time and fall back to <audio> this once.
  decode(SRC.alarm)
  try {
    const audio = new Audio(SRC.alarm)
    audio.loop = true
    void audio.play().catch(() => {})
    alarmAudioEl = audio
  } catch {}
}

export function stopAlarmSound() {
  if (alarmSource) {
    try { alarmSource.stop() } catch {}
    alarmSource = null
  }
  if (alarmAudioEl) {
    try { alarmAudioEl.pause(); alarmAudioEl.currentTime = 0 } catch {}
    alarmAudioEl = null
  }
}
