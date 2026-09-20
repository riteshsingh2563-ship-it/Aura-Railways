import { NextRequest, NextResponse } from 'next/server';
import { getStationLiveBoard } from '@/lib/railradar';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Station code is required.' },
        { status: 400 }
      );
    }

    const liveBoard = await getStationLiveBoard(code);
    return NextResponse.json({
      success: true,
      data: liveBoard,
    });
  } catch (error: any) {
    console.error(`API /api/stations/${params?.code}/live error:`, error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch station live board.' },
      { status: error.status || 500 }
    );
  }
}
