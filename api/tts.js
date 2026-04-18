export const config = { runtime: 'edge' };

const VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam - Dominant, Firm (premade, works on free plan)

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, {headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type'}});
  try {
    const { text } = await req.json();
    if (!text) return new Response(JSON.stringify({error:'no text'}), {status:400,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) return new Response(JSON.stringify({fallback:true}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
    const resp = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + VOICE_ID, {
      method: 'POST',
      headers: {'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'},
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true}
      })
    });
    if (!resp.ok) {
      const err = await resp.text();
      return new Response(JSON.stringify({error:err, fallback:true}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
    }
    const audio = await resp.arrayBuffer();
    return new Response(audio, {headers:{'Content-Type':'audio/mpeg','Access-Control-Allow-Origin':'*','Cache-Control':'no-cache'}});
  } catch(e) {
    return new Response(JSON.stringify({error:e.message, fallback:true}), {status:500,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }
}