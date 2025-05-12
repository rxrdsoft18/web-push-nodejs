import express from "express";
import webpush from "web-push";
import bodyparser from "body-parser";
import cors from "cors"
import dotenv from "dotenv"
dotenv.config()
import path from "path"
import lodash from 'lodash'
import {join, dirname} from 'path'
import {fileURLToPath} from 'url'
import {Low, JSONFile} from 'lowdb'

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'db.json')
const adapter = new JSONFile(file)

const db = new Low(adapter)

const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_SUBJECT
};


const app = express();
const PORT = process.env.PORT || 3005
app.use(bodyparser.json());
app.use(cors())

await db.read()
db.data = db.data || {subscriptions: []}
db.chain = lodash.chain(db.data)
//set the static path
app.use(express.static(path.join(__dirname, "client/")));


app.post('/add-subscription', async (request, response) => {
  console.log(db.data.subscriptions,'INIT')
  db.data.subscriptions
    .push(request.body);
  await db.write()
  response.sendStatus(200);
});

app.post('/remove-subscription', async (request, response) => {
  console.log(`Unsubscribing ${request.body.endpoint}`);
  db.chain.get('subscriptions')
    .remove({endpoint: request.body.endpoint}).value();
  await db.write()
  response.sendStatus(200);
});

app.post('/notify-me', (request, response) => {
  console.log(`Notifying ${request.body.endpoint}`);
  const subscription = db.chain
    .get('subscriptions')
    .find({ endpoint: request.body.endpoint })
    .value()

  sendNotifications([subscription]);
  response.sendStatus(200);
});

app.post('/notify-all', (request, response) => {
  console.log('Notifying all subscribers');
  const subscriptions =
    db.chain.get('subscriptions').cloneDeep().value();
  console.log(subscriptions)
  if (subscriptions.length > 0) {
    sendNotifications(subscriptions);
    response.sendStatus(200);
  } else {
    response.sendStatus(409);
  }
});

function sendNotifications(subscriptions) {

  console.log(`Sending notifications to ${subscriptions.length} subscribers`, subscriptions);

  console.log('vapidDetails', vapidDetails);

  // Create the notification content.
  const notification = JSON.stringify({
    title: "Hola, cliente",
    options: {
      body: `ID: ${Math.floor(Math.random() * 100)}`
    }
  });
  // Customize how the push service should attempt to deliver the push message.
  // And provide authentication information.
  const options = {
    TTL: 10000,
    vapidDetails: vapidDetails
  };
  // webpush.sendNotification(subscription, notification,options).catch(err=> console.error(err));
  // Send a push message to each client specified in the subscriptions array.
  subscriptions.forEach(subscription => {
    const endpoint = subscription.endpoint;
    const id = endpoint.substr((endpoint.length - 8), endpoint.length);
    webpush.sendNotification(subscription, notification, options)
      .then(result => {
        console.log(`Endpoint ID: ${id}`);
        console.log(`Result: ${result.statusCode}`);
      })
      .catch(error => {
        console.log(`Error sending notification to ${endpoint}`, error);
        console.log(`Endpoint ID: ${id}`);
        console.log(`Error: ${error} `);
      });
  });
}


app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

