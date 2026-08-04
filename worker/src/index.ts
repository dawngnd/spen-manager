export interface Env {
  GAS_WEB_APP_URL: string;
  TELEGRAM_BOT_TOKEN: string;
}

function buf2hex(buffer: ArrayBuffer): string {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

async function verifyTelegramWebAppData(initData: string, token: string): Promise<boolean> {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  
  if (!hash) {
    return false;
  }
  
  params.delete('hash');
  
  const keys = Array.from(params.keys()).sort();
  const dataCheckString = keys.map(key => `${key}=${params.get(key)}`).join('\n');
  
  const encoder = new TextEncoder();
  const secretKeyData = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const secretKeyBuffer = await crypto.subtle.sign(
    'HMAC',
    secretKeyData,
    encoder.encode(token)
  );
  
  const keyToUse = await crypto.subtle.importKey(
    'raw',
    secretKeyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    keyToUse,
    encoder.encode(dataCheckString)
  );
  
  const signatureHex = buf2hex(signatureBuffer);
  return signatureHex === hash;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-telegram-init-data',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { 
        status: 405, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    const initData = request.headers.get('x-telegram-init-data');
    if (!initData) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    if (!env.TELEGRAM_BOT_TOKEN) {
      return new Response(JSON.stringify({ success: false, error: 'Server misconfiguration' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    const t0 = Date.now();
    const isValid = await verifyTelegramWebAppData(initData, env.TELEGRAM_BOT_TOKEN);
    const t1 = Date.now();
    console.log(`[timing] auth verify: ${t1 - t0}ms`);
    
    if (!isValid) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    try {
      const clonedRequest = request.clone();
      const payload = await clonedRequest.text();
      
      let action = 'unknown';
      try { action = JSON.parse(payload).action || 'unknown'; } catch {}

      const t2 = Date.now();
      const gasResponse = await fetch(env.GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        redirect: 'follow',
      });
      const t3 = Date.now();
      console.log(`[timing] GAS fetch (${action}): ${t3 - t2}ms | status: ${gasResponse.status} | redirected: ${gasResponse.redirected}`);

      const responseText = await gasResponse.text();
      const t4 = Date.now();
      console.log(`[timing] read body: ${t4 - t3}ms | size: ${responseText.length} bytes | total: ${t4 - t0}ms`);
      
      try {
        JSON.parse(responseText);
        return new Response(responseText, { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        });
      } catch (e) {
        console.log(`[error] GAS returned non-JSON: ${responseText.substring(0, 200)}`);
        return new Response(JSON.stringify({ success: false, error: 'Backend unavailable' }), { 
          status: 502, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        });
      }
    } catch (error) {
      console.log(`[error] Worker fetch failed: ${error}`);
      return new Response(JSON.stringify({ success: false, error: 'Internal Server Error' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }
  },
};
