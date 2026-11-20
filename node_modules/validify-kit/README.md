# Validify Kit

A lightweight, schema-based validation toolkit for Node.js and Express applications.

Validate request data using reusable schemas instead of writing repetitive validation logic.

## Features

- Required field validation
- Email and password validation
- String length and number range validation
- Regular expression (pattern) validation
- Enum validation
- Optional fields
- Cross-field validation
- Nested object validation
- Custom validation functions
- Express middleware
- Custom error messages
- Early termination with `abortEarly`

**Zero runtime dependencies.**

## Installation

```bash
npm install validify-kit
```

Requires Node.js 18 or higher.

## Quick Start

```javascript
const { validate } = require("validify-kit");

const schema = {
  name: {
    required: true,
    minLength: 3
  },
  email: {
    required: true,
    email: true
  },
  password: {
    required: true,
    minLength: 8
  }
};

const userData = {
  name: "Alice",
  email: "alice@example.com",
  password: "Secure123"
};

const result = validate(userData, schema);

console.log(result);
```

**Output**

```javascript
{
  valid: true,
  errors: []
}
```

If validation fails, the result contains the invalid fields and their error messages.

## Supported Validation Rules

| Rule | Description |
|---|---|
| `required` | Checks whether a field is present and non-empty |
| `email` | Validates email format |
| `password` | Checks password requirements |
| `type` | Validates string or number type |
| `minLength` | Minimum string length |
| `maxLength` | Maximum string length |
| `min` | Minimum numeric value |
| `max` | Maximum numeric value |
| `pattern` | Validates using a regular expression |
| `enum` | Restricts values to allowed options |
| `matchesField` | Compares two fields |
| `schema` | Validates nested objects |
| `custom` | Runs a custom validation function |
| `message` | Provides a custom error message |

Fields without `required: true` are optional.

## Express Middleware

Use `validateRequest()` to validate incoming request bodies.

```javascript
const express = require("express");
const { validateRequest } = require("validify-kit");

const app = express();

app.use(express.json());

const registerSchema = {
  name: {
    required: true,
    minLength: 3
  },
  email: {
    required: true,
    email: true
  },
  password: {
    required: true,
    minLength: 8
  }
};

app.post(
  "/register",
  validateRequest(registerSchema),
  (req, res) => {
    res.status(201).json({
      message: "Registration successful"
    });
  }
);

app.listen(3000);
```

The middleware:
- Validates `req.body`.
- Calls `next()` when validation succeeds.
- Returns HTTP 400 with validation errors when it fails.

## Additional Options

### Stop after the first error

By default, all validation errors are collected.

```javascript
const result = validate(data, schema, {
  abortEarly: true
});
```

The same option works with Express middleware:

```javascript
validateRequest(schema, {
  abortEarly: true
});
```

### Custom validation

```javascript
const schema = {
  username: {
    required: true,
    custom: (value) => /^[a-z0-9_]{3,}$/.test(value),
    message: "Username must be lowercase and at least 3 characters"
  }
};
```

Custom validators should return `true` for valid input and `false` for invalid input.

### Standalone helpers

```javascript
const {
  isValidEmail,
  isStrongPassword
} = require("validify-kit");

console.log(isValidEmail("alice@example.com"));

console.log(
  isStrongPassword("Secure123", {
    minLength: 8,
    uppercase: true,
    lowercase: true,
    number: true,
    specialChar: true
  })
);
```

## Running Tests

Validify Kit uses Node.js's built-in test runner.

```bash
npm test
```

## Project Structure

```text
validify-kit/
├── src/
│   ├── validators/
│   ├── validate.js
│   ├── middleware.js
│   └── index.js
├── tests/
├── examples/
├── package.json
├── README.md
└── LICENSE
```

## Limitations

- Email validation checks format, not whether an address exists.
- Custom validators are synchronous.
- Asynchronous validation is not supported.
- Validation does not replace database checks or authentication.
