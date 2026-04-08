// Cloudflare Pages Function: 图片 CORS 代理
// 路径: /proxy?url=https://edu-tiku.cdn.bcebos.com/...

const ALLOWED_HOSTS = [
  'edu-tiku.cdn.bcebos.com',
  'tiku-data.cdn.bcebos.com',
  'tiku.cdn.bcebos.com',
  'bos.nj.bpc.baidu.com',
  'bce.bdstatic.com',
  'edu-public.cdn.bcebos.com',
];

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const cors = { 'Access-Control-Allow-Origin': '*' };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        ...cors,
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const target = url.searchParams.get('url');
  if (!target) {
    return new Response('图片代理服务 - OK', { status: 200, headers: cors });
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return new Response('无效URL', { status: 400, headers: cors });
  }

  const ok = ALLOWED_HOSTS.some(
    (h) => targetUrl.hostname === h || targetUrl.hostname.endsWith('.' + h)
  );
  if (!ok) {
    return new Response('域名不在白名单', { status: 403, headers: cors });
  }

  try {
    const resp = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': targetUrl.origin + '/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });
    if (!resp.ok) {
      return new Response(`上游 ${resp.status}`, { status: resp.status, headers: cors });
    }
    const headers = new Headers(resp.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=604800');
    return new Response(resp.body, { status: 200, headers });
  } catch (e) {
    return new Response(e.message, { status: 502, headers: cors });
  }
}
