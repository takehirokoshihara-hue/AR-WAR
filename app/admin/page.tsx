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
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [editingBalance, setEditingBalance] = useState<string>('')

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
    try {
      const response = await fetch('/api/team/loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`融資完了！\n新しい残高: ${result.new_balance.toLocaleString()} AR\n借金回数: ${result.debt_count}`)
      } else {
        let errorMessage = `HTTPステータス: ${response.status}`
        try {
          const error = await response.json()
          console.error('Loan error response:', error)
          errorMessage = error.error || error.message || errorMessage
          if (error.hint) errorMessage += `\n\nヒント: ${error.hint}`
          if (error.details) errorMessage += `\n詳細: ${error.details}`
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          const textError = await response.text()
          console.error('Error response text:', textError)
          errorMessage += `\n生のレスポンス: ${textError}`
        }
        alert(`融資エラー: ${errorMessage}\n\nDBマイグレーションが完了しているか「🔍 DB状態チェック」で確認してください。`)
      }
    } catch (error) {
      console.error('Loan request failed:', error)
      alert(`融資リクエスト失敗: ${error instanceof Error ? error.message : '不明なエラー'}\n\nネットワーク接続を確認してください。`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkDatabase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/debug/check-db')
      const data = await response.json()

      console.log('=== Database Check Results ===')
      console.log(JSON.stringify(data, null, 2))
      console.log('==============================')

      // 環境変数チェック
      let envWarning = ''
      if (data.environment?.supabase_url === 'Missing' || data.environment?.supabase_key === 'Missing') {
        envWarning = '⚠️ Supabase環境変数が設定されていません！\n.env.localファイルを確認してください。\n\n'
      }

      if (data.health?.ready_for_production) {
        alert(`✅ データベースは正常です！\n\n${envWarning}全ての機能が使用可能です。\n\n詳細はコンソール（F12）を確認してください。`)
      } else {
        const issues = data.recommendations?.map((r: any) =>
          r.issue ? `❌ ${r.issue}\n   SQL: ${r.action}` : `✅ ${r.message}`
        ).join('\n\n')

        const teamInfo = data.checks?.teams
        let teamDebug = ''
        if (teamInfo) {
          teamDebug = `\n\nTeamsテーブル情報:\n- アクセス可能: ${teamInfo.accessible ? 'はい' : 'いいえ'}\n- カラム数: ${teamInfo.sample_columns?.length || 0}\n- debt_count存在: ${teamInfo.has_debt_count ? 'はい' : 'いいえ'}`
          if (teamInfo.error) teamDebug += `\n- エラー: ${teamInfo.error}`
        }

        alert(`⚠️ データベースに問題があります\n\n${envWarning}${issues}${teamDebug}\n\n詳細はコンソール（F12）を確認してください。`)
      }
    } catch (error) {
      console.error('DB check error:', error)
      alert(`DBチェックに失敗しました。\n\nエラー: ${error instanceof Error ? error.message : '不明なエラー'}\n\nコンソール（F12）を確認してください。`)
    }
    setIsLoading(false)
  }

  const startEditingBalance = (teamId: string, currentBalance: number) => {
    setEditingTeamId(teamId)
    setEditingBalance(currentBalance.toString())
  }

  const cancelEditingBalance = () => {
    setEditingTeamId(null)
    setEditingBalance('')
  }

  const saveBalance = async (teamId: string, teamName: string) => {
    const newBalance = parseInt(editingBalance)

    if (isNaN(newBalance) || newBalance < 0) {
      alert('有効な数値を入力してください')
      return
    }

    if (!confirm(`${teamName}のAR残高を ${newBalance.toLocaleString()} AR に変更しますか？`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/team/update-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          new_balance: newBalance
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ 残高を更新しました！\n\n${teamName}: ${result.new_balance.toLocaleString()} AR`)
        setEditingTeamId(null)
        setEditingBalance('')
      } else {
        const error = await response.json()
        console.error('Balance update error:', error)
        alert(`❌ 残高更新失敗\n\n${error.error}`)
      }
    } catch (error) {
      console.error('Balance update request failed:', error)
      alert(`❌ リクエスト失敗: ${error instanceof Error ? error.message : '不明なエラー'}`)
    } finally {
      setIsLoading(false)
    }
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
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              + チーム追加
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                      <TableCell className="text-right">
                        {editingTeamId === team.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Input
                              type="number"
                              value={editingBalance}
                              onChange={(e) => setEditingBalance(e.target.value)}
                              className="w-32 bg-zinc-800 border-yellow-500 text-white text-right"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveBalance(team.id, team.name)
                                if (e.key === 'Escape') cancelEditingBalance()
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => saveBalance(team.id, team.name)}
                              className="bg-green-600 hover:bg-green-700 h-8 px-2"
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditingBalance}
                              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 h-8 px-2"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditingBalance(team.id, team.ar_balance)}
                            className="font-mono neon-gold hover:text-yellow-300 transition-colors cursor-pointer text-right w-full"
                          >
                            {formatAR(team.ar_balance)}
                            <span className="ml-2 text-zinc-600 text-xs">✎</span>
                          </button>
                        )}
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
