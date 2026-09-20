import { NextRequest, NextResponse } from 'next/server';
import { planJourneys } from '@/lib/routing-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const origin = searchParams.get('from') || searchParams.get('origin');
    const destination = searchParams.get('to') || searchParams.get('destination');
    const journeyDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const preferredDepartureTime = searchParams.get('departureTime') || undefined;
    const preferredArrivalTime = searchParams.get('arrivalTime') || undefined;
    const maxTransfersStr = searchParams.get('maxTransfers');
    const minBufferStr = searchParams.get('minBuffer') || searchParams.get('minimumTransferMinutes');
    const preference = (searchParams.get('preference') as any) || 'faster';
    const includeLive = searchParams.get('live') === 'true';

    if (!origin || !destination) {
      return NextResponse.json(
        { success: false, error: 'Both origin and destination are required.' },
        { status: 400 }
      );
    }

    const maxTransfers = maxTransfersStr !== null ? parseInt(maxTransfersStr, 10) : 1;
    const minimumTransferMinutes = minBufferStr ? parseInt(minBufferStr, 10) : 25;

    const result = await planJourneys({
      origin,
      destination,
      journeyDate,
      preferredDepartureTime,
      preferredArrivalTime,
      maxTransfers,
      minimumTransferMinutes,
      userPreferences: preference,
      includeLiveStatus: includeLive,
    });

    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        totalFound: result.allOptions.length,
        directCount: result.directOptions.length,
        multiLegCount: result.multiLegOptions.length,
        searchDate: journeyDate,
      },
    });
  } catch (error: any) {
    console.error('API /api/journeys/search error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to calculate journey options.' },
      { status: error.status || 500 }
    );
  }
}
