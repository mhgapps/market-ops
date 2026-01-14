import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Placeholder - budget reports would require budget DAO implementation
    return NextResponse.json({
      budgets: [],
      message: 'Budget reports coming soon',
    });
  } catch (error) {
    console.error('Budget report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate budget report' },
      { status: 500 }
    );
  }
}
