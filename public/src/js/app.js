
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

function configurePushSub() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker tidak didukung.');
    return;
  }

  let reg;
  navigator.serviceWorker.ready.then(swRegistration => {
    reg = swRegistration;
    return swRegistration.pushManager.getSubscription()
  }).then(subscription => {
    if (subscription === null) {
      // Tidak ada subscription, buat yang baru
      vapidPublicKey = "BONa2hy8asjhYWVivsTTxNY5ZtGxN6VGfAlbvLi9iVDgoXnL5mquqBtoNsJK2jffOY4Idshju3D5AAbVcQwib9k";
      const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);

      return reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidPublicKey,
      })
    } else {
      // Gunakan subscription yang sudah ada
    }
  }).then(newSub => {
    console.log('Berhasil mendapatkan subscription:', newSub);
    fetch('https://pwa-learn-69738-default-rtdb.asia-southeast1.firebasedatabase.app/subscription.json', {
      method: 'POST',
      body: JSON.stringify(newSub),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    })
  }).then(res => {
    if (res.ok) {
      console.log('Subscription berhasil disimpan di server!');
    }
  }).catch(err => {
    console.log('Error:', err);
  });
}

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
        configurePushSub();
        // displayConfirmationNotification();
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
