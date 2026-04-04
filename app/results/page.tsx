'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

interface TeamScore {
  id: string
  name: string
  ar_balance: number
  debt_count: number
  final_score: number
  created_at: string
}

export default function ResultsPage() {
  const [scores, setScores] = useState<TeamScore[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFinalScores()
  }, [])

  const fetchFinalScores = async () => {
    const response = await fetch('/api/game/final-scores')
    const data = await response.json()
    setScores(data.scores || [])
    setIsLoading(false)

    if (data.scores && data.scores.length > 0) {
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 }
        })
      }, 500)
    }
  }

  const formatAR = (amount: number) => {
    return amount.toLocaleString()
  }

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🏆'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}位`
  }

  const getRankColor = (index: number) => {
    if (index === 0) return 'neon-gold'
    if (index === 1) return 'text-zinc-300'
    if (index === 2) return 'text-amber-600'
    return 'text-zinc-400'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-white text-2xl">集計中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-8xl font-bold neon-gold mb-4 tracking-wider">
            THE AR WARS
          </h1>
          <p className="text-4xl neon-green mb-2">
            最終結果発表
          </p>
          <p className="text-zinc-500 text-lg">
            最終スコア = AR残高 - (借金回数 × 50万AR)
          </p>
        </motion.div>

        {scores.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center">
              <p className="text-2xl text-zinc-500">
                参加チームがありません
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {scores.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={`bg-zinc-900 border-2 transition-all duration-300 ${
                    index === 0
                      ? 'border-yellow-500 neon-border-gold scale-105'
                      : 'border-zinc-800'
                  }`}
                >
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <Badge
                          className={`text-4xl md:text-5xl px-8 py-6 ${
                            index === 0
                              ? 'bg-yellow-600 text-white'
                              : index === 1
                              ? 'bg-zinc-600 text-white'
                              : index === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {getRankEmoji(index)}
                        </Badge>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h2
                              className={`text-4xl md:text-6xl font-bold ${getRankColor(
                                index
                              )}`}
                            >
                              {team.name}
                            </h2>
                            {team.debt_count > 0 && (
                              <Badge className="bg-red-600 text-white text-xl">
                                💀 債務者 x{team.debt_count}
                              </Badge>
                            )}
                          </div>
                          <div className="text-zinc-400 text-lg space-y-1">
                            <p>AR残高: {formatAR(team.ar_balance)} AR</p>
                            {team.debt_count > 0 && (
                              <p className="text-red-400">
                                返済額: -{formatAR(team.debt_count * 500000)} AR
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-zinc-500 text-base mb-1">
                          最終スコア
                        </p>
                        <p
                          className={`text-5xl md:text-7xl font-mono font-bold ${
                            team.final_score >= 0 ? getRankColor(index) : 'text-red-500'
                          }`}
                        >
                          {formatAR(team.final_score)}
                        </p>
                        <p className="text-zinc-500 text-2xl">AR</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {scores.length > 0 && scores[0] && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: scores.length * 0.1 + 0.5 }}
            className="mt-12 text-center"
          >
            <Card className="bg-gradient-to-r from-yellow-600 to-yellow-400 border-yellow-500">
              <CardContent className="p-8">
                <p className="text-4xl font-bold text-white mb-2">
                  🏆 優勝: {scores[0].name} 🏆
                </p>
                <p className="text-2xl text-yellow-100">
                  最終スコア: {formatAR(scores[0].final_score)} AR
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
