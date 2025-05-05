importScripts("/src/js/idb.js");
importScripts("/src/js/utils.js");

var CACHE_STATIC_NAME = "static-v15";
var CACHE_DYNAMIC_NAME = "dynamic-v2";
var STATIC_FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/src/js/idb.js",
  "/src/js/utils.js",
  "/src/js/app.js",
  "/src/js/feed.js",
  "/src/js/promise.js",
  "/src/js/fetch.js",
  "/src/js/material.min.js",
  "/src/css/app.css",
  "/src/css/feed.css",
  "/src/images/main-image.jpg",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
];

// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName)
//     .then(function (cache) {
//       return cache.keys()
//         .then(function (keys) {
//           if (keys.length > maxItems) {
//             cache.delete(keys[0])
//               .then(trimCache(cacheName, maxItems));
//           }
//         });
//     })
// }

self.addEventListener("install", function (event) {
  console.log("[Service Worker] Installing Service Worker ...", event);

  // Install app shell by caching static assets
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(function (cache) {
      console.log("[Service Worker] Precaching App Shell");
      cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener("activate", function (event) {
  console.log("[Service Worker] Activating Service Worker ....", event);

  // Remove previous cached data (So we get fresh data everytime we update the code on the frontend)
  event.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(
        keyList.map(function (key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log("[Service Worker] Removing old cache.", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) {
    // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log("matched ", string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

self.addEventListener("fetch", function (event) {
  var url =
    "https://pwa-learn-69738-default-rtdb.asia-southeast1.firebasedatabase.app/posts";

  // Cache strategy for Handle the dynamic assets (Cache, then network)
  // We use this strategy for the dynamic assets, because we want the displayed data is the latest one, but keep the initial load fast with the help of cache
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request).then(function (res) {
        var clonedRes = res.clone();

        clearData("posts")
          .then(() => {
            return clonedRes.json();
          })
          .then(function (data) {
            for (var key in data) {
              writeData("posts", data[key]);
            }
          });

        return res;
      })
    );
    // Cache strategy for static assets (Cache only)
    // We use this strategy for the static assets, because we don't want to go for network for these kind of request, because we definitely have stored the data in the cache in the 'install' phase
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(caches.match(event.request));

    // Cache strategy for the rest of the requests (Cache first, with network fallback)
    // If we use cache, then network strategy for this kind of request, the app would break if in offline mode, because that strategy will go for network in the end
  } else {
    event.respondWith(
      caches.match(event.request).then(function (response) {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(function (res) {
              return caches.open(CACHE_DYNAMIC_NAME).then(function (cache) {
                // trimCache(CACHE_DYNAMIC_NAME, 3);
                cache.put(event.request.url, res.clone());
                return res;
              });
            })
            .catch(function (err) {
              return caches.open(CACHE_STATIC_NAME).then(function (cache) {
                if (event.request.headers.get("accept").includes("text/html")) {
                  return cache.match("/offline.html");
                }
              });
            });
        }
      })
    );
  }
});

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response) {
//         if (response) {
//           return response;
//         } else {
//           return fetch(event.request)
//             .then(function(res) {
//               return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//             })
//             .catch(function(err) {
//               return caches.open(CACHE_STATIC_NAME)
//                 .then(function(cache) {
//                   return cache.match('/offline.html');
//                 });
//             });
//         }
//       })
//   );
// });

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(function(res) {
//         return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//       })
//       .catch(function(err) {
//         return caches.match(event.request);
//       })
//   );
// });

// Cache-only
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

// Network-only
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     fetch(event.request)
//   );
// });

self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background syncing", event);
  if (event.tag === "sync-new-posts") {
    console.log("[Service Worker] Syncing new Posts");
    event.waitUntil(
      getAllData("sync-posts").then(function (data) {
        for (const feed of data) {
          fetch("https://storepostdata-5ir6gb5ziq-uc.a.run.app", {
            method: "POST",
            body: JSON.stringify(feed),
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          })
            .then((res) => {
              res.json().then((data) => {
                console.log("Data berhasil diunggah!", data);
                deleteData("sync-posts", data.id);
              });
            })
            .catch((err) => console.log("Error when sending data", err));
        }
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  const notification = event.notification; // Notifikasi yang diklik
  const action = event.action; // Action ID (jika ada)

  if (action !== "confirm") {
    event.waitUntil(
      clients
        .matchAll({ type: "window" })
        .then((allClients) => {
          // Mencari jendela yang sudah terbuka
          const client = allClients.find(
            (c) => c.visibilityState === "visible"
          );

          if (client) {
            // Jika jendela sudah terbuka, arahkan ke URL tertentu dan fokuskan
            return client
              .navigate(notification.data.url)
              .then(() => client.focus());
          } else {
            // Jika tidak ada jendela yang terbuka, buka tab baru
            return client.openWindow(notification.data.url);
          }
        })
        .then(() => {
          // Tutup notifikasi setelah selesai
          notification.close();
        })
    );
  }
});

self.addEventListener("notificationclose", (event) => {
  const notification = event.notification; // Notifikasi yang ditutup

  // Log informasi tentang penutupan
  console.log("Notification was closed");
  console.log(notification);
});

self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  // Fallback data jika payload tidak tersedia
  let data = {
    title: "New!",
    content: "Something new happened!",
    openUrl: "/",
  };

  // Memeriksa apakah ada data dalam payload
  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  // Memeriksa apakah ada data dalam payload
  const options = {
    body: data.content,
    icon: "/src/images/icons/app-icon-96x96.png",
    badge: "/src/images/icons/app-icon-96x96.png",
    data: {
      url: data.openUrl,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
