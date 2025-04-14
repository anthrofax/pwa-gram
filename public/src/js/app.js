
var deferredPrompt;

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('Service worker registered!');
    })
    .catch(function (err) {
      console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', function (event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmationNotification() {
  if ('serviceWorker' in navigator) {
    const options = {
      body: "Kamu telah berhasil berlangganan di layanan notifikasi kami!",
      icon: '/src/images/icons/app-icon-96x96.png',
      image: '/src/images/sf-boat.jpg',
      dir: 'ltr',
      lang: 'en-US', // BCP 47 language tag
      vibrate: [100, 50, 200],
      tag: 'confirm-notification',
      renotify: true,
      actions: [
        {
          action: 'confirm', 
          title: 'Iya', 
          icon: '/src/images/icons/app-icon-96x96.png', 
        },
        {
          action: 'cancel', 
          title: 'Batalkan', 
          icon: '/src/images/icons/app-icon-96x96.png', 
        },
      ],
    }
    
    navigator.serviceWorker.ready.then(function (swreg) {
      swreg.showNotification("Berhasil berlangganan! (From SW)", options);
    });
  }
}

if ('Notification' in window) {
  function askForNotificationPermission() {
    Notification.requestPermission(permission => {
      console.log('User choice:', permission);
      if (permission !== 'granted') {
        console.log('No notification permission granted!');
      } else {
        displayConfirmationNotification();
        console.log('Notification permission granted!');
      }
    });
  }

  const notificationButtons = document.querySelectorAll('.enable-notifications');

  notificationButtons.forEach(button => {
    button.style.display = 'inline-block';

    button.addEventListener('click', askForNotificationPermission);
  });
}

