import { NextResponse } from 'next/server';

export async function GET() {
  const tmdbKey = process.env.TMDB_API_KEY;
  const isSet = !!tmdbKey && tmdbKey.length > 5;

  return NextResponse.json({
    status: isSet ? "OK" : "MISSING",
    tmdb_key_exists: !!tmdbKey,
    key_preview: tmdbKey ? `${tmdbKey.substring(0, 4)}... (length: ${tmdbKey.length})` : null,
    runtime_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
