# Trip Story

[![Build status](https://secure.travis-ci.org/nfroidure/TripStory.png)](https://travis-ci.org/nfroidure/TripStory)

## Frontend

Currently the frontend is in fact an Ionic app mounted as a simple web mobile
 application. Here is the generator used to create it for reference:
https://github.com/diegonetto/generator-ionic

## SAAS

The SAAS service used here:
- [Mongo Lab](https://mlab.com)
- [Redis Lab](http://app.redislabs.com)
- [MailGun](http://mailgun.com)
- [API Analytics](https://api-analytics.jbpionnier.fr)
- [CloudAMQP](http://api.cloudamqp.com)
- [Cloudinary](https://cloudinary.com)

## API

### Deployment
```sh
# Create the app configuration from the sample config file
cp app.example.json app.prod.json && vim app.prod.json

# Install cron jobs for GPS/Social Network syncs
# note: replace admin:admin per valid credentials
cat "
# TripStory application timer

# Trigger a Xee sync every 2 minutes
# http://crontab.guru/#*/2_*_*_*_*
*/2 * * * * tripstory curl -X POST http://localhost:8122/bus -u admin:admin -d \"exchange=A_XEE_SYNC\"

# Trigger a PSA sync every 2 minutes
# http://crontab.guru/#*/2_*_*_*_*
*/2 * * * * tripstory curl -X POST http://localhost:8122/bus -u admin:admin -d \"exchange=A_PSA_SYNC\"

# Trigger a Twitter sync every 10 minutes
# http://crontab.guru/#*/10_*_*_*_*
*/10 * * * * tripstory curl -X POST http://localhost:8122/bus -u admin:admin -d \"exchange=A_TWITTER_SYNC\"

# Trigger a Facebook sync every 10 minutes
# http://crontab.guru/#*/10_*_*_*_*
*/10 * * * * tripstory curl -X POST http://localhost:8122/bus -u admin:admin -d \"exchange=A_FACEBOOK_SYNC\"

" > /etc/cron.d/9999-tripstory

// Start the backend
npm run start

// Build the front
cd mobile/
npm run cli -- grunt compress --force
```

### Running the back for development:

```sh
cp app.example.json app.dev.json && vim app.dev.json

npm run dev

cd mobile/
npm run cli -- grunt serve --force
```

### Auth:
- Facebook: GET /auth/facebook
- Twitter: GET /auth/twitter
- XEE: GET /auth/xee
- Google: GET /auth/google
- Login: POST username, password to /api/v0/login
- Logout: POST username, password to /api/v0/logout
- Signup: POST username, password, name to /api/v0/signup
- Profile: GET /api/v0/profile - redirection


Resource:
```js
{
  "email": "jojo@ledemago.com",
  "name": "Popol" // Signup only
}
```

# Users
- List: GET /api/v0/users
- Details: GET /api/v0/users/:user_id
- Add: PUT /api/v0/users/:user_id
- Delete: DELETE /api/v0/users/:user_id

Resource:
```js
{
  "contents": {
    "name": "Polo",
    "email": "Lalcolo",
    // + anything
  },
  "cars": [{
    "_id": "abbacacaabbacacaabbacaca",
    contents: {
      // anything
    },
  }],
}
```

# Trips
- List: GET /api/v0/users/:user_id/trips
- Details: GET /api/v0/users/:user_id/trips/:trip_id
- Add: PUT /api/v0/users/:user_id/trips/:trip_id
- Delete: DELETE /api/v0/users/:user_id/trips/:trip_id

Resource:
```js
{
"_id": 'abbacacaabbacacaabbacaca' // ObjectId stringifié et généré côté client
  "contents": {
    "_id": 'abba1a1aabba1a1aabba=caca1a1a' // ObjectId stringifié et généré côté client
    "name": "Mon trip à SF",
    "description": "",
    "from": {
        "address": "2, rue de la Haye du Temple 59000 Lille",
        "latLng": [0, 0],
    },
    "to": {
        "address": "72 avenue de Bretagne 59000 Lille",
        "latLng": [0, 0],
    },
    "tag": "yololille", // Pas de #
    "friends_ids": ['b17eb17eb17eb17eb17eb17e'],
    // anything
  },
  "owner_id": "babababababababababababa", // Id du propriétaire, ajouté par le serveur
}
```

# Events
- List: GET /api/v0/users/:user_id/events
- Details: GET /api/v0/users/:user_id/events/:event_id
- Add: PUT /api/v0/users/:user_id/events/:event_id
- Delete: DELETE /api/v0/users/:user_id/events/:event_id

Resource:
```js
{
"_id": 'abbacacaabbacacaabbacaca' // ObjectId stringifié et généré côté client
  "contents": {
    "type": "trip-start",
    "date": "2015-11-15T13:06:28.745Z" // new Date().toISOString() en JS
    "trip_id": 'abbacacaabbacacaabbacaca' // ObjectId stringifié et généré côté client
    // anything
  },
  "trip": { // Non nécessaire en écriture de le préciser
    "_id": 'abba1a1aabba1a1aabbacaca1a1a' // ObjectId stringifié et généré côté client
    "name": "Mon trip à SF",
    "description": "",
    // anything
  },
  "owner_id": "babababababababababababa", // Id du propriétaire, ajouté par le serveur
}
```

# Cars
- List: GET /api/v0/users/:user_id/cars
- Details: GET /api/v0/users/:user_id/cars/:car_id
- Add: PUT /api/v0/users/:user_id/cars/:car_id (soon)
- Delete: DELETE /api/v0/users/:user_id/cars/:car_id (soon)

Resource:
```js
{
  "_id": "564b2cabeec81a63aae5f4e8",
  "contents": {
    "_id": "564b2cabeec81a63aae5f4e8",
    "type": "psa",
    "vin": "XXXXXXXXXX",
    "contract": "XXXXXXXXXX",
    "code": "XXXXXXXXXX",
    "user_id": "XXXXXXXXXX"
  }
}
```

# Bus
- Add: PUT /bus

Allow to trigger events in order to trigger workers jobs ('A_TWITTER_SYNC',
 'A_PSA_SYNC', 'A_XEE_SYNC'). Install cron jobs that fire them periodically.

 Resource:
 ```js
 {
   "_id": "564b2cabeec81a63aae5f4e8",
   "exchange": "A_XEE_SYNC",
   "contents": {
     // May be needed for some events
   }
 }
 ```
