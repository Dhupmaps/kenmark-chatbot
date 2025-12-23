import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'chats.db.json')
const JSONL_PATH = path.join(DATA_DIR, 'chats.jsonl')

export function ensureDataDir(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

let db = null
let USING_SQLITE = false

function atomicWriteFileSync(filePath, content){
  const tmp = filePath + '.tmp'
  fs.writeFileSync(tmp, content, 'utf8')
  fs.renameSync(tmp, filePath)
}

function makeFileBackedDB(){
  ensureDataDir()
  let state = { nextId: 1, chats: [] }
  try{
    if(fs.existsSync(DB_PATH)){
      const raw = fs.readFileSync(DB_PATH, 'utf8')
      state = JSON.parse(raw)
    } else if(fs.existsSync(JSONL_PATH)){
      // import legacy JSONL
      const content = fs.readFileSync(JSONL_PATH, 'utf8').trim()
      if(content){
        const lines = content.split('\n').filter(Boolean)
        for(const l of lines){ try{ const obj = JSON.parse(l); state.chats.push({ id: state.nextId++, session_id: obj.session_id || null, role: obj.role || null, message: obj.message || '', ts: obj.ts || Date.now() }) }catch(_){} }
        atomicWriteFileSync(DB_PATH, JSON.stringify(state, null, 2))
        fs.renameSync(JSONL_PATH, JSONL_PATH + '.imported')
      }
    }
  }catch(e){ console.error('Error initializing file-backed DB', e) }

  function save(){
    try{ atomicWriteFileSync(DB_PATH, JSON.stringify(state, null, 2)) }catch(e){ console.error('Failed to persist DB', e) }
  }

  return {
    prepare(sql){
      return {
        run: function(...args){
          if(/INSERT\s+INTO\s+chats/i.test(sql)){
            const [session_id, role, message, ts] = args
            const rec = { id: state.nextId++, session_id: session_id || null, role, message, ts: ts || Date.now() }
            state.chats.push(rec)
            save()
            return { lastInsertRowid: rec.id }
          }
          return {}
        },
        all: function(...args){
          // Implement the specific query patterns used by the app
          if(/SELECT\s+id, session_id, role, message, ts FROM chats\s+ORDER BY ts DESC LIMIT \?/i.test(sql)){
            const limit = args[0] || 100
            return state.chats.slice().sort((a,b)=> b.ts - a.ts).slice(0, limit)
          }
          if(/SELECT\s+message, COUNT\(\*\) AS cnt FROM chats WHERE role='user' GROUP BY message ORDER BY cnt DESC LIMIT \?/i.test(sql)){
            const limit = args[0] || 10
            const counts = {}
            for(const r of state.chats){ if(r.role === 'user'){ counts[r.message] = (counts[r.message]||0)+1 }}
            return Object.entries(counts).map(([message,cnt])=>({ message, cnt })).sort((a,b)=> b.cnt - a.cnt).slice(0, limit)
          }
          if(/SELECT\s+session_id, COUNT\(\*\) AS cnt, MAX\(ts\) AS last_ts FROM chats WHERE session_id IS NOT NULL GROUP BY session_id ORDER BY last_ts DESC LIMIT \? OFFSET \?/i.test(sql)){
            const limit = args[0] || 100
            const offset = args[1] || 0
            const map = {}
            for(const r of state.chats){ if(r.session_id){ if(!map[r.session_id]) map[r.session_id]={ session_id: r.session_id, count:0, last_ts:0 }; map[r.session_id].count++; map[r.session_id].last_ts = Math.max(map[r.session_id].last_ts, r.ts) }}
            const arr = Object.values(map).sort((a,b)=> b.last_ts - a.last_ts)
            return arr.slice(offset, offset+limit)
          }
          if(/SELECT\s+id, role, message, ts FROM chats WHERE session_id = \? ORDER BY ts ASC LIMIT \? OFFSET \?/i.test(sql)){
            const [sessionId, limit, offset] = args
            const rows = state.chats.filter(r=> r.session_id === sessionId).sort((a,b)=> a.ts - b.ts).slice(offset, offset+limit)
            return rows
          }
          return []
        },
        get: function(...args){
          if(/SELECT\s+COUNT\(DISTINCT session_id\) as total FROM chats WHERE session_id IS NOT NULL/i.test(sql)){
            const vals = new Set(state.chats.filter(r=> r.session_id).map(r=>r.session_id))
            return { total: vals.size }
          }
          if(/SELECT\s+COUNT\(\*\) as total FROM chats WHERE session_id = \?/i.test(sql)){
            const sessionId = args[0]
            return { total: state.chats.filter(r=> r.session_id === sessionId).length }
          }
          return null
        }
      }
    },
    exec: function(){ /* noop */ },
    close: function(){ /* noop */ }
  }
}

export function getDB(){
  if(db) return db
  ensureDataDir()
  try{
    // prefer real sqlite if available (load at runtime without static analysis)
    let Better = null
    try{ Better = eval("typeof require !== 'undefined' ? require('better-sqlite3') : null") }catch(e){ Better = null }
    if(Better){
      const firstTime = !fs.existsSync(path.join(DATA_DIR, 'chats.db'))
      db = new Better(path.join(DATA_DIR, 'chats.db'))
      USING_SQLITE = true
    } else {
      throw new Error('better-sqlite3 not present')
    }
    db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        role TEXT,
        message TEXT,
        ts INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_session ON chats(session_id);
    `)

    // If DB was just created and a legacy JSONL exists, import it
    if(firstTime && fs.existsSync(JSONL_PATH)){
      try{
        const content = fs.readFileSync(JSONL_PATH,'utf8').trim()
        if(content){
          const lines = content.split('\n').filter(Boolean)
          const insert = db.prepare('INSERT INTO chats (session_id, role, message, ts) VALUES (?, ?, ?, ?)')
          const insertMany = db.transaction((rows)=>{
            for(const l of rows){
              try{ const obj = JSON.parse(l); insert.run(obj.session_id || null, obj.role || null, obj.message || '', obj.ts || Date.now()) }catch(e){ /* skip */ }
            }
          })
          insertMany(lines)
          fs.renameSync(JSONL_PATH, JSONL_PATH + '.imported')
        }
      }catch(e){ console.error('Error importing legacy chats.jsonl', e) }
    }

    return db
  }catch(e){
    console.warn('better-sqlite3 not available — using file-backed JSON DB (persistent, no native build required).')
    db = makeFileBackedDB()
    return db
  }
}

export function closeDB(){ if(db && USING_SQLITE && db.close) { db.close(); db = null } else { db = null } }
