import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.trainNumber) {
      return NextResponse.json(
        { success: false, error: 'Train number is required for journey alert.' },
        { status: 400 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Alert registered successfully.',
      data: body,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Invalid alert payload.' },
      { status: 400 }
    );
  }
}
