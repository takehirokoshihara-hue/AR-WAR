import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Game 3: オークション入札確定
 * 最高入札者のARから入札額を減額する（シンプル版）
 */
export async function POST() {
  try {
    console.log('[Game3-Confirm] Starting auction confirmation')

    // game_stateから最高入札情報を取得
    const { data: gameState, error: gameStateError } = await supabase
      .from('game_state')
      .select('*')
      .eq('id', 1)
      .single()

    if (gameStateError || !gameState) {
      console.error('[Game3-Confirm] Failed to fetch game state:', gameStateError)
      return NextResponse.json(
        { error: 'Failed to fetch game state' },
        { status: 500 }
      )
    }

    const highestBidder = gameState.metadata?.highest_bidder
    const highestBid = gameState.metadata?.highest_bid

    if (!highestBidder || !highestBid || highestBid <= 0) {
      return NextResponse.json(
        { error: 'No valid bid found' },
        { status: 400 }
      )
    }

    console.log('[Game3-Confirm] Highest bidder:', highestBidder, 'Bid:', highestBid)

    // 最高入札者のチーム情報を取得
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', highestBidder)
      .single()

    if (teamError || !team) {
      console.error('[Game3-Confirm] Failed to fetch team:', teamError)
      return NextResponse.json(
        { error: 'Failed to fetch team' },
        { status: 404 }
      )
    }

    console.log('[Game3-Confirm] Team state:', {
      name: team.name,
      current_balance: team.ar_balance,
      bid_amount: highestBid
    })

    // 残高チェック
    if (team.ar_balance < highestBid) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          message: `${team.name}の残高が不足しています (残高: ${team.ar_balance}, 入札: ${highestBid})`
        },
        { status: 400 }
      )
    }

    // 入札額を減額
    const newBalance = team.ar_balance - highestBid

    console.log('[Game3-Confirm] Deducting bid amount:', {
      old_balance: team.ar_balance,
      new_balance: newBalance,
      deducted: highestBid
    })

    const { error: updateError } = await supabase
      .from('teams')
      .update({ ar_balance: newBalance })
      .eq('id', highestBidder)

    if (updateError) {
      console.error('[Game3-Confirm] Failed to update team balance:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    console.log('[Game3-Confirm] Auction confirmed successfully')

    return NextResponse.json({
      success: true,
      winner_id: highestBidder,
      winner_name: team.name,
      bid_amount: highestBid,
      new_balance: newBalance,
      message: `${team.name}が${highestBid.toLocaleString()} ARで落札しました`
    })
  } catch (error) {
    console.error('[Game3-Confirm] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
