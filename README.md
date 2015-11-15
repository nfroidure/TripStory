## API


Running the back:

```sh
node backend/index.js
```

### Auth:
- Facebook: GET localhost:3000/auth/facebook
- Login: POST username, password to localhost:3000/api/v0/login
- Logout: POST username, password to localhost:3000/api/v0/logout
- Signup: POST username, password, name to localhost:3000/api/v0/signup
- Profile: GET localhost:3000/api/v0/profile - redirection


Resource:
```js
{
  "username": "jojo@ledemago.com",
  "password": "notasecret", // Saved raw but don't give a shit
  "name": "Popol" // Singup only
}
```

# Users
- List: GET localhost:3000/api/v0/users
- Details: GET localhost:3000/api/v0/users/:user_id
- Add: PUT localhost:3000/api/v0/users/:user_id
- Delete: DELETE localhost:3000/api/v0/users/:user_id

Resource:
```js
{
  "contents": {
    "name": "Polo",
    "email": "Lalcolo",
    // + anything
  }
}
```

# Trips
- List: GET localhost:3000/api/v0/trips
- Details: GET localhost:3000/api/v0/trips/:trip_id
- Add: PUT localhost:3000/api/v0/trips/:trip_id
- Delete: DELETE localhost:3000/api/v0/trips/:trip_id

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
    }
    // anything
  }
}
```

# Events
- List: GET localhost:3000/api/v0/events
- Details: GET localhost:3000/api/v0/events/:event_id
- Add: PUT localhost:3000/api/v0/events/:event_id
- Delete: DELETE localhost:3000/api/v0/events/:event_id

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
    "_id": 'abba1a1aabba1a1aabba=caca1a1a' // ObjectId stringifié et généré côté client
    "name": "Mon trip à SF",
    "description": "",
    // anything
  }
}
```
