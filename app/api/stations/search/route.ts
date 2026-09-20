import { NextRequest, NextResponse } from 'next/server';
import { searchStations } from '@/lib/railradar';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const stations = await searchStations(q);
    return NextResponse.json({
      success: true,
      data: stations,
      count: stations.length,
    });
  } catch (error: any) {
    console.error('API /api/stations/search error:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to search stations.',
      },
      { status: error.status || 500 }
    );
  }
}
