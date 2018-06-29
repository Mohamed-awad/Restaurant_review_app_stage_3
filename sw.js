

var cache_name = 'resturant-cache';

// install cache
self.addEventListener('install', function(event) {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(cache_name).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll([
        '/',
        '/index.html',
        '/restaurant.html',
        '/css/styles.css',
        '/js/dbhelper.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/img/1.webp',
        '/img/2.webp',
        '/img/3.webp',
        '/img/4.webp',
        '/img/5.webp',
        '/img/6.webp',
        '/img/7.webp',
        '/img/8.webp',
        '/img/9.webp',
        '/img/10.webp',
        '/addReview.html'
      ]);
    })
  );
});

// activate cache
self.addEventListener('activate',  event => {
  event.waitUntil(self.clients.claim());
});

// fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request, {ignoreSearch:true}).then(response => {
      return response || fetch(event.request);
    })
  );
});

const send_offline_requests = (event) => {
  self.addReview();
  //self.favoriteRestaurant();
}



//wait until connection stablish
self.addEventListener('sync', function(event) {
  if (event.tag == 'myFirstSync') {
    console.log('work in background');
    event.waitUntil(send_offline_requests());
  }
});


