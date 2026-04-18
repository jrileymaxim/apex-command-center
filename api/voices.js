export const config = { runtime: 'edge' };
export default async function handler(req) {
  const key = process.env.ELEVENLABS_API_KEY || '';
  if (!key) return new Response(JSON.stringify({error:'no key'}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  const r = await fetch('https://api.elevenlabs.io/v1/voices', {headers:{'xi-api-key': key}});
  const d = await r.json();
  const voices = (d.voices || []).map(v => ({name: v.name, id: v.voice_id, category: v.category}));
  return new Response(JSON.stringify(voices), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
}