export async function callLLM(systemPrompt, userPrompt, model=null){
  // Prefer GROQ if key is set
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if(GROQ_KEY){
    try{
      const resp = await fetch('https://api.groq.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({ model: model || 'llama3-8b-8192', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] })
      });
      const data = await resp.json();
      // Defensive: try to extract text similar to common chat response formats
      if(data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
      if(data?.result) return String(data.result);
      return JSON.stringify(data);
    }catch(e){
      console.error('Groq call failed', e);
    }
  }

  // Try Ollama if set
  const OLLAMA_URL = process.env.OLLAMA_URL || null;
  if(OLLAMA_URL){
    try{
      const r = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'llama2', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] })
      });
      if(r.ok){
        const d = await r.json();
        if(d?.response) return d.response;
        return JSON.stringify(d);
      }
    }catch(e){
      console.error('Ollama call failed', e);
    }
  }

  throw new Error('No LLM provider available. Set GROQ_API_KEY or OLLAMA_URL');
}
