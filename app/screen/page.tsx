'use client'

import { useEffect, useState } from 'react'
import { supabase, type Team, type GameState } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ARCounter } from '@/components/effects/ARCounter'
import { CountdownTimer } from '@/components/effects/CountdownTimer'
import { SoundPlayer } from '@/components/effects/SoundPlayer'

export default function ScreenPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [gameState, setGameState] = useState<GameState | null>(null)

  useEffect(() => {
    fetchTeams()
    fetchGameState()

    const teamsChannel = supabase
      .channel('screen-teams-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams()
      })
      .subscribe()

    const gameChannel = supabase
      .channel('screen-game-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_state' }, (payload) => {
        setGameState(payload.new as GameState)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(teamsChannel)
      supabase.removeChannel(gameChannel)
    }
  }, [])

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('ar_balance', { ascending: false })

    if (error) {
      console.error('Error fetching teams:', error)
    } else {
      setTeams(data || [])
    }
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
    return amount.toLocaleString()
  }

  const getRankColor = (index: number) => {
    if (index === 0) return 'neon-gold'
    if (index === 1) return 'text-zinc-300'
    if (index === 2) return 'text-amber-600'
    return 'text-zinc-400'
  }

  const getRankBadge = (index: number) => {
    if (index === 0) return '👑'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}位`
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <SoundPlayer
        soundEvent={gameState?.metadata?.sound_event || null}
        soundTriggerId={gameState?.metadata?.sound_trigger_id || null}
      />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-8xl font-bold neon-gold mb-4 tracking-wider">
            THE AR WARS
          </h1>
          <p className="text-3xl neon-green">
            リアルタイム・ランキング
          </p>
        </div>

        {gameState?.ends_at && (
          <div className="mb-8 max-w-md mx-auto">
            <CountdownTimer endsAt={gameState.ends_at} />
          </div>
        )}

        {teams.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-12 text-center">
              <p className="text-2xl text-zinc-500">
                参加チームがありません
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {teams.map((team, index) => (
              <Card
                key={team.id}
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
                        className={`text-3xl md:text-4xl px-6 py-4 ${
                          index === 0
                            ? 'bg-yellow-600 text-white'
                            : index === 1
                            ? 'bg-zinc-600 text-white'
                            : index === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {getRankBadge(index)}
                      </Badge>
                      <div>
                        <div className="flex items-center gap-3">
                          <h2
                            className={`text-3xl md:text-5xl font-bold ${getRankColor(
                              index
                            )}`}
                          >
                            {team.name}
                          </h2>
                          {team.debt_count > 0 && (
                            <Badge className="bg-red-600 text-white text-lg">
                              💀 x{team.debt_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-500 text-sm md:text-base mb-1">
                        AR残高
                      </p>
                      <div
                        className={`text-4xl md:text-6xl font-mono font-bold ${getRankColor(
                          index
                        )}`}
                      >
                        <ARCounter value={team.ar_balance} className={getRankColor(index)} enableEffects={false} />
                      </div>
                      <p className="text-zinc-500 text-lg md:text-xl">AR</p>
                      {team.debt_count > 0 && (
                        <p className="text-red-400 text-sm mt-2">
                          最終: {formatAR(team.ar_balance - team.debt_count * 500000)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Card className="bg-zinc-900 border-zinc-800 inline-block">
            <CardContent className="p-6">
              <p className="text-xl text-zinc-400">
                総AR:{' '}
                <span className="neon-gold font-mono font-bold">
                  {formatAR(teams.reduce((sum, team) => sum + team.ar_balance, 0))}
                </span>{' '}
                AR
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
