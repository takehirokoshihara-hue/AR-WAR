'use client'

import { useState, useEffect } from 'react'
import { supabase, type GameState } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function GameControl() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [game1Winner, setGame1Winner] = useState('')
  const [game1Odds, setGame1Odds] = useState('2')
  const [game3Effect, setGame3Effect] = useState<'double' | 'halve' | 'steal'>('double')
  const [game3Target, setGame3Target] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchGameState()

    const channel = supabase
      .channel('game-control-channel')
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

  const setPhase = async (phase: string, metadata = {}) => {
    setIsLoading(true)
    const response = await fetch('/api/game/set-phase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phase, metadata })
    })

    if (!response.ok) {
      alert('Failed to set phase')
    }
    setIsLoading(false)
  }

  const resolveGame1 = async () => {
    if (!game1Winner || !game1Odds) {
      alert('Please enter winner and odds')
      return
    }

    setIsLoading(true)
    const response = await fetch('/api/game/game1-resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner: game1Winner, odds: parseFloat(game1Odds) })
    })

    if (response.ok) {
      alert('Game 1 resolved!')
      setGame1Winner('')
      setGame1Odds('2')
    } else {
      alert('Failed to resolve game 1')
    }
    setIsLoading(false)
  }

  const resolveGame2 = async () => {
    setIsLoading(true)
    const response = await fetch('/api/game/game2-resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    const result = await response.json()

    if (response.ok) {
      alert(`Game 2 resolved! Result: ${result.result}`)
    } else {
      alert('Failed to resolve game 2')
    }
    setIsLoading(false)
  }

  const applyGame3Effect = async () => {
    setIsLoading(true)
    const response = await fetch('/api/game/game3-apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        effect: game3Effect,
        target_team_id: game3Effect === 'steal' ? game3Target : undefined
      })
    })

    const result = await response.json()

    if (response.ok) {
      alert(`Game 3 effect applied! ${result.message}`)
      await resetGame3Auction()
    } else {
      alert('Failed to apply effect: ' + result.error)
    }
    setIsLoading(false)
  }

  const resetGame3Auction = async () => {
    const response = await fetch('/api/game/game3-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.ok) {
      console.log('Auction reset successfully')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl neon-green">ゲーム進行管理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-zinc-400 mb-2">現在のフェーズ:</p>
            <Badge className="text-lg px-4 py-2 bg-yellow-600">
              {gameState?.phase || 'lobby'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              onClick={() => setPhase('lobby')}
              disabled={isLoading}
              variant="outline"
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            >
              ロビー
            </Button>
            <Button
              onClick={() => setPhase('game1')}
              disabled={isLoading}
              variant="outline"
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            >
              Game 1
            </Button>
            <Button
              onClick={() => setPhase('game2')}
              disabled={isLoading}
              variant="outline"
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            >
              Game 2
            </Button>
            <Button
              onClick={() => setPhase('game3')}
              disabled={isLoading}
              variant="outline"
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            >
              Game 3
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl neon-gold">Game 1: 結果確定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-zinc-400 text-sm">勝者 (ターゲット名)</label>
            <Input
              value={game1Winner}
              onChange={(e) => setGame1Winner(e.target.value)}
              placeholder="例: Executive A"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <div>
            <label className="text-zinc-400 text-sm">オッズ (倍率)</label>
            <Input
              type="number"
              step="0.1"
              value={game1Odds}
              onChange={(e) => setGame1Odds(e.target.value)}
              placeholder="例: 2.5"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <Button
            onClick={resolveGame1}
            disabled={isLoading}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            結果確定
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl neon-green">Game 2: 結果確定</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={resolveGame2}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            少数決で結果確定
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl text-red-400">Game 3: 効果適用</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-zinc-400 text-sm mb-2 block">効果を選択</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => setGame3Effect('double')}
                variant={game3Effect === 'double' ? 'default' : 'outline'}
                className={game3Effect === 'double' ? 'bg-blue-600' : 'bg-zinc-800 border-zinc-700'}
              >
                倍増
              </Button>
              <Button
                onClick={() => setGame3Effect('halve')}
                variant={game3Effect === 'halve' ? 'default' : 'outline'}
                className={game3Effect === 'halve' ? 'bg-orange-600' : 'bg-zinc-800 border-zinc-700'}
              >
                半減
              </Button>
              <Button
                onClick={() => setGame3Effect('steal')}
                variant={game3Effect === 'steal' ? 'default' : 'outline'}
                className={game3Effect === 'steal' ? 'bg-red-600' : 'bg-zinc-800 border-zinc-700'}
              >
                略奪
              </Button>
            </div>
          </div>

          {game3Effect === 'steal' && (
            <div>
              <label className="text-zinc-400 text-sm">略奪ターゲット (チームID)</label>
              <Input
                value={game3Target}
                onChange={(e) => setGame3Target(e.target.value)}
                placeholder="Team ID"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={applyGame3Effect}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              効果を適用
            </Button>
            <Button
              onClick={resetGame3Auction}
              disabled={isLoading}
              variant="outline"
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            >
              🔄 入札リセット
            </Button>
          </div>

          {gameState?.metadata?.highest_bidder && (
            <div className="mt-4 p-4 bg-zinc-800 rounded">
              <p className="text-zinc-400 text-sm">最高入札者</p>
              <p className="text-white font-mono">{gameState.metadata.highest_bidder}</p>
              <p className="text-zinc-400 text-sm mt-2">入札額</p>
              <p className="text-yellow-400 font-mono">{gameState.metadata.highest_bid} AR</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
