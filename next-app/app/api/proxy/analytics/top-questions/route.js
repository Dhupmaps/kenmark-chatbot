import { NextResponse } from 'next/server'

export async function GET(){
  try{
    const url = (process.env.FASTAPI_URL || 'http://127.0.0.1:8000') + '/analytics/top-questions'
    const r = await fetch(url)
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  }catch(e){
    console.error('proxy analytics error', e)
    return NextResponse.json({ error: 'proxy analytics error' }, { status: 500 })
  }
}
