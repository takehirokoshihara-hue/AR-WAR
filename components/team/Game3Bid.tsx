'use client'

import { useState, useEffect } from 'react'
import { supabase, type GameState } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Game3BidProps {
  teamId: string
  teamBalance: number
  isTimerExpired?: boolean
}

export function Game3Bid({ teamId, teamBalance, isTimerExpired = false }: Game3BidProps) {
  const [bidAmount, setBidAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [gameState, setGameState] = useState<GameState | null>(null)

  const addAmount = (add: number) => {
    const current = parseInt(bidAmount) || 0
    const newAmount = current + add
    setBidAmount(newAmount.toString())
  }

  const setAllIn = () => {
    setBidAmount(teamBalance.toString())
  }

  useEffect(() => {
    fetchGameState()

    const channel = supabase
      .channel('game3-bid-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_state'
      }, (payload) => {
        setGameState(payload.new as GameState)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchGameState = async () => {
    const { data } = await supabase
      .from('game_state')
      .select('*')
      .eq('id', 1)
      .single()

    if (data) setGameState(data)
  }

  const placeBid = async () => {
    if (!bidAmount || parseInt(bidAmount) <= 0) {
      alert('入札額を入力してください')
      return
    }

    const bid = parseInt(bidAmount)

    if (bid > teamBalance) {
      alert('残高が不足しています')
      return
    }

    const currentHighestBid = gameState?.metadata?.highest_bid || 0
    if (bid <= currentHighestBid) {
      alert(`${currentHighestBid} AR より高い金額を入札してください`)
      return
    }

    setIsLoading(true)
    const response = await fetch('/api/game/game3-bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        team_id: teamId,
        bid_amount: bid
      })
    })

    if (response.ok) {
      alert('入札完了！')
      setBidAmount('')
    } else {
      const error = await response.json()
      alert('入札失敗: ' + error.error)
    }
    setIsLoading(false)
  }

  const currentHighestBid = gameState?.metadata?.highest_bid || 0
  const isCurrentLeader = gameState?.metadata?.highest_bidder === teamId

  return (
    <Card className="bg-zinc-900 border-red-500/50">
      <CardHeader>
        <CardTitle className="text-2xl text-red-400 text-center">
          Game 3: ラスト・ギャンブル・オークション
        </CardTitle>
        <p className="text-center text-zinc-400">
          運命を賭けた直接対決
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTimerExpired && (
          <Badge className="w-full justify-center bg-zinc-700 text-white text-base py-2">
            ⏱️ 時間切れ - 入札不可
          </Badge>
        )}

        <div className="bg-zinc-800 p-4 rounded">
          <p className="text-zinc-400 text-sm mb-2">現在の最高入札額</p>
          <p className="text-4xl font-bold neon-gold font-mono">
            {currentHighestBid.toLocaleString()} AR
          </p>
          {isCurrentLeader && (
            <Badge className="mt-2 bg-green-600">
              あなたが現在トップです！
            </Badge>
          )}
        </div>

        <div>
          <label className="text-zinc-400 text-sm mb-2 block">
            入札額 (AR)
          </label>
          <Input
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder={`${currentHighestBid + 1} 以上`}
            className="bg-zinc-800 border-zinc-700 text-white"
            disabled={isTimerExpired}
          />

          {/* クイックボタン */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Button
              type="button"
              onClick={() => addAmount(100000)}
              disabled={isTimerExpired}
              className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm py-2"
            >
              +10万
            </Button>
            <Button
              type="button"
              onClick={() => addAmount(500000)}
              disabled={isTimerExpired}
              className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm py-2"
            >
              +50万
            </Button>
            <Button
              type="button"
              onClick={setAllIn}
              disabled={isTimerExpired}
              className="bg-red-700 hover:bg-red-600 text-white text-sm py-2 font-bold"
            >
              ALL IN
            </Button>
          </div>
        </div>

        <Button
          onClick={placeBid}
          disabled={isLoading || isTimerExpired}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6 disabled:bg-zinc-700 disabled:text-zinc-500"
        >
          {isLoading ? '入札中...' : isTimerExpired ? '時間切れ' : '入札する'}
        </Button>

        <div className="bg-zinc-800 p-4 rounded text-sm text-zinc-400">
          <p className="mb-2">📌 オークションルール:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>最高入札者が「封筒」を獲得します</li>
            <li>3回のオークションを実施します</li>
            <li>入札額は落札確定時に支払われます</li>
          </ul>
          <p className="mt-3 text-yellow-400">
            ⚠️ 封筒の中身（効果）は開封まで不明です
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
