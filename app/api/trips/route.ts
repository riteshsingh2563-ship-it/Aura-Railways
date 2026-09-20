import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'User trips are synced directly to Firestore collection users/{uid}/savedTrips.',
    data: [],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.origin || !body.destination) {
      return NextResponse.json(
        { success: false, error: 'Origin and destination are required.' },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Trip validated successfully.',
      data: body,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Invalid trip payload.' },
      { status: 400 }
    );
  }
}
