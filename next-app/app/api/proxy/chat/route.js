import { NextResponse } from 'next/server'

export async function POST(req){
  try{
    const body = await req.json()
    // Proxy to existing FastAPI backend for now
    const r = await fetch(process.env.FASTAPI_URL || 'http://127.0.0.1:8000/chat', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body),
    })
    const data = await r.json()
    return NextResponse.json(data, {status: r.status})
  }catch(e){
    console.error('Proxy chat error', e)
    return NextResponse.json({error: 'proxy error'}, {status:500})
  }
}
