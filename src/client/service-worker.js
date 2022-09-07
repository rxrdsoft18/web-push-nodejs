self.addEventListener('push', event => {
  let data = event.data.json();
  console.log(data, 'data loca')
  const image = 'bell.png';
  const icon = "bell.png"
  const options = {
    body: data.options.body,
    icon: icon,
    image: image,
    actions: [
      { action: "show-noti", title: "Ver", icon:""}
    ]
  }
  console.log(options)
  self.registration.showNotification(
    data.title,
    options
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('https://google.com'));
});
