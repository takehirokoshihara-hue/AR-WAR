import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-7xl font-bold neon-gold mb-4 tracking-wider">
            THE AR WARS
          </h1>
          <p className="text-2xl text-zinc-400 mb-2">
            リアルタイム対戦ギャンブルゲーム
          </p>
          <p className="text-lg neon-green">
            3つのゲームで架空通貨「AR」を奪い合え
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-zinc-900 border-zinc-800 hover:border-yellow-500/50 transition-all">
            <CardHeader>
              <CardTitle className="text-xl neon-gold text-center">
                ゲーム 1
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-white font-semibold mb-2">
                エグゼクティブ・ダービー
              </p>
              <p className="text-zinc-400 text-sm">
                投資型ベットゲーム
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 hover:border-green-500/50 transition-all">
            <CardHeader>
              <CardTitle className="text-xl neon-green text-center">
                ゲーム 2
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-white font-semibold mb-2">
                裏切りのマイノリティ
              </p>
              <p className="text-zinc-400 text-sm">
                少数決サバイバル
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 hover:border-red-500/50 transition-all">
            <CardHeader>
              <CardTitle className="text-xl text-red-400 text-center">
                ゲーム 3
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-white font-semibold mb-2">
                ラスト・オークション
              </p>
              <p className="text-zinc-400 text-sm">
                運命を賭けた直接対決
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/admin">
            <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg">
              管理画面
            </Button>
          </Link>
          <Link href="/screen">
            <Button className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-6 text-lg border border-zinc-700">
              メインスクリーン
            </Button>
          </Link>
          <Link href="/results">
            <Button className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-6 text-lg">
              🏆 最終結果
            </Button>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-zinc-600 text-sm">
            チーム専用画面のURLは管理画面から各チームに配布してください
          </p>
        </div>
      </div>
    </div>
  )
}
