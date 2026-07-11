// Cloudflare Worker：台股即時盤 + TWSE 財報 代理
// 解決證交所介面無 CORS 標頭、瀏覽器無法直接抓的問題
// 路由：
//   /?code=2330             → 代理 mis.twse.com.tw 即時盤
//   /fin?url=<TWSE opendata 完整 URL>  → 代理 openapi.twse.com.tw/v1/opendata/* (財報，無 CORS)
// 部署：wrangler deploy
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    if (code) {
      // 上市 tse_ / 上櫃 otc_
      const market = /^\d{4,5}$/.test(code) ? 'tse' : 'otc';
      const exCh = `${market}_${code}.tw`;
      const upstream = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${exCh}&json=1&delay=0`;
      return proxy(upstream, 'application/json; charset=utf-8');
    }
    // 財報代理：/fin?url=https://openapi.twse.com.tw/v1/opendata/t187ap06_L_ci
    if (url.pathname === '/fin') {
      const target = url.searchParams.get('url');
      if (!target || !target.startsWith('https://openapi.twse.com.tw/')) {
        return json({ error: 'invalid or missing url (must be openapi.twse.com.tw)' }, 400);
      }
      return proxy(target, 'application/json; charset=utf-8');
    }
    return json({ error: 'unknown route. Use ?code=XXXX or /fin?url=...' }, 404);
  }
};

async function proxy(upstream, contentType) {
  try {
    const resp = await fetch(upstream, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      cf: { cacheTtl: 2, cacheEverything: false }
    });
    const text = await resp.text();
    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  } catch (e) {
    return json({ error: 'upstream failed', detail: String(e) }, 502);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
