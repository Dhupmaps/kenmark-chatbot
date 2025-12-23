import { NextResponse } from 'next/server'
import { topUserMessages } from '../../../../lib/chats.js'

export async function GET(){
  try{
    const top = topUserMessages(10);
    return NextResponse.json({ top });
  }catch(e){
    console.error('analytics error', e);
    return NextResponse.json({ error: 'analytics error' }, { status: 500 });
  }
}
