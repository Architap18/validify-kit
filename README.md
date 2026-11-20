# Validify Lab

A real-world **User Registration & Validation API** that demonstrates [`validify-kit`](https://www.npmjs.com/package/validify-kit) working in a full Node.js/Express application.

---

## What is Validify Lab?

`validify-kit` is a lightweight, **zero-dependency**, schema-driven validation toolkit for Node.js and Express applications. Instead of writing repetitive if-statements to check request data, you define a schema once and let the library enforce it on every request.

**Key capabilities:**

| Feature | Rule key(s) |
|---|---|
| Required fields | `required` |
| Email format check | `email: true` |
| Strong password | `uppercase`, `lowercase`, `number`, `specialChar` |
| String length | `minLength`, `maxLength` |
| Numeric range | `type: 'number'`, `min`, `max` |
| Regex pattern | `pattern` |
| Array validation | `type: 'array'`, `minItems`, `maxItems`, `uniqueItems` |
| Input sanitization | `trim`, `lowercase`, `uppercase` |
| Custom function | `custom: (value) => boolean` |
| Express middleware | `validateRequest(schema)` |
| Nested objects | `schema: { … }` |
| Cross-field | `matchesField` |
| Conditional required | `requiredIf` |

---

## Why is Validify Lab Useful?

1. **Less code** – replace dozens of manual checks with one schema object.
2. **Consistent errors** – structured `{ field, message }` error objects every time.
3. **Non-mutating** – `req.body` is never touched; sanitized data lives in `req.sanitizedBody`.
4. **Zero runtime dependencies** – nothing extra installed in production.
5. **Express-ready** – drop `validateRequest(schema)` into any route.

---

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd validify-lab

# Install dependencies
npm install
```

---

## Running the Application

```bash
npm start
```

Then open **http://localhost:3000** in your browser.

For development with auto-restart on file changes (Node ≥ 18):

```bash
npm run dev
```

---

## Project Structure

```
validify-lab/
│
├── public/
│   ├── index.html      ← Frontend UI
│   ├── style.css       ← Purple/lavender dashboard styles
│   └── script.js       ← DOM interaction + fetch API calls
│
├── src/
│   ├── routes/
│   │   └── userRoutes.js       ← Express router
│   │
│   ├── controllers/
│   │   └── userController.js   ← Route handlers
│   │
│   ├── validators/
│   │   └── userSchema.js       ← validify-kit schemas
│   │
│   └── app.js                  ← Express app + server
│
├── package.json
└── README.md
```

---

## API Endpoints

### `GET /api/health`

Returns server status.

**Response 200**
```json
{
  "status": "ok",
  "service": "validify-lab",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### `POST /api/register`

Validates and processes a user registration.  
Uses **`validateRequest(schema)`** middleware from `validify-kit`.

**Request body**
```json
{
  "name":     "Alice Johnson",
  "email":    "Alice@Example.COM",
  "password": "Secure@123",
  "age":      28,
  "phone":    "+1 800 555 0100",
  "skills":   ["JavaScript", "Node.js"]
}
```

**Success – HTTP 201**
```json
{
  "valid": true,
  "message": "Registration successful! Validify Lab validated and sanitized your input.",
  "user": {
    "name":   "Alice Johnson",
    "email":  "alice@example.com",
    "age":    28,
    "phone":  "+1 800 555 0100",
    "skills": ["JavaScript", "Node.js"]
  },
  "sanitizationNote": "name was trimmed · email was lowercased · original req.body was NOT mutated"
}
```

**Failure – HTTP 400**
```json
{
  "valid": false,
  "errors": [
    { "field": "email",    "message": "email must be a valid email address" },
    { "field": "password", "message": "password: must contain at least one uppercase letter" }
  ]
}
```

---

### `POST /api/validate`

A testing endpoint that runs the same schema rules but always returns the full `validate()` result — useful for exploring the package behaviour field by field.

**Request body** – any subset of registration fields

**Response 200 / 400**
```json
{
  "valid": false,
  "errors": [ { "field": "age", "message": "Age must be a number between 18 and 120" } ],
  "sanitizedData": { "name": "alice", "email": "user@example.com" }
}
```

---

## How the Application Uses Validify Lab

### 1. Schema definition (`src/validators/userSchema.js`)

```js
const { validate, validateRequest } = require('validify-kit');

const userRegistrationSchema = {
  name:     { required: true, type: 'string', minLength: 3, trim: true },
  email:    { required: true, email: true, lowercase: true },
  password: { required: true, minLength: 8, uppercase: true, lowercase: true, number: true, specialChar: true },
  age:      { required: true, type: 'number', min: 18, max: 120 },
  phone:    { required: true, type: 'string', pattern: /^\+?[0-9\s\-()]{7,20}$/ },
  skills:   { required: true, type: 'array',  minItems: 1 },
};
```

### 2. Express middleware (`src/routes/userRoutes.js`)

```js
router.post('/register', validateRequest(userRegistrationSchema), registerUser);
```

One line. If the body is invalid, `validify-kit` automatically returns HTTP 400. If valid, `next()` is called and `req.sanitizedBody` contains the clean data.

### 3. Controller uses sanitized data (`src/controllers/userController.js`)

```js
function registerUser(req, res) {
  const sanitized = req.sanitizedBody; // from validify-kit, never mutates req.body
  const { password: _pw, ...safeUser } = sanitized;
  res.status(201).json({ valid: true, user: safeUser });
}
```

---

## Validation Rules Used in this Demo

| Field    | Rules applied |
|---|---|
| name     | `required`, `type:'string'`, `minLength:3`, `maxLength:80`, `trim:true` |
| email    | `required`, `email:true`, `lowercase:true` |
| password | `required`, `minLength:8`, `uppercase`, `lowercase`, `number`, `specialChar` |
| age      | `required`, `type:'number'`, `min:18`, `max:120` |
| phone    | `required`, `type:'string'`, `pattern:/^\+?[0-9\s\-()]{7,20}$/` |
| skills   | `required`, `type:'array'`, `minItems:1` |

---

## Example Test Requests (curl / Postman)

**Valid registration**
```bash
curl -s -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Johnson","email":"alice@example.com","password":"Secure@123","age":28,"phone":"+1 800 555 0100","skills":["JavaScript"]}'
```

**Invalid – weak password**
```bash
curl -s -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@example.com","password":"password","age":25,"phone":"555-1234","skills":["Python"]}'
```

**Raw validate endpoint**
```bash
curl -s -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{"email":"NOT-AN-EMAIL","age":15}'
```

---

## Features Demonstrated

1. **Schema-driven validation** – single schema object enforces all rules
2. **Express middleware** – `validateRequest()` integrates with zero boilerplate
3. **Email validation** – RFC-format check + automatic lowercase sanitization
4. **Strong password** – multi-criterion strength checks in one field rule
5. **Number & range** – `type:'number'` + `min`/`max` for age validation
6. **Array validation** – `type:'array'` + `minItems` for skills list
7. **Regex pattern** – phone number validated against an international pattern
8. **Input sanitization** – `trim` and `lowercase` transforms, non-mutating

---

## Limitations of Validify Lab (as documented)

- Email check validates *format*, not whether the address exists.
- Custom validators are synchronous only.
- Asynchronous validation is not supported.
- Validation does not replace database uniqueness checks or authentication.
