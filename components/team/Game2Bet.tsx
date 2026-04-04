'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Game2BetProps {
  teamId: string
  teamBalance: number
}

export function Game2Bet({ teamId, teamBalance }: Game2BetProps) {
  const [choice, setChoice] = useState<'A' | 'B' | null>(null)
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const placeBet = async () => {
    if (!choice || !amount || parseInt(amount) <= 0) {
      alert('選択肢と金額を選んでください')
      return
    }

    if (parseInt(amount) > teamBalance) {
      alert('残高が不足しています')
      return
    }

    setIsLoading(true)
    const response = await fetch('/api/game/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: teamId,
        game: 'game2',
        target: choice,
        amount: parseInt(amount)
      })
    })

    if (response.ok) {
      alert(`選択肢 ${choice} にベット完了！`)
      setChoice(null)
      setAmount('')
    } else {
      const error = await response.json()
      alert('ベット失敗: ' + error.error)
    }
    setIsLoading(false)
  }

  return (
    <Card className="bg-zinc-900 border-green-500/50">
      <CardHeader>
        <CardTitle className="text-2xl neon-green text-center">
          Game 2: 裏切りのマイノリティ・ベット
        </CardTitle>
        <p className="text-center text-zinc-400">
          少数決サバイバル
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-zinc-400 text-sm mb-2 block">
            選択肢を選ぶ
          </label>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => setChoice('A')}
              variant={choice === 'A' ? 'default' : 'outline'}
              className={choice === 'A' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'}
              size="lg"
            >
              選択肢 A
            </Button>
            <Button
              onClick={() => setChoice('B')}
              variant={choice === 'B' ? 'default' : 'outline'}
              className={choice === 'B' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'}
              size="lg"
            >
              選択肢 B
            </Button>
          </div>
        </div>
        <div>
          <label className="text-zinc-400 text-sm mb-2 block">
            ベット金額 (AR)
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100000"
            className="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
        <Button
          onClick={placeBet}
          disabled={isLoading || !choice}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
        >
          {isLoading ? 'ベット中...' : 'ベットする'}
        </Button>
        <div className="bg-zinc-800 p-4 rounded text-sm text-zinc-400">
          <p className="mb-2">📌 ルール:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>選んだチームが少ない方（少数派）が勝利</li>
            <li>同数の場合は全額返金</li>
            <li>勝者は全ベット額を山分け</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
