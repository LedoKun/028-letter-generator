const CACHE_PREFIX = 'clinical-letter-generators-';
const CACHE_NAME = `${CACHE_PREFIX}v21`;
// Production build replaces this list with every bundled, local application asset.
const APP_SHELL = ['/', '/index.html', '/site.webmanifest', '/favicon.ico', '/css/fonts.css', '/css/style.css', '/js/offline.js', '/vendor/pdfmake/pdfmake.min.js', '/shared/pdf-generator.js', '/media/logo/logo.png'];
const STATIC_PATHS=new Set(APP_SHELL);
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith(CACHE_PREFIX)&&name!==CACHE_NAME).map(name=>caches.delete(name)))).then(()=>self.clients.claim())));
function cachedResponse(request) {return caches.match(request, { ignoreSearch: true, ignoreVary: true });}
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 const directoryIndex=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname+'/index.html',known=STATIC_PATHS.has(url.pathname)||request.mode==='navigate'&&STATIC_PATHS.has(directoryIndex);
 if(request.method!=='GET'||url.origin!==self.location.origin||!known)return;
 if(request.mode==='navigate')event.respondWith(fetch(request).catch(()=>STATIC_PATHS.has(url.pathname)?cachedResponse(request):cachedResponse(new Request(new URL(directoryIndex,url.origin)))));
 else event.respondWith(cachedResponse(request).then(response=>response||fetch(request)));
});
