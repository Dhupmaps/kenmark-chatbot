import { NextResponse } from 'next/server'
import { getSessionMessages } from '../../../../../lib/chats.js'

function _isAuthorized(req){
  const ADMIN_KEY = process.env.ADMIN_KEY
  if(!ADMIN_KEY) return true
  const provided = req.headers.get('x-admin-key') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  return provided === ADMIN_KEY
}

export async function GET(req){
  try{
    if(!_isAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const url = new URL(req.url)
    const session_id = url.searchParams.get('session_id')
    if(!session_id) return NextResponse.json({ error: 'missing session id' }, { status: 400 })
    // export entire session (no pagination)
    const result = getSessionMessages(session_id, 1, 1000000)
    const payload = {
      session_id,
      exported_at: new Date().toISOString(),
      total: result.total || 0,
      messages: result.messages || []
    }
    const headers = { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="session_${session_id}.json"` }
    return NextResponse.json(payload, { status: 200, headers })
  }catch(e){
    console.error('export session error', e)
    return NextResponse.json({ error: 'export error' }, { status: 500 })
  }
}