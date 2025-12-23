import { NextResponse } from 'next/server'
import { listSessions } from '../../../../lib/chats.js'

function _isAuthorized(req){
  const ADMIN_KEY = process.env.ADMIN_KEY
  if(!ADMIN_KEY) return true // dev mode
  const provided = req.headers.get('x-admin-key') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  return provided === ADMIN_KEY
}

export async function GET(req){
  try{
    if(!_isAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page')) || 1
    const per_page = parseInt(url.searchParams.get('per_page')) || 20
    const result = listSessions(page, per_page)
    return NextResponse.json({ sessions: result.sessions, page, per_page, total: result.total })
  }catch(e){
    console.error('sessions list error', e)
    return NextResponse.json({ error: 'sessions error' }, { status: 500 })
  }
}
