'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, type Team, type GameState } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Game1Bet } from '@/components/team/Game1Bet'
import { Game2Bet } from '@/components/team/Game2Bet'
import { Game3Bid } from '@/components/team/Game3Bid'
import { ARCounter } from '@/components/effects/ARCounter'

export default function TeamPage() {
  const params = useParams()
  const teamId = params.team_id as string
  const [team, setTeam] = useState<Team | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTeamData()
    fetchGameState()

    const teamChannel = supabase
      .channel('team-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teams',
        filter: `id=eq.${teamId}`
      }, (payload) => {
        setTeam(payload.new as Team)
      })
      .subscribe()

    const gameChannel = supabase
      .channel('game-state-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_state'
      }, (payload) => {
        setGameState(payload.new as GameState)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(teamChannel)
      supabase.removeChannel(gameChannel)
    }
  }, [teamId])

  const fetchTeamData = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single()

    if (error) {
      console.error('Error fetching team:', error)
    } else {
      setTeam(data)
    }
    setIsLoading(false)
  }

  const fetchGameState = async () => {
    const { data, error } = await supabase
      .from('game_state')
      .select('*')
      .eq('id', 1)
      .single()

    if (error) {
      console.error('Error fetching game state:', error)
    } else {
      setGameState(data)
    }
  }

  const formatAR = (amount: number) => {
    return amount.toLocaleString() + ' AR'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-white text-2xl">読み込み中...</p>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="bg-zinc-900 border-red-500">
          <CardContent className="p-8">
            <p className="text-red-400 text-xl">チームが見つかりません</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <Badge className="mb-4 px-4 py-2 text-lg bg-zinc-800 text-zinc-400">
            {gameState?.phase === 'lobby' ? 'ロビー待機中' : `フェーズ: ${gameState?.phase}`}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold neon-gold mb-4">
            {team.name}
          </h1>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-zinc-400">
              AR残高
              {team.debt_count > 0 && (
                <Badge className="ml-2 bg-red-600 text-white">
                  💀 債務者 x{team.debt_count}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-6xl md:text-8xl font-bold text-center neon-gold font-mono">
              <ARCounter value={team.ar_balance} className="neon-gold" />
              <span className="ml-4">AR</span>
            </div>
            {team.debt_count > 0 && (
              <div className="mt-4 text-center">
                <p className="text-red-400 text-xl">
                  返済額: {(team.debt_count * 500000).toLocaleString()} AR
                </p>
                <p className="text-zinc-500 text-sm mt-1">
                  最終スコア: {(team.ar_balance - team.debt_count * 500000).toLocaleString()} AR
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {gameState?.phase === 'lobby' && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 text-center">
              <p className="text-xl text-zinc-400">
                ゲーム開始まで待機中...
              </p>
              <p className="text-zinc-500 mt-4">
                司会者がゲームを開始するまでお待ちください
              </p>
            </CardContent>
          </Card>
        )}

        {gameState?.phase === 'game1' && (
          <Game1Bet teamId={teamId} teamBalance={team.ar_balance} />
        )}

        {gameState?.phase === 'game2' && (
          <Game2Bet teamId={teamId} teamBalance={team.ar_balance} />
        )}

        {gameState?.phase === 'game3' && (
          <Game3Bid teamId={teamId} teamBalance={team.ar_balance} />
        )}
      </div>
    </div>
  )
}
