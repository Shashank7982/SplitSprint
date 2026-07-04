# SplitStream Backend API Testing Guide (Postman)

This guide details how to test the SplitStream backend authentication and health check API endpoints using Postman.

## 🚀 Getting Started

1. **Start the server**:
   In your terminal, navigate to the `Backend` directory and start the server:
   ```bash
   node server.js
   ```
   You should see:
   ```text
   Server running on port 5000
   MongoDB Connected: 127.0.0.1
   ```

2. **Open Postman**:
   Create a new Postman collection named **SplitStream**.

---

## 🔌 API Reference & Endpoints

### 1. Health Check
* **Method**: `GET`
* **URL**: `http://localhost:5000/api/health`
* **Description**: Verifies that the backend server is running and successfully connected to MongoDB.
* **Response (200 OK)**:
  ```json
  {
    "status": "OK",
    "message": "Server is running and database is connected"
  }
  ```

---

### 2. User Registration
* **Method**: `POST`
* **URL**: `http://localhost:5000/api/auth/register`
* **Headers**: `Content-Type: application/json`
* **Body (raw JSON)**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "password": "password123"
  }
  ```
* **Description**: Creates a new user account, hashes the password, and calls Stripe to register a customer ID.
* **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "user": {
      "id": "6a47e4a76cb97421209a85a8",
      "name": "Alex Mercer",
      "email": "alex@example.com",
      "trustScore": 100,
      "role": "user"
    }
  }
  ```

---

### 3. User Login
* **Method**: `POST`
* **URL**: `http://localhost:5000/api/auth/login`
* **Headers**: `Content-Type: application/json`
* **Body (raw JSON)**:
  ```json
  {
    "email": "alex@example.com",
    "password": "password123"
  }
  ```
* **Description**: Authenticates user credentials. If successful:
  * Returns a short-lived JSON Web Token (`accessToken`) in the body.
  * Sets an HTTP-only secure cookie named `refreshToken` in the browser client/Postman.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6a47e4a76cb97421209a85a8",
      "name": "Alex Mercer",
      "email": "alex@example.com",
      "trustScore": 100,
      "role": "user"
    }
  }
  ```
* **Note on Cookies**: Postman automatically receives and stores the `refreshToken` cookie returned in the headers. You do not need to manually copy it for subsequent requests to the same domain.

---

### 4. Refresh Access Token
* **Method**: `POST`
* **URL**: `http://localhost:5000/api/auth/refresh`
* **Description**: Uses the HTTP-only `refreshToken` stored in cookies to issue a new `accessToken` once the old one expires.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

### 5. User Logout
* **Method**: `POST`
* **URL**: `http://localhost:5000/api/auth/logout`
* **Description**: Instructs Postman/the browser client to clear the HTTP-only `refreshToken` cookie.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

## 🔑 How to Test Protected Endpoints (Future Use)

When we build protected endpoints in later phases, they will require validation of your `accessToken`. Follow these steps in Postman to query those endpoints:

1. Copy the `accessToken` returned from the **Login** response body.
2. In your request to a protected endpoint (e.g. `GET http://localhost:5000/api/pools`), go to the **Authorization** tab.
3. Select **Bearer Token** from the Type dropdown.
4. Paste the copied token into the **Token** text box.
5. Send the request.
