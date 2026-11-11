// কিবরিয়া টেলিকম: সার্ভিস ওয়ার্কার (নতুন ফাইল আগে নেটওয়ার্ক থেকে আনে, তাই পুরনো নাম/আইকন আটকে থাকে না)
const V = 'kibria-v2';
const SHELL = ['./', 'index.html', 'app.html', 'manifest-kibria.webmanifest', 'icon-kibria-192.png', 'icon-kibria-512.png'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return; // সুপাবেস/ফন্ট/CDN ছোঁয় না
  e.respondWith(
    fetch(r).then(res => {
      if (res && res.ok && res.type === 'basic') { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match('index.html')))
  );
});
