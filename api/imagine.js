export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, {headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type'}});
  try {
    const { prompt } = await req.json();
    if (!prompt) return new Response(JSON.stringify({error:'no prompt'}), {status:400,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
    const key = process.env.GOOGLE_API_KEY;
    if (!key) return new Response(JSON.stringify({error:'no key'}), {status:500,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
    const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=' + key, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        instances: [{prompt: prompt}],
        parameters: {sampleCount: 1, aspectRatio: '16:9', safetyFilterLevel: 'block_few', personGeneration: 'allow_adult'}
      })
    });
    const data = await resp.json();
    if (!resp.ok) return new Response(JSON.stringify({error: data.error?.message || 'API error'}), {status:500,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
    const b64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) return new Response(JSON.stringify({error:'no image returned'}), {status:500,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
    return new Response(JSON.stringify({image: b64, mimeType: 'image/png'}), {headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  } catch(e) {
    return new Response(JSON.stringify({error: e.message}), {status:500,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}});
  }
}