### Web push notification example

#### Install dependencies
```
 yarn  or npm install
```

#### Generate VAPID keys: Run the command below in the terminal
```
 web-push generate-vapid-keys
```


#### Directory src/client/client.js, set value to:
```
 VAPID_PUBLIC_KEY
```

#### Copy .env.example to .env, fill environment variables:
```
 VAPID_PUBLIC_KEY
 VAPID_PRIVATE_KEY
 VAPID_SUBJECT
```

#### Start project:
```
 yarn start:dev
```
