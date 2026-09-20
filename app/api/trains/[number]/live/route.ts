import { NextRequest, NextResponse } from 'next/server';
import { getLiveTrainStatus } from '@/lib/railradar';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { number: string } }
) {
  try {
    const { number } = params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;

    if (!number) {
      return NextResponse.json(
        { success: false, error: 'Train number is required.' },
        { status: 400 }
      );
    }

    const liveData = await getLiveTrainStatus(number, date);
    return NextResponse.json({
      success: true,
      data: liveData,
    });
  } catch (error: any) {
    console.error(`API /api/trains/${params?.number}/live error:`, error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch live train status.' },
      { status: error.status || 500 }
    );
  }
}
