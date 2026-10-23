const C='nl-v4',F=['./','./index.html','./manifest.webmanifest','./icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('./index.html'))))});

self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>l.length?l[0].focus():clients.openWindow('./')))});
self.addEventListener('push',e=>{let d={title:'নেটলিংক',body:''};try{d=e.data.json()}catch(_){try{d.body=e.data.text()}catch(__){}}
e.waitUntil(self.registration.showNotification(d.title||'নেটলিংক',{body:d.body||'',icon:'icon-192.png',badge:'icon-192.png',tag:d.id?('nl'+d.id):undefined}))});
