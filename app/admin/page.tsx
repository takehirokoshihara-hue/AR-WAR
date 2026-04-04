'use client'

import { useEffect, useState } from 'react'
import { supabase, type Team } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { GameControl } from '@/components/admin/GameControl'

export default function AdminPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [newTeamName, setNewTeamName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchTeams()

    const channel = supabase
      .channel('teams-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchTeams()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
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

  const addTeam = async () => {
    if (!newTeamName.trim()) return

    setIsLoading(true)
    const { error } = await supabase
      .from('teams')
      .insert([{ name: newTeamName }])

    if (error) {
      alert('チーム追加エラー: ' + error.message)
    } else {
      setNewTeamName('')
      setIsDialogOpen(false)
    }
    setIsLoading(false)
  }

  const deleteTeam = async (id: string) => {
    if (!confirm('本当にこのチームを削除しますか？')) return

    setIsLoading(true)
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)

    if (error) {
      alert('チーム削除エラー: ' + error.message)
    }
    setIsLoading(false)
  }

  const formatAR = (amount: number) => {
    return amount.toLocaleString() + ' AR'
  }

  const copyTeamUrl = (teamId: string, teamName: string) => {
    const url = `${window.location.origin}/team/${teamId}`
    navigator.clipboard.writeText(url)
    alert(`${teamName}のURLをコピーしました:\n${url}`)
  }

  const provideLoan = async (teamId: string, teamName: string) => {
    if (!confirm(`${teamName}に30万ARを融資しますか？（返済額：50万AR）`)) return

    setIsLoading(true)
    const response = await fetch('/api/team/loan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_id: teamId })
    })

    if (response.ok) {
      const result = await response.json()
      alert(`融資完了！\n新しい残高: ${result.new_balance.toLocaleString()} AR\n借金回数: ${result.debt_count}`)
    } else {
      const error = await response.json()
      console.error('Loan error:', error)
      alert(`融資エラー: ${error.error}\n\nヒント: ${error.hint || 'DBマイグレーションが必要な可能性があります'}\n\n詳細はコンソールを確認してください。`)
    }
    setIsLoading(false)
  }

  const checkDatabase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/debug/check-db')
      const data = await response.json()

      console.log('=== Database Check Results ===')
      console.log(data)
      console.log('==============================')

      if (data.health?.ready_for_production) {
        alert('✅ データベースは正常です！\n\n全ての機能が使用可能です。')
      } else {
        const issues = data.recommendations?.map((r: any) =>
          r.issue ? `❌ ${r.issue}\n   SQL: ${r.action}` : `✅ ${r.message}`
        ).join('\n\n')

        alert(`⚠️ データベースに問題があります\n\n${issues}\n\n詳細はコンソール（F12）を確認してください。`)
      }
    } catch (error) {
      console.error('DB check error:', error)
      alert('DBチェックに失敗しました。コンソールを確認してください。')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold neon-gold mb-2">THE AR WARS</h1>
            <p className="text-zinc-400 text-lg">管理画面 - Admin Control Panel</p>
          </div>
          <Button
            onClick={checkDatabase}
            disabled={isLoading}
            variant="outline"
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
          >
            🔍 DB状態チェック
          </Button>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl neon-green">チーム管理</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger>
                <Button className="bg-green-600 hover:bg-green-700">
                  + チーム追加
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-700">
                <DialogHeader>
                  <DialogTitle className="text-xl neon-green">新規チーム追加</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="チーム名を入力"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTeam()}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  <Button
                    onClick={addTeam}
                    disabled={isLoading || !newTeamName.trim()}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? '追加中...' : '追加'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                チームが登録されていません
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableHead className="text-zinc-400">順位</TableHead>
                    <TableHead className="text-zinc-400">チーム名</TableHead>
                    <TableHead className="text-zinc-400 text-right">AR残高</TableHead>
                    <TableHead className="text-zinc-400 text-center">借金</TableHead>
                    <TableHead className="text-zinc-400">登録日時</TableHead>
                    <TableHead className="text-zinc-400 text-center">チームURL</TableHead>
                    <TableHead className="text-zinc-400 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team, index) => (
                    <TableRow key={team.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell>
                        <Badge variant={index === 0 ? 'default' : 'outline'} className={index === 0 ? 'neon-border-gold' : ''}>
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-2">
                          {team.name}
                          {team.debt_count > 0 && (
                            <Badge className="bg-red-600 text-white">
                              💀 債務者 x{team.debt_count}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono neon-gold">
                        {formatAR(team.ar_balance)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-zinc-400 text-sm">{team.debt_count} 回</span>
                          {team.debt_count > 0 && (
                            <span className="text-red-400 text-xs">
                              返済: {formatAR(team.debt_count * 500000)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {new Date(team.created_at).toLocaleString('ja-JP')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyTeamUrl(team.id, team.name)}
                          className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                        >
                          URLコピー
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => provideLoan(team.id, team.name)}
                            disabled={isLoading}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500"
                          >
                            💸 30万AR融資
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteTeam(team.id)}
                            disabled={isLoading}
                          >
                            削除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-400">参加チーム数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold neon-green">{teams.length}</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-400">総AR</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold neon-gold">
                {formatAR(teams.reduce((sum, team) => sum + team.ar_balance, 0))}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-400">ゲームフェーズ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">Lobby</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <GameControl />
        </div>
      </div>
    </div>
  )
}
