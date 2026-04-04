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
}

export function Game3Bid({ teamId, teamBalance }: Game3BidProps) {
  const [bidAmount, setBidAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [gameState, setGameState] = useState<GameState | null>(null)

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
          />
        </div>

        <Button
          onClick={placeBid}
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-lg py-6"
        >
          {isLoading ? '入札中...' : '入札する'}
        </Button>

        <div className="bg-zinc-800 p-4 rounded text-sm text-zinc-400">
          <p className="mb-2">📌 落札後の効果（司会者が選択）:</p>
          <ul className="list-disc list-inside space-y-1">
            <li className="text-blue-400">倍増: AR残高が2倍になる</li>
            <li className="text-orange-400">半減: AR残高が半分になる</li>
            <li className="text-red-400">略奪: 他チームのARを半分奪う</li>
          </ul>
          <p className="mt-3 text-yellow-400">
            ⚠️ 入札額は落札時に支払われます
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
