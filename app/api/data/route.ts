import { NextResponse } from 'next/server';
import { generateInitialDataset } from '../../../lib/dataGenerator';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countParam = searchParams.get('count');
  const count = countParam ? parseInt(countParam, 10) : 10000;

  const validCount = Math.max(100, Math.min(100000, isNaN(count) ? 10000 : count));
  const data = generateInitialDataset(validCount);

  return NextResponse.json({
    success: true,
    count: data.length,
    timestamp: Date.now(),
    data,
  });
}
