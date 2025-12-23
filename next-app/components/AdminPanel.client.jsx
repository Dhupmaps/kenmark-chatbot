'use client'
import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function AdminPanel(){
  const [top, setTop] = useState([])
  const [loading, setLoading] = useState(false)
  const [knowledgeCount, setKnowledgeCount] = useState(null)
  const [openQuestions, setOpenQuestions] = useState(true)
  const [openSessions, setOpenSessions] = useState(true)
  const [sessions, setSessions] = useState([])
  const [sessionsPage, setSessionsPage] = useState(1)
  const [sessionsPerPage] = useState(20)
  const [sessionsTotal, setSessionsTotal] = useState(0)
  const [selectedSession, setSelectedSession] = useState(null)
  const [sessionMessages, setSessionMessages] = useState([])
  const [messagesPage, setMessagesPage] = useState(1)
  const [messagesPerPage] = useState(100)
  const [messagesTotal, setMessagesTotal] = useState(0)
  const PUBLIC_ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || ''
  const [adminKey, setAdminKey] = useState(PUBLIC_ADMIN_KEY)

  useEffect(()=>{ fetchTop(); fetchSessions(sessionsPage) }, [sessionsPage])
  const refreshKnowledgeCount = async ()=>{
    try{ const r = await axios.get('/api/admin/knowledge'); setKnowledgeCount(r.data.count) }catch(e){ setKnowledgeCount(null) }
  }
  useEffect(()=>{ refreshKnowledgeCount() }, [])

  const fetchTop = async ()=>{
    setLoading(true)
    try{ const res = await axios.get('/api/analytics/top-questions'); setTop(res.data.top||[]) }catch(e){ console.error(e); setTop([])}finally{setLoading(false)}
  }

  const fetchSessions = async (page=1)=>{
    try{
      const res = await axios.get(`/api/admin/sessions?page=${page}&per_page=${sessionsPerPage}`, { headers: { 'x-admin-key': adminKey } })
      setSessions(res.data.sessions || [])
      setSessionsTotal(res.data.total || 0)
      setSessionsPage(res.data.page || page)
    }catch(e){ console.error('fetch sessions error', e); setSessions([]) }
  }

  const fetchSessionMessages = async (session_id, page=1)=>{
    try{
      const res = await axios.post('/api/admin/session', { session_id, page, per_page: messagesPerPage }, { headers: { 'x-admin-key': adminKey } })
      setSessionMessages(res.data.messages || [])
      setMessagesPage(res.data.page || page)
      setMessagesTotal(res.data.total || 0)
      setSelectedSession(session_id)
    }catch(e){ console.error('fetch session messages error', e); setSessionMessages([]) }
  }

  const exportSession = async (session_id)=>{
    if(!session_id) return
    try{
      const res = await axios.get(`/api/admin/session/export?session_id=${encodeURIComponent(session_id)}`, { headers: { 'x-admin-key': adminKey }, responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `session_${session_id}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    }catch(e){ console.error('export session error', e); alert('Export failed') }
  }

  // Upload removed — knowledge is embedded and fetched from website.

  const sessionsPagesCount = Math.max(1, Math.ceil(sessionsTotal / sessionsPerPage))
  const messagesPagesCount = Math.max(1, Math.ceil(messagesTotal / messagesPerPage))

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-xl min-w-[420px]">
      <h2 className="text-lg font-semibold mb-2">Admin</h2>
      {knowledgeCount!==null && (
        <div className="text-xs text-gray-500 mb-2">Knowledge loaded: {knowledgeCount} entries</div>
      )}

      <div className="mb-3">
        <label className="block text-sm text-gray-600 dark:text-gray-300">Admin Key</label>
        <input type="text" value={adminKey} onChange={(e)=>setAdminKey(e.target.value)} placeholder="Admin key (optional)" className="mt-1 p-1 border rounded w-full" />
      </div>

      {/* Upload section removed — knowledge is embedded and scraped from kenmarkitan.com */}

      <div className="mb-3">
        <button onClick={()=>setOpenQuestions(o=>!o)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm">
          <span className="font-medium">Top Questions</span>
          <span className="text-xs text-gray-500">{openQuestions ? 'Hide' : 'Show'}</span>
        </button>
        {openQuestions && (
          <div className="mt-2">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : (
              <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-200">
                {top.length ? top.map((q,i)=> (
                  <li key={i}>{q.message} <span className="text-xs text-gray-400">({q.count})</span></li>
                )) : <li className="text-gray-500">No data</li>}
              </ol>
            )}
          </div>
        )}
      </div>

      <div>
        <button onClick={()=>setOpenSessions(o=>!o)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm">
          <span className="font-medium">Sessions</span>
          <span className="text-xs text-gray-500">{openSessions ? 'Hide' : 'Show'}</span>
        </button>
        {openSessions && (
        <>
        <div className="text-xs text-gray-500 mb-2">{sessionsTotal} sessions • Page {sessionsPage} / {sessionsPagesCount}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex gap-2 mb-2">
              <button onClick={()=> setSessionsPage(p=> Math.max(1, p-1))} disabled={sessionsPage<=1} className={`px-2 py-1 rounded ${sessionsPage<=1? 'bg-gray-200 text-gray-400 cursor-not-allowed':'bg-gray-200 hover:bg-gray-300'}`}>Prev</button>
              <button onClick={()=> setSessionsPage(p=> Math.min(sessionsPagesCount, p+1))} disabled={sessionsPage>=sessionsPagesCount} className={`px-2 py-1 rounded ${sessionsPage>=sessionsPagesCount? 'bg-gray-200 text-gray-400 cursor-not-allowed':'bg-gray-200 hover:bg-gray-300'}`}>Next</button>
            </div>
            <ul className="text-sm text-gray-700 dark:text-gray-200">
              {sessions.length ? sessions.map(s=> (
                <li key={s.session_id} className="py-1 border-b flex justify-between items-center">
                  <div>
                    <button onClick={()=>fetchSessionMessages(s.session_id, 1)} className="text-left font-mono text-xs">{s.session_id}</button>
                    <div className="text-xs text-gray-400">{s.count} msgs</div>
                  </div>
                  <div className="text-xs text-gray-400">{new Date(s.last_ts).toLocaleString()}</div>
                </li>
              )) : <li className="text-gray-500">No sessions</li>}
            </ul>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Messages {selectedSession ? `(${selectedSession})` : ''}</h4>
              <div className="flex gap-2">
                <button onClick={()=> fetchSessionMessages(selectedSession, Math.max(1, messagesPage-1))} disabled={!selectedSession || messagesPage<=1} title={!selectedSession ? 'Select a session first' : ''} className={`px-2 py-1 rounded ${(!selectedSession || messagesPage<=1)? 'bg-gray-200 text-gray-400 cursor-not-allowed':'bg-gray-200 hover:bg-gray-300'}`}>Prev</button>
                <button onClick={()=> fetchSessionMessages(selectedSession, Math.min(messagesPagesCount, messagesPage+1))} disabled={!selectedSession || messagesPage>=messagesPagesCount} title={!selectedSession ? 'Select a session first' : ''} className={`px-2 py-1 rounded ${(!selectedSession || messagesPage>=messagesPagesCount)? 'bg-gray-200 text-gray-400 cursor-not-allowed':'bg-gray-200 hover:bg-gray-300'}`}>Next</button>
                {selectedSession && (
                  <button onClick={()=> exportSession(selectedSession)} className="px-2 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white">Export</button>
                )}
              </div>
            </div>

            <div className="h-64 overflow-auto p-2 bg-gray-50 dark:bg-gray-800 rounded mt-2">
              {sessionMessages.length ? sessionMessages.map(m=> (
                <div key={m.id} className="mb-2">
                  <div className="text-xs text-gray-500">{m.role} • {new Date(m.ts).toLocaleString()}</div>
                  <div className="text-sm">{m.message}</div>
                </div>
              )) : <div className="text-gray-500">Select a session to view messages</div>}
            </div>
            <div className="text-xs text-gray-500 mt-2">Page {messagesPage} / {messagesPagesCount} • {messagesTotal} messages</div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
