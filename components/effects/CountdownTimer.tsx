'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface CountdownTimerProps {
  endsAt: string | null
  onExpire?: () => void
}

export function CountdownTimer({ endsAt, onExpire }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!endsAt) {
      setTimeRemaining(null)
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const end = new Date(endsAt).getTime()
      const remaining = Math.max(0, Math.floor((end - now) / 1000))

      setTimeRemaining(remaining)

      if (remaining === 0 && onExpire) {
        onExpire()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endsAt, onExpire])

  if (timeRemaining === null || !endsAt) {
    return null
  }

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  const isUrgent = timeRemaining <= 10
  const isWarning = timeRemaining <= 30 && !isUrgent

  return (
    <Card
      className={`border-2 transition-all ${
        isUrgent
          ? 'bg-red-900/50 border-red-500 animate-pulse'
          : isWarning
          ? 'bg-yellow-900/50 border-yellow-500'
          : 'bg-zinc-900 border-green-500'
      }`}
    >
      <CardContent className="p-4 text-center">
        <p className="text-zinc-400 text-sm mb-1">残り時間</p>
        <div
          className={`text-5xl font-mono font-bold ${
            isUrgent
              ? 'text-red-400'
              : isWarning
              ? 'text-yellow-400'
              : 'neon-green'
          }`}
        >
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        {timeRemaining === 0 && (
          <p className="text-red-400 text-lg mt-2 font-bold">⏱️ 時間切れ！</p>
        )}
      </CardContent>
    </Card>
  )
}
