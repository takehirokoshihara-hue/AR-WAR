import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // リクエストボディのパース
    let seconds: number
    try {
      const body = await request.json()
      seconds = body.seconds
    } catch (parseError) {
      console.error('[Timer] Failed to parse request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    if (!seconds || seconds <= 0 || seconds > 3600) {
      return NextResponse.json(
        { error: 'Invalid timer duration (must be 1-3600 seconds)' },
        { status: 400 }
      )
    }

    console.log(`[Timer] Setting timer for ${seconds} seconds`)

    // 現在時刻から秒数を加算した終了時刻を計算
    const now = new Date()
    const endsAt = new Date(now.getTime() + seconds * 1000).toISOString()

    console.log('[Timer] Calculated end time:', {
      now: now.toISOString(),
      endsAt,
      seconds
    })

    // game_stateテーブルを更新
    const { data, error } = await supabase
      .from('game_state')
      .update({ ends_at: endsAt })
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      console.error('[Timer] Update error:', error)
      return NextResponse.json(
        {
          error: error.message,
          details: error.details || 'No details available',
          hint: error.hint || 'Check if ends_at column exists in game_state table. Run: ALTER TABLE game_state ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;',
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log('[Timer] Timer set successfully:', data)

    return NextResponse.json({
      success: true,
      ends_at: endsAt,
      seconds,
      current_time: now.toISOString()
    })
  } catch (error) {
    console.error('[Timer] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
