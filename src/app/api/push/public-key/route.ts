
import { NextResponse } from 'next/server';

export async function GET() {
  // Hardcoded fallback for immediate availability, environment variable preferred
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BJFlZ3Y1r7eeYxEX-A3XVhQMA5sUseRaxHOz_rQRqXNe4jcier3BkE29IBbYRnB4OV792buEaPsIba-MtllwDas';
  
  return NextResponse.json({ publicKey });
}
