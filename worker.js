// Cloudflare Worker：台股即時盤代理
// 解決證交所即時介面無 CORS 標頭、瀏覽器無法直接抓的問題
// 部署：wrangler deploy
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    if (!code) {
      return new Response(JSON.stringify({ error: 'missing code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    // 上市 tse_ / 上櫃 otc_
    const market = /^\d{4,5}$/.test(code) ? 'tse' : 'otc';
    const exCh = `${market}_${code}.tw`;
    const upstream = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${exCh}&json=1&delay=0`;
    try {
      const resp = await fetch(upstream, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        cf: { cacheTtl: 2, cacheEverything: false }
      });
      const text = await resp.text();
      return new Response(text, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'upstream failed', detail: String(e) }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};