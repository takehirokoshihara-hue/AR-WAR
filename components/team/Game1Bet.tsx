'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Game1BetProps {
  teamId: string
  teamBalance: number
}

export function Game1Bet({ teamId, teamBalance }: Game1BetProps) {
  const [target, setTarget] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const placeBet = async () => {
    if (!target || !amount || parseInt(amount) <= 0) {
      alert('ターゲットと金額を入力してください')
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
        game: 'game1',
        target,
        amount: parseInt(amount)
      })
    })

    if (response.ok) {
      alert('ベット完了！')
      setTarget('')
      setAmount('')
    } else {
      const error = await response.json()
      alert('ベット失敗: ' + error.error)
    }
    setIsLoading(false)
  }

  return (
    <Card className="bg-zinc-900 border-yellow-500/50">
      <CardHeader>
        <CardTitle className="text-2xl neon-gold text-center">
          Game 1: エグゼクティブ・ダービー
        </CardTitle>
        <p className="text-center text-zinc-400">
          投資型ベットゲーム
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-zinc-400 text-sm mb-2 block">
            投資先（ターゲット名）
          </label>
          <Input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="例: Executive A"
            className="bg-zinc-800 border-zinc-700 text-white"
          />
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
          disabled={isLoading}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-lg py-6"
        >
          {isLoading ? 'ベット中...' : 'ベットする'}
        </Button>
        <p className="text-zinc-500 text-sm text-center">
          勝利時、オッズに応じた配当を獲得
        </p>
      </CardContent>
    </Card>
  )
}
