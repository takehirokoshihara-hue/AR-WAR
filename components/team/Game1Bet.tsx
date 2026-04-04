'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Game1BetProps {
  teamId: string
  teamBalance: number
  isTimerExpired?: boolean
}

const MIN_BET = 100000 // 最低ベット額: 10万AR

export function Game1Bet({ teamId, teamBalance, isTimerExpired = false }: Game1BetProps) {
  const [target, setTarget] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAmountChange = (value: string) => {
    setAmount(value)
    setError('')
  }

  const addAmount = (add: number) => {
    const current = parseInt(amount) || 0
    const newAmount = current + add
    setAmount(newAmount.toString())
    setError('')
  }

  const setAllIn = () => {
    setAmount(teamBalance.toString())
    setError('')
  }

  const placeBet = async () => {
    if (!target || !amount || parseInt(amount) <= 0) {
      setError('ターゲットと金額を入力してください')
      return
    }

    const betAmount = parseInt(amount)

    if (betAmount < MIN_BET) {
      setError(`最低${(MIN_BET / 10000).toFixed(0)}万ARからベット可能です`)
      return
    }

    if (betAmount > teamBalance) {
      setError('残高が不足しています')
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
        amount: betAmount
      })
    })

    if (response.ok) {
      alert('ベット完了！')
      setTarget('')
      setAmount('')
      setError('')
    } else {
      const errorData = await response.json()
      setError('ベット失敗: ' + errorData.error)
    }
    setIsLoading(false)
  }

  const canBet = teamBalance >= MIN_BET
  const isButtonDisabled = isLoading || !canBet || isTimerExpired

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
        {!canBet && (
          <Badge className="w-full justify-center bg-red-600 text-white text-base py-2">
            ⚠️ 資金不足です。借金をしてください（最低{(MIN_BET / 10000).toFixed(0)}万AR必要）
          </Badge>
        )}
        {isTimerExpired && (
          <Badge className="w-full justify-center bg-zinc-700 text-white text-base py-2">
            ⏱️ 時間切れ - ベット不可
          </Badge>
        )}

        <div>
          <label className="text-zinc-400 text-sm mb-2 block">
            投資先（ターゲット名）
          </label>
          <Input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="例: Executive A"
            className="bg-zinc-800 border-zinc-700 text-white"
            disabled={isButtonDisabled}
          />
        </div>

        <div>
          <label className="text-zinc-400 text-sm mb-2 flex items-center justify-between">
            <span>ベット金額 (AR)</span>
            <span className="text-yellow-500 text-xs">最低: {(MIN_BET / 10000).toFixed(0)}万AR</span>
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="100000"
            className="bg-zinc-800 border-zinc-700 text-white"
            disabled={isButtonDisabled}
            min={MIN_BET}
          />

          {/* クイックボタン */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Button
              type="button"
              onClick={() => addAmount(100000)}
              disabled={isButtonDisabled}
              className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm py-2"
            >
              +10万
            </Button>
            <Button
              type="button"
              onClick={() => addAmount(500000)}
              disabled={isButtonDisabled}
              className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm py-2"
            >
              +50万
            </Button>
            <Button
              type="button"
              onClick={setAllIn}
              disabled={isButtonDisabled}
              className="bg-red-700 hover:bg-red-600 text-white text-sm py-2 font-bold"
            >
              ALL IN
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center bg-red-950/50 py-2 rounded">
            {error}
          </p>
        )}

        <Button
          onClick={placeBet}
          disabled={isButtonDisabled}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-lg py-6 disabled:bg-zinc-700 disabled:text-zinc-500"
        >
          {isLoading ? 'ベット中...' : isTimerExpired ? '時間切れ' : !canBet ? '資金不足' : 'ベットする'}
        </Button>

        <p className="text-zinc-500 text-sm text-center">
          勝利時、オッズに応じた配当を獲得
        </p>
      </CardContent>
    </Card>
  )
}
