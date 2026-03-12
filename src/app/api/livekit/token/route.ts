import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room');
  const username = req.nextUrl.searchParams.get('username');

  if (!room || !username) {
    return NextResponse.json({ error: 'Missing "room" or "username" query parameter' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'LiveKit API configurations are missing' }, { status: 500 });
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
      ttl: '1h',
    });
    
    at.addGrant({ roomJoin: true, room: room });

    return NextResponse.json({ token: await at.toJwt() });
  } catch (err) {
    console.error("Token generation failed", err);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
