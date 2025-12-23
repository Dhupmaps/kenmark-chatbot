import { NextResponse } from 'next/server';
import { loadKnowledge } from '../../../../lib/knowledge.js';

export async function GET() {
  try {
    const items = await loadKnowledge();
    return NextResponse.json({ count: items.length });
  } catch (e) {
    console.error('Knowledge status error', e);
    return NextResponse.json({ count: 0, error: 'Failed to load knowledge' }, { status: 200 });
  }
}