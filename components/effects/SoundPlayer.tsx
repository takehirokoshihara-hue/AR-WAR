'use client'

import { useEffect, useRef, useState } from 'react'

interface SoundPlayerProps {
  soundEvent: string | null
  soundTriggerId: number | null
}

export function SoundPlayer({ soundEvent, soundTriggerId }: SoundPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [lastTriggerId, setLastTriggerId] = useState<number | null>(null)

  useEffect(() => {
    // 同じトリガーIDの場合は再生しない（重複防止）
    if (!soundEvent || !soundTriggerId || soundTriggerId === lastTriggerId) {
      return
    }

    // サウンドファイルのパスマッピング
    const soundMap: Record<string, string> = {
      drumroll: '/sounds/drumroll.mp3',
      fanfare: '/sounds/fanfare.mp3',
      gavel: '/sounds/gavel.mp3',
      sad: '/sounds/sad.mp3'
    }

    const soundPath = soundMap[soundEvent]
    if (!soundPath) {
      console.warn(`Unknown sound event: ${soundEvent}`)
      return
    }

    // 音声を再生
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    const audio = new Audio(soundPath)
    audioRef.current = audio

    audio.play().catch(err => {
      console.error('Failed to play sound:', err)
    })

    setLastTriggerId(soundTriggerId)
  }, [soundEvent, soundTriggerId, lastTriggerId])

  return null // UIは表示しない
}
