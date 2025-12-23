import { NextResponse } from 'next/server'
import { loadKnowledge, findRelevantContext } from '../../../lib/knowledge.js'
import { callLLM } from '../../../lib/llm.js'
import { logChat } from '../../../lib/chats.js'

export async function POST(req){
  try{
    const body = await req.json();
    const message = body.message?.toString?.() || '';
    const session_id = body.session_id || null;
    if(!message) return NextResponse.json({ error: 'empty message' }, { status: 400 });

    logChat(session_id, 'user', message);

    const kb = await loadKnowledge();
    let contexts = findRelevantContext(message, kb, 5);
    // Fallback: attempt a general summary context from KB if no direct match
    if(!contexts || contexts.length === 0){
      const summary = [];
      for(const row of kb){
        const text = `${row.Question} ${row.Answer}`.toLowerCase();
        if(text.includes('kenmark') || text.includes('solution') || text.includes('company')){
          summary.push(`Q: ${row.Question}\nA: ${row.Answer}`);
          if(summary.length >= 6) break;
        }
      }
      if(summary.length){ contexts = summary }
    }
    if(!contexts || contexts.length === 0){
      const reply = "I don't have that information yet.";
      logChat(session_id, 'bot', reply);
      return NextResponse.json({ response: reply, from_knowledge: false });
    }

    const ctxText = contexts.join('\n\n');
    const system = "You are a helpful assistant for Kenmark ITan Solutions. Answer using ONLY the provided context. If answer not in context, say 'I don't have that information yet.' Be concise.";
    const userPrompt = `Context:\n${ctxText}\n\nQuestion: ${message}`;

    try{
      const aiReply = await callLLM(system, userPrompt);
      const reply = aiReply?.toString?.() || "I don't have that information yet.";
      logChat(session_id, 'bot', reply);
      return NextResponse.json({ response: reply, from_knowledge: true });
    }catch(e){
      console.error('LLM error', e);
      // Fallback: return the best matching answer directly from the first context
      const direct = Array.isArray(contexts) && contexts.length ? String(contexts[0]).split('\nA: ')[1] || contexts[0] : "I don't have that information yet.";
      logChat(session_id, 'bot', direct);
      return NextResponse.json({ response: direct, from_knowledge: true, llm_error: true });
    }
  }catch(e){
    console.error('chat route error', e);
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
