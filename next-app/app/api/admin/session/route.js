import { NextResponse } from 'next/server'
import { getSessionMessages } from '../../../../lib/chats.js'

function _isAuthorized(req){
  const ADMIN_KEY = process.env.ADMIN_KEY
  if(!ADMIN_KEY) return true
  const provided = req.headers.get('x-admin-key') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  return provided === ADMIN_KEY
}

export async function POST(req){
  try{
    if(!_isAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const body = await req.json()
    const session_id = body.session_id
    const page = parseInt(body.page) || 1
    const per_page = parseInt(body.per_page) || 100
    if(!session_id) return NextResponse.json({ error: 'missing session id' }, { status: 400 })
    const result = getSessionMessages(session_id, page, per_page)
    return NextResponse.json({ messages: result.messages, page, per_page, total: result.total })
  }catch(e){
    console.error('session messages error', e)
    return NextResponse.json({ error: 'session error' }, { status: 500 })
  }
}
