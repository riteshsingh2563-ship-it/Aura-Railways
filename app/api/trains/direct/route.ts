import { NextRequest, NextResponse } from 'next/server';
import { getTrainsBetweenStations } from '@/lib/railradar';
import { getWeekday } from '@/lib/routing-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!from || !to) {
      return NextResponse.json(
        { success: false, error: 'Both "from" and "to" station codes are required.' },
        { status: 400 }
      );
    }

    if (from.toUpperCase() === to.toUpperCase()) {
      return NextResponse.json(
        { success: false, error: 'Origin and destination stations cannot be the same.' },
        { status: 400 }
      );
    }

    const data = await getTrainsBetweenStations(from, to);
    const weekday = getWeekday(date);

    // Annotate running day match
    const trains = (data.trains || []).map((item) => {
      const runDays = item.train?.runDays || [];
      const runsOnDate = runDays.length === 0 || runDays.includes(weekday);
      return {
        ...item,
        runsOnSelectedDate: runsOnDate,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        from: data.from,
        to: data.to,
        date,
        weekday,
        totalTrains: trains.length,
        runningOnDateCount: trains.filter((t) => t.runsOnSelectedDate).length,
        trains,
      },
    });
  } catch (error: any) {
    console.error('API /api/trains/direct error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch direct trains.' },
      { status: error.status || 500 }
    );
  }
}
