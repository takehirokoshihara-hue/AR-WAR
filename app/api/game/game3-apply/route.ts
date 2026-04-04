import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { effect, target_team_id } = await request.json()

    if (!effect || !['double', 'halve', 'steal'].includes(effect)) {
      return NextResponse.json(
        { error: 'Invalid effect' },
        { status: 400 }
      )
    }

    const { data: gameState, error: gameError } = await supabase
      .from('game_state')
      .select('*')
      .eq('id', 1)
      .single()

    if (gameError || !gameState) {
      return NextResponse.json(
        { error: 'Game state not found' },
        { status: 404 }
      )
    }

    const winnerTeamId = gameState.metadata?.highest_bidder
    const bidAmount = gameState.metadata?.highest_bid || 0

    if (!winnerTeamId) {
      return NextResponse.json(
        { error: 'No winner found' },
        { status: 400 }
      )
    }

    const { data: winner, error: winnerError } = await supabase
      .from('teams')
      .select('ar_balance')
      .eq('id', winnerTeamId)
      .single()

    if (winnerError || !winner) {
      return NextResponse.json(
        { error: 'Winner team not found' },
        { status: 404 }
      )
    }

    if (winner.ar_balance < bidAmount) {
      return NextResponse.json(
        { error: 'Winner has insufficient balance to pay bid' },
        { status: 400 }
      )
    }

    await supabase
      .from('teams')
      .update({ ar_balance: winner.ar_balance - bidAmount })
      .eq('id', winnerTeamId)

    if (effect === 'double') {
      const { data: updatedWinner } = await supabase
        .from('teams')
        .select('ar_balance')
        .eq('id', winnerTeamId)
        .single()

      if (updatedWinner) {
        await supabase
          .from('teams')
          .update({ ar_balance: updatedWinner.ar_balance * 2 })
          .eq('id', winnerTeamId)
      }

      return NextResponse.json({
        success: true,
        effect: 'double',
        message: 'AR doubled'
      })
    }

    if (effect === 'halve') {
      const { data: updatedWinner } = await supabase
        .from('teams')
        .select('ar_balance')
        .eq('id', winnerTeamId)
        .single()

      if (updatedWinner) {
        await supabase
          .from('teams')
          .update({ ar_balance: Math.floor(updatedWinner.ar_balance / 2) })
          .eq('id', winnerTeamId)
      }

      return NextResponse.json({
        success: true,
        effect: 'halve',
        message: 'AR halved'
      })
    }

    if (effect === 'steal') {
      if (!target_team_id) {
        return NextResponse.json(
          { error: 'Target team required for steal' },
          { status: 400 }
        )
      }

      const { data: targetTeam, error: targetError } = await supabase
        .from('teams')
        .select('ar_balance')
        .eq('id', target_team_id)
        .single()

      if (targetError || !targetTeam) {
        return NextResponse.json(
          { error: 'Target team not found' },
          { status: 404 }
        )
      }

      const stolenAmount = Math.floor(targetTeam.ar_balance / 2)

      await supabase
        .from('teams')
        .update({ ar_balance: targetTeam.ar_balance - stolenAmount })
        .eq('id', target_team_id)

      const { data: updatedWinner } = await supabase
        .from('teams')
        .select('ar_balance')
        .eq('id', winnerTeamId)
        .single()

      if (updatedWinner) {
        await supabase
          .from('teams')
          .update({ ar_balance: updatedWinner.ar_balance + stolenAmount })
          .eq('id', winnerTeamId)
      }

      return NextResponse.json({
        success: true,
        effect: 'steal',
        stolen_amount: stolenAmount,
        message: `Stolen ${stolenAmount} AR`
      })
    }

    return NextResponse.json(
      { error: 'Unknown effect' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
