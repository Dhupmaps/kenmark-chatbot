'use client'
import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import axios from 'axios'

export default function ChatWidget(){
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([{role:'bot', text:'Hello! I am the Kenmark AI. How can I help you today?'}])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const sessionId = useRef(null)
  const endRef = useRef(null)

  // Hydrate from sessionStorage only on the client
  useEffect(()=>{
    try{
      let id = null
      try{ id = sessionStorage.getItem('kenmark_session_id') }catch(e){}
      if(!id){ id = 's_' + Math.random().toString(36).slice(2, 10); try{ sessionStorage.setItem('kenmark_session_id', id) }catch(e){} }
      sessionId.current = id
      try{ const m = sessionStorage.getItem('kenmark_messages'); if(m) setMessages(JSON.parse(m)) }catch(e){}
    }catch(e){ /* ignore on server */ }
  }, [])

  useEffect(()=>{ try{ sessionStorage.setItem('kenmark_messages', JSON.stringify(messages)); }catch(e){}; endRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages])

  const sendMessage = async () => {
    if(!input.trim()) return
    const text = input.trim()
    setMessages(prev=>[...prev, {role:'user', text}]);
    setInput(''); setIsLoading(true)
    try{
      const res = await axios.post('/api/chat', {message:text, session_id: sessionId.current})
      const bot = res.data?.response || "Sorry, something went wrong."
      setMessages(prev=>[...prev, {role:'bot', text:bot}])
    }catch(e){
      console.error(e)
      setMessages(prev=>[...prev, {role:'bot', text:'Sorry, I am having trouble connecting to the server.'}])
    }finally{ setIsLoading(false) }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button onClick={()=>setIsOpen(true)} aria-label="Open chat" className="bg-gray-800 text-white p-3 rounded-full shadow-lg">
          <MessageCircle className="text-purple-400" />
        </button>
      )}

      {isOpen && (
        <div className="w-[440px] bg-white/95 backdrop-blur dark:bg-gray-900/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[580px] border border-gray-200 dark:border-gray-700">
          <div className="bg-gradient-to-r from-purple-700 to-purple-500 p-3 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 text-white flex items-center justify-center font-bold">K</div>
              <div>
                <div className="font-semibold">Kenmark Support</div>
                <div className="text-xs text-white/80">AI-powered, knowledge-grounded answers</div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={()=>setIsOpen(false)} className="p-1 rounded hover:bg-white/10"><X size={16} /></button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-gray-50 dark:bg-gray-800">
            {messages.map((m,i)=> (
              <div key={i} className={`flex ${m.role==='user'? 'justify-end':'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role==='user'? 'bg-purple-600 text-white':'bg-white/90 dark:bg-gray-700 border text-gray-800 dark:text-white'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                  <span className="typing-dots"><span/> <span/> <span/></span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-3 bg-white/95 dark:bg-gray-900/90 border-t flex gap-2">
            <input value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=> e.key==='Enter' && sendMessage()} placeholder="Ask about Kenmark..." className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <button onClick={sendMessage} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-3 py-2 rounded-lg flex items-center gap-1"> <Send size={14} /> <span className="text-xs">Send</span> </button>
          </div>

        </div>
      )}

      <style jsx>{`
        .typing-dots span{display:inline-block;width:6px;height:6px;margin:0 2px;background:#6b21a8;border-radius:50%;animation:typing 1s infinite}
        .typing-dots span:nth-child(2){animation-delay:0.15s}
        .typing-dots span:nth-child(3){animation-delay:0.3s}
        @keyframes typing{0%{opacity:0.2;transform:translateY(-2px)}50%{opacity:1;transform:translateY(0)}100%{opacity:0.2;transform:translateY(-2px)}}
      `}</style>
    </div>
  )
}
