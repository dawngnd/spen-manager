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

    const isValid = await verifyTelegramWebAppData(initData, env.TELEGRAM_BOT_TOKEN);
    if (!isValid) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }

    try {
      const clonedRequest = request.clone();
      const payload = await clonedRequest.text();

      const gasResponse = await fetch(env.GAS_WEB_APP_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      const responseText = await gasResponse.text();
      
      try {
        JSON.parse(responseText);
        return new Response(responseText, { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: 'Backend unavailable' }), { 
          status: 502, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: 'Internal Server Error' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      });
    }
  },
};
