const CACHE_NAME='fs-admin-shell-cf-20261022';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('fs-admin-shell-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  // Never cache sessions, private data, or mutations.
  if(request.method!=='GET'||url.pathname.startsWith('/api/')||url.origin!==self.location.origin)return;
  event.respondWith(fetch(request));
});
