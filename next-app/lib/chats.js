import { getDB } from './db.js'

export function logChat(sessionId, role, message){
  try{
    const db = getDB()
    const stmt = db.prepare('INSERT INTO chats (session_id, role, message, ts) VALUES (?, ?, ?, ?)')
    stmt.run(sessionId || null, role, message, Date.now())
  }catch(e){ console.error('DB logChat error', e) }
}

export function readChats(limit=100){
  try{
    const db = getDB()
    const rows = db.prepare('SELECT id, session_id, role, message, ts FROM chats ORDER BY ts DESC LIMIT ?').all(limit)
    return rows
  }catch(e){ console.error('DB readChats error', e); return [] }
}

export function topUserMessages(limit=10){
  try{
    const db = getDB()
    const rows = db.prepare("SELECT message, COUNT(*) AS cnt FROM chats WHERE role='user' GROUP BY message ORDER BY cnt DESC LIMIT ?").all(limit)
    return rows.map(r=>({ message: r.message, count: r.cnt }))
  }catch(e){ console.error('DB topUserMessages error', e); return [] }
}

export function listSessions(page=1, perPage=100){
  try{
    const db = getDB()
    const pageNum = Math.max(1, parseInt(page||1))
    const limit = Math.max(1, parseInt(perPage||100))
    const offset = (pageNum - 1) * limit
    const rows = db.prepare('SELECT session_id, COUNT(*) AS cnt, MAX(ts) AS last_ts FROM chats WHERE session_id IS NOT NULL GROUP BY session_id ORDER BY last_ts DESC LIMIT ? OFFSET ?').all(limit, offset)
    const totalRow = db.prepare('SELECT COUNT(DISTINCT session_id) as total FROM chats WHERE session_id IS NOT NULL').get()
    const sessions = rows.map(r=>({ session_id: r.session_id, count: r.cnt, last_ts: r.last_ts }))
    return { sessions, total: totalRow ? totalRow.total : 0 }
  }catch(e){ console.error('DB listSessions error', e); return { sessions: [], total: 0 } }
}

export function getSessionMessages(sessionId, page=1, perPage=100){
  try{
    const db = getDB()
    const pageNum = Math.max(1, parseInt(page||1))
    const limit = Math.max(1, parseInt(perPage||100))
    const offset = (pageNum - 1) * limit
    const rows = db.prepare('SELECT id, role, message, ts FROM chats WHERE session_id = ? ORDER BY ts ASC LIMIT ? OFFSET ?').all(sessionId, limit, offset)
    const totalRow = db.prepare('SELECT COUNT(*) as total FROM chats WHERE session_id = ?').get(sessionId)
    return { messages: rows, total: totalRow ? totalRow.total : 0 }
  }catch(e){ console.error('DB getSessionMessages error', e); return { messages: [], total: 0 } }
}
