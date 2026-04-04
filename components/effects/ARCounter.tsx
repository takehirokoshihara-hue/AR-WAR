'use client'

import { useEffect, useState } from 'react'
import CountUp from 'react-countup'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'

interface ARCounterProps {
  value: number
  className?: string
  duration?: number
  enableEffects?: boolean
}

export function ARCounter({ value, className = '', duration = 1, enableEffects = true }: ARCounterProps) {
  const [previousValue, setPreviousValue] = useState(value)
  const [showWinEffect, setShowWinEffect] = useState(false)
  const [showLoseEffect, setShowLoseEffect] = useState(false)

  useEffect(() => {
    if (enableEffects && previousValue !== 0 && value !== previousValue) {
      const difference = value - previousValue

      if (difference > 0) {
        // WIN演出
        setShowWinEffect(true)

        // 紙吹雪
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })

        setTimeout(() => setShowWinEffect(false), 2000)
      } else if (difference < 0) {
        // LOSE演出
        setShowLoseEffect(true)
        setTimeout(() => setShowLoseEffect(false), 500)
      }
    }

    setPreviousValue(value)
  }, [value, previousValue, enableEffects])

  return (
    <div className="relative">
      <CountUp
        start={previousValue}
        end={value}
        duration={duration}
        separator=","
        decimals={0}
        className={className}
        preserveValue
      />

      <AnimatePresence>
        {showWinEffect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            transition={{ duration: 0.5 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
          >
            <div className="text-6xl md:text-8xl font-bold neon-gold text-center">
              JACKPOT!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showLoseEffect && (
        <div
          className="fixed inset-0 bg-red-600 opacity-30 pointer-events-none z-40 animate-pulse"
          style={{ animation: 'flash 0.2s ease-in-out 2' }}
        />
      )}
    </div>
  )
}
