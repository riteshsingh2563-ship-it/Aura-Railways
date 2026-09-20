import { NextRequest, NextResponse } from 'next/server';
import { getTrainSchedule } from '@/lib/railradar';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { number: string } }
) {
  try {
    const { number } = params;
    if (!number) {
      return NextResponse.json(
        { success: false, error: 'Train number is required.' },
        { status: 400 }
      );
    }

    const data = await getTrainSchedule(number);
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error(`API /api/trains/${params?.number} error:`, error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch train timetable.' },
      { status: error.status || 500 }
    );
  }
}
