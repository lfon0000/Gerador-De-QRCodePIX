const CACHE_NAME = 'pix-madmras-v8';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './qrcode.min.js',
    './logo-madmraz5.png',
    './manifest.json'
];

// Instalacao do Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                self.skipWaiting();
            })
    );
});

// Ativacao do Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            self.clients.claim();
        })
    );
});

// Interceptar requisicoes
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Retorna do cache se disponivel
                if (response) {
                    return response;
                }

                // Caso contrario, busca na rede
                return fetch(event.request)
                    .then((response) => {
                        // Verifica se a resposta e valida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clona a resposta para cache
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Offline - retorna pagina de fallback se necessario
                        return caches.match('./index.html');
                    });
            })
    );
});
