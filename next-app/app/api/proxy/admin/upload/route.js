import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req){
  try{
    // Stream the request to FastAPI admin endpoint
    const url = (process.env.FASTAPI_URL || 'http://127.0.0.1:8000') + '/admin/upload'
    // Forward headers (including admin key if present in NEXT_PUBLIC_ADMIN_KEY)
    const headers = {}
    const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY
    if(adminKey) headers['x-admin-key'] = adminKey

    const res = await fetch(url, { method: 'POST', headers: headers, body: req.body })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  }catch(e){
    console.error('proxy upload error', e)
    return NextResponse.json({ error: 'upload proxy error' }, { status: 500 })
  }
}
