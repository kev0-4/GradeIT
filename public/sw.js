const CACHE_NAME = "gradeit-v2.0.0"
const urlsToCache = [
  "/",
  "/marks",
  "/trends",
  "/login",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json",
  // Add other static assets
  "/_next/static/css/",
  "/_next/static/js/",
]

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache")
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.log("Cache install failed:", error)
      }),
  )
  self.skipWaiting()
})

// Fetch event
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Skip Firebase and Google APIs
  if (
    event.request.url.includes("firebase") ||
    event.request.url.includes("googleapis") ||
    event.request.url.includes("google.com")
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      if (response) {
        return response
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/")
          }
        })
    }),
  )
})

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Background sync for offline data
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync for attendance/marks data
      syncOfflineData(),
    )
  }
})

async function syncOfflineData() {
  try {
    // Get offline data from IndexedDB and sync with Firebase
    console.log("Syncing offline data...")
    // Implementation would depend on your offline storage strategy
  } catch (error) {
    console.error("Background sync failed:", error)
  }
}

// Push notifications (for future use)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1,
      },
      actions: [
        {
          action: "explore",
          title: "Open GradeIT",
          icon: "/icon-192.png",
        },
        {
          action: "close",
          title: "Close",
          icon: "/icon-192.png",
        },
      ],
    }

    event.waitUntil(self.registration.showNotification(data.title || "GradeIT", options))
  }
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  }
})
