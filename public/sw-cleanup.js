// Script para limpiar Service Workers registrados previamente
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  }).catch(function(err) {
    // Error silenciado - limpieza de service workers falló
  });
}

// Limpiar cache del navegador relacionado con PWA
if ('caches' in window) {
  caches.keys().then(function(names) {
    for (let name of names) {
      caches.delete(name);
    }
  });
}