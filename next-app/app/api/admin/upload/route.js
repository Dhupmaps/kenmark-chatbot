import { NextResponse } from 'next/server'
import { saveKnowledgeFile } from '../../../../lib/knowledge.js'

export const runtime = 'nodejs'

function _isAuthorized(req){
  const ADMIN_KEY = process.env.ADMIN_KEY
  if(!ADMIN_KEY) return true
  const provided = req.headers.get('x-admin-key') || (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  return provided === ADMIN_KEY
}

export async function POST(req){
  try{
    if(!_isAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    // forward multipart body to disk. Node's fetch request body is a stream; we'll pipe buffer
    const formData = await req.formData();
    const file = formData.get('file');
    if(!file) return NextResponse.json({ error: 'no file' }, { status: 400 });
    const filename = file.name || 'knowledge.xlsx';
    const arrayBuffer = await file.arrayBuffer();
    saveKnowledgeFile(Buffer.from(arrayBuffer), filename);
    return NextResponse.json({ status: 'ok', message: `Saved ${filename}` });
  }catch(e){
    console.error('upload error', e);
    return NextResponse.json({ error: 'upload failed' }, { status: 500 });
  }
}
