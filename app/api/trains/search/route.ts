import { NextRequest, NextResponse } from 'next/server';
import { searchTrains } from '@/lib/railradar';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const trains = await searchTrains(q);
    return NextResponse.json({
      success: true,
      data: trains,
      count: trains.length,
    });
  } catch (error: any) {
    console.error('API /api/trains/search error:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to search trains.',
      },
      { status: error.status || 500 }
    );
  }
}
