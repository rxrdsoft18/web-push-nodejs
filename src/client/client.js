const VAPID_PUBLIC_KEY = 'BHGVlVXUtwC4DMOhYwATAeuGsCjryn2wXn-ae4iodZDTQrWyNFO2U9MWhkvTnPuUHe5YMWV3j4O70zmgfRCGmxg';
const subscribeButton = document.getElementById('subscribe');
const unsubscribeButton = document.getElementById('unsubscribe');
const notifyMeButton = document.getElementById('notify-me');
const API_URL= "http://localhost:5000"

// Convert a base64 string to Uint8Array.
// Must do this so the server can understand the VAPID_PUBLIC_KEY.
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

if ('serviceWorker' in navigator && 'PushManager' in window) {
  navigator.serviceWorker.register('/service-worker.js').then(serviceWorkerRegistration => {
    console.info('Service worker was registered.');
    console.info({serviceWorkerRegistration});
  }).catch(error => {
    console.error('An error occurred while registering the service worker.');
    console.error(error);
  });
  subscribeButton.disabled = false;
} else {
  console.error('Browser does not support service workers or push messages.');
  alert('Browser does not support service workers or push messages.');
}

subscribeButton.addEventListener('click', subscribeButtonHandler);
unsubscribeButton.addEventListener('click', unsubscribeButtonHandler);

async function subscribeButtonHandler() {
  subscribeButton.disabled = true;
  const result = await Notification.requestPermission();
  if (result === 'denied') {
    console.error('The user explicitly denied the permission request.');
    return;
  }
  if (result === 'granted') {
    console.info('The user accepted the permission request.');
    const subs = await subscribeUserToPush()
    fetch('/add-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subs)
    });
  }
}

async function unsubscribeButtonHandler() {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration.pushManager.getSubscription();
  fetch('/remove-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({endpoint: subscription.endpoint})
  });
  const unsubscribed = await subscription.unsubscribe();
  if (unsubscribed) {
    console.info('Successfully unsubscribed from push notifications.');
    unsubscribeButton.disabled = true;
    subscribeButton.disabled = false;
    notifyMeButton.disabled = true;
  }
}


document.getElementById('notify-me').addEventListener('click', async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration.pushManager.getSubscription();
  console.log(subscription,'sub')
  fetch('/notify-me', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({endpoint: subscription.endpoint})
  });
});

document.getElementById('notify-all').addEventListener('click', async () => {
  const response = await fetch('/notify-all', {
    method: 'POST'
  });
  if (response.status === 409) {
    document.getElementById('notification-status-message').textContent =
      'There are no subscribed endpoints to send messages to, yet.';
  }
});

// Push notification logic.
function subscribeUserToPush() {
  return navigator.serviceWorker
    .register('/service-worker.js')
    .then(function (registration) {
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(
          VAPID_PUBLIC_KEY,
        ),
      };

      return registration.pushManager.subscribe(subscribeOptions);
    })
    .then(function (pushSubscription) {
      console.log(
        'Received PushSubscription: ',
        JSON.stringify(pushSubscription),
      );
      return pushSubscription;
    });
}
