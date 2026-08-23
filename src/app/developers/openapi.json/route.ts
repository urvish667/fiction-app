import { NextResponse } from 'next/server';
import openApiSpec from '../../../../public/openapi.json';

export const dynamic = 'force-static';
export const revalidate = 86400;

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Vary': 'Accept, Accept-Encoding',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
