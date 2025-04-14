
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
      body: "You successfully subscribed to our Notification service!",
    }
    
    console.log('test')
    navigator.serviceWorker.ready.then(function (swreg) {
      console.log('test 2')
      swreg.showNotification("Successfully subscribed! (From SW)", options);
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

