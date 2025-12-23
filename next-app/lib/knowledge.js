import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';

// Basic HTML text extractor (no external deps) for headings/paragraphs
function stripTags(html){
  return String(html || '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()
}

// Curated embedded Q/A derived from official site content
const EMBEDDED_KENMARK_QA = [
  {
    Category: 'About',
    Question: 'What is Kenmark ITan Solutions?',
    Answer: 'Kenmark ITan Solutions is a one-stop shop for IT solutions, offering web hosting, development, design, branding, marketing, and consultancy services.'
  },
  {
    Category: 'Services',
    Question: 'What services does Kenmark ITan Solutions offer?',
    Answer: 'Comprehensive IT services including web hosting, web development, UI/UX design, branding, online and offline marketing, and technical consultancy.'
  },
  {
    Category: 'Industries',
    Question: 'Which industries does Kenmark ITan Solutions serve?',
    Answer: 'Kenmark serves IT, Arts, Food & Beverages, Health & Fitness, Real Estate, Security, Public Sector, and Marine industries.'
  },
  {
    Category: 'Support',
    Question: 'Does Kenmark provide 24/7 support?',
    Answer: 'Yes. Kenmark offers round-the-clock dedicated support to keep your business running smoothly.'
  },
  {
    Category: 'Contact',
    Question: 'How can I contact Kenmark ITan Solutions?',
    Answer: 'You can reach Kenmark ITan Solutions at +91 98202 83097.'
  },
  {
    Category: 'Value',
    Question: 'Why choose Kenmark ITan Solutions?',
    Answer: 'Kenmark emphasizes exceptional customer service, experienced teams, clear communication, reliable support, fast turnaround, and a focus on customer success.'
  },
]

const DATA_DIR = path.join(process.cwd(), 'data');
const KNOWLEDGE_FILE = process.env.KNOWLEDGE_FILE || path.join(DATA_DIR, 'knowledge.xlsx');

export function ensureDataDir(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function normalizeRow(row){
  // Build a lowercase key map
  const entries = Object.entries(row || {}).reduce((acc,[k,v])=>{ acc[k.toLowerCase().trim()] = v; return acc }, {})
  const pick = (candidates)=>{
    for(const key of candidates){ if(entries[key] != null && entries[key] !== '') return entries[key] }
    return ''
  }
  const question = pick(['question','questions','q','prompt','query','faq question','faq','title'])
  const answer = pick(['answer','answers','a','response','reply','text','content','solution'])
  const category = pick(['category','section','topic','tag'])
  return {
    Category: String(category || ''),
    Question: String(question || ''),
    Answer: String(answer || ''),
  }
}

export function loadKnowledge(){
  // This function is now asynchronous; keep signature compatible by returning a Promise.
  return (async()=>{
    const all = []

    // 1) Embedded curated Q/A
    all.push(...EMBEDDED_KENMARK_QA)

    // 2) Attempt to scrape official website for additional headings and paragraphs
    try{
      const site = process.env.KENMARK_SITE_URL || 'https://kenmarkitan.com'
      const web = await loadWebsiteKnowledge(site)
      all.push(...web)
    }catch(e){ console.error('Website scrape failed', e) }

    // 3) Optionally include local Excel if present (for dev/override)
    try{
      ensureDataDir();
      if(fs.existsSync(KNOWLEDGE_FILE)){
        const wb = xlsx.readFile(KNOWLEDGE_FILE);
        for(const name of wb.SheetNames){
          const sheet = wb.Sheets[name]
          if(!sheet) continue
          const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' })
          for(const r of rows){
            const nr = normalizeRow(r)
            if(nr.Question && nr.Answer){
              all.push({ Category: nr.Category || '', Question: nr.Question.trim(), Answer: nr.Answer.trim() })
            }
          }
        }
      }
    }catch(e){ console.error('Error reading knowledge file', e) }

    return all
  })()
}

function tokenize(text){
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g,' ')
    .split(/\s+/)
    .filter(t=>t.length>2)
}

export function findRelevantContext(query, data, top_k=5){
  if(!query || !data || data.length === 0) return [];
  const qTokens = new Set(tokenize(query));
  const scored = [];
  for(const item of data){
    const qtext = String(item.Question || '')
    const atext = String(item.Answer || '')
    const allText = `${qtext}\n${atext}`.toLowerCase()
    let score = 0
    // direct substring
    if(allText.includes(String(query).toLowerCase())) score += 12
    // token overlap with mild weighting
    const itemTokens = new Set(tokenize(allText))
    let overlap = 0
    for(const t of qTokens){ if(itemTokens.has(t)) overlap++ }
    score += overlap * 2
    // category boost
    if(itemTokens.has('kenmark') || itemTokens.has('solutions')) score += 1
    if(score>0){ scored.push({ score, item }) }
  }
  scored.sort((a,b)=> b.score - a.score)
  return scored.slice(0, top_k).map(({item})=> `Q: ${item.Question}\nA: ${item.Answer}`)
}

export function saveKnowledgeFile(fileBuffer, filename='knowledge.xlsx'){
  ensureDataDir();
  // Always overwrite the canonical file used by the app
  const canonical = path.join(DATA_DIR, 'knowledge.xlsx');
  fs.writeFileSync(canonical, fileBuffer);
  return canonical;
}

// Fetch and extract headings and nearby paragraphs from a single page
async function scrapePageQAs(url){
  const res = await fetch(url, { headers: { 'User-Agent': 'KenmarkBot/1.0' } })
  const html = await res.text()
  const qas = []
  // Extract h1/h2/h3 as questions
  const headingRegex = /<(h1|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi
  let m
  const headings = []
  while((m = headingRegex.exec(html))){ headings.push(stripTags(m[2])) }
  // Extract paragraphs
  const paras = []
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
  let pm
  while((pm = pRegex.exec(html))){ const t = stripTags(pm[1]); if(t.length>20) paras.push(t) }
  // Pair headings to nearest long paragraph
  for(const h of headings){
    const answer = paras.find(p=> p.toLowerCase().includes(h.toLowerCase().split(' ')[0])) || paras[0] || ''
    if(h && answer){ qas.push({ Category: 'Website', Question: h, Answer: answer }) }
  }
  // Specific details that help retrieval
  const phoneMatch = html.match(/\+91\s?\d{5}\s?\d{5}|\+91\s?\d{3,}-?\d{3,}-?\d{4,}/i)
  if(phoneMatch){ qas.push({ Category: 'Contact', Question: 'What is Kenmark contact number?', Answer: stripTags(phoneMatch[0]) }) }
  return qas
}

export async function loadWebsiteKnowledge(baseUrl='https://kenmarkitan.com'){
  try{
    const urls = [baseUrl]
    const results = []
    for(const u of urls){
      try{ const qas = await scrapePageQAs(u); results.push(...qas) }catch(e){ console.error('Scrape failed for', u, e) }
    }
    return results
  }catch(e){ console.error('Website knowledge load error', e); return [] }
}
