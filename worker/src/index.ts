export interface Env {
  GAS_WEB_APP_URL: string;
  TELEGRAM_BOT_TOKEN: string;
}

async function verifyTelegramInitData(initData: string, botToken: string): Promise<boolean> {
  if (!initData) return false;

  const params: Record<string, string> = {};
  for (const part of initData.split('&')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    params[decodeURIComponent(part.substring(0, idx))] = decodeURIComponent(part.substring(idx + 1));
  }

  const hash = params['hash'];
  if (!hash) return false;

  const dataCheckString = Object.keys(params)
    .filter(k => k !== 'hash')
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('\n');

  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw', encoder.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const secretKeyBytes = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(botToken));

  const sigKey = await crypto.subtle.importKey(
    'raw', secretKeyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBytes = await crypto.subtle.sign('HMAC', sigKey, encoder.encode(dataCheckString));

  const sigHex = [...new Uint8Array(sigBytes)].map(b => b.toString(16).padStart(2, '0')).join('');
  return sigHex === hash;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method === 'GET') {
      return new Response('✅ Spen Manager API Proxy is running', {
        headers: { 'Content-Type': 'text/plain', ...corsHeaders },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.text();
      let payload: any;
      try { payload = JSON.parse(body); } catch { payload = null; }

      if (!payload || !payload.initData) {
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
          status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const t0 = Date.now();
      const valid = await verifyTelegramInitData(payload.initData, env.TELEGRAM_BOT_TOKEN);
      const t1 = Date.now();

      if (!valid) {
        console.log(`[auth] verify failed in ${t1 - t0}ms`);
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
          status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Forward to GAS (strip initData from payload)
      const { initData, ...gasPayload } = payload;
      const t2 = Date.now();
      const gasResponse = await fetch(env.GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gasPayload),
        redirect: 'follow',
      });
      const t3 = Date.now();

      const responseText = await gasResponse.text();
      const t4 = Date.now();
      console.log(`[timing] auth:${t1 - t0}ms gas:${t3 - t2}ms body:${t4 - t3}ms total:${t4 - t0}ms action:${payload.action || '?'}`);

      return new Response(responseText, {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (error: any) {
      console.log(`[error] ${error.message}`);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
