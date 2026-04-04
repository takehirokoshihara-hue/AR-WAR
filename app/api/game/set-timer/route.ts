import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { seconds } = await request.json()

    if (!seconds || seconds <= 0) {
      return NextResponse.json(
        { error: 'Invalid timer duration' },
        { status: 400 }
      )
    }

    // 現在時刻から秒数を加算した終了時刻を計算
    const endsAt = new Date(Date.now() + seconds * 1000).toISOString()

    const { error } = await supabase
      .from('game_state')
      .update({ ends_at: endsAt })
      .eq('id', 1)

    if (error) {
      console.error('Timer update error:', error)
      return NextResponse.json(
        {
          error: error.message,
          details: error.details || 'No details available',
          hint: error.hint || 'Check if ends_at column exists in game_state table'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, ends_at: endsAt })
  } catch (error) {
    console.error('Set timer API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
