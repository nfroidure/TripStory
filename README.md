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

# Events
- List: GET localhost:3000/api/v0/events
- Details: GET localhost:3000/api/v0/events/:event_id
- Add: PUT localhost:3000/api/v0/events/:event_id
- Delete: DELETE localhost:3000/api/v0/events/:event_id

Resource:
```js
{
  "contents": {
    // anything
  }
}
```
