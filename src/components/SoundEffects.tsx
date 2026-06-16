'use client'

import { useEffect } from 'react'
import { playClickSound, playHoverSound, preloadSounds } from '@/lib/sounds'

// Boxes/cards across the app that have a visible hover effect. Hovering any of
// these (or a child of one) plays the half-volume click cue once per entry.
const HOVER_BOX_SELECTOR = [
  '.card',
  '.sc',
  '.goal-card',
  '.task-item',
  '.notif-item',
  '.cal-day',
  '.feat-c',
  '.bn-item',
  '.sb-item',
  '.sn-item',
  '.sr',
].join(',')

// Mounted once (globally, via Providers) so every page gets click + hover audio.
export default function SoundEffects() {
  useEffect(() => {
    // Decode all clips up front so the first click/hover fires instantly.
    preloadSounds()

    // Track the box currently under the pointer so moving across child elements
    // inside the same box doesn't retrigger the hover sound.
    let hoveredBox: Element | null = null

    function onClick() {
      playClickSound()
    }

    function onPointerOver(e: PointerEvent) {
      const target = e.target as Element | null
      if (!target || typeof target.closest !== 'function') return
      const box = target.closest(HOVER_BOX_SELECTOR)
      if (!box) {
        hoveredBox = null
        return
      }
      if (box !== hoveredBox) {
        hoveredBox = box
        playHoverSound()
      }
    }

    document.addEventListener('click', onClick)
    document.addEventListener('pointerover', onPointerOver)
    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('pointerover', onPointerOver)
    }
  }, [])

  return null
}
