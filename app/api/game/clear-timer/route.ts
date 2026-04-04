import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('[Timer] Clearing timer (setting ends_at to null)')

    const { data, error } = await supabase
      .from('game_state')
      .update({ ends_at: null })
      .eq('id', 1)
      .select()
      .single()

    if (error) {
      console.error('[Timer] Clear error:', error)
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      )
    }

    console.log('[Timer] Timer cleared successfully:', data)

    return NextResponse.json({
      success: true,
      game_state: data
    })
  } catch (error) {
    console.error('[Timer] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
