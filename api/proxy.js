const https = require('https');
const http = require('http');
const { URL } = require('url');

const ALLOWED_HOSTS = [
  'edu-tiku.cdn.bcebos.com',
  'tiku-data.cdn.bcebos.com',
  'tiku.cdn.bcebos.com',
  'bos.nj.bpc.baidu.com',
  'bce.bdstatic.com',
  'edu-public.cdn.bcebos.com',
];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const targetParam = req.query.url;
  if (!targetParam) { res.status(200).send('图片代理服务 - OK'); return; }

  let targetUrl;
  try { targetUrl = new URL(targetParam); } catch { res.status(400).send('无效URL'); return; }

  const ok = ALLOWED_HOSTS.some(h => targetUrl.hostname === h || targetUrl.hostname.endsWith('.' + h));
  if (!ok) { res.status(403).send('域名不在白名单'); return; }

  const mod = targetUrl.protocol === 'https:' ? https : http;
  const opts = {
    hostname: targetUrl.hostname,
    path: targetUrl.pathname + targetUrl.search,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
  };

  mod.get(opts, (upstream) => {
    if (upstream.statusCode !== 200) {
      res.status(upstream.statusCode).send(`上游 ${upstream.statusCode}`);
      return;
    }
    res.setHeader('Content-Type', upstream.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    upstream.pipe(res);
  }).on('error', (e) => {
    res.status(502).send(e.message);
  });
};
