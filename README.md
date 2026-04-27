# Civic Solver Backend

Civic Solver backend powers the civic issue reporting system with authentication, issue management, notifications, admin features, image uploads, and real-time updates.

Built using Node.js, Express, Prisma, PostgreSQL, Socket.IO, and Cloudinary.

## Live API

[https://civic-solver-backend.onrender.com](https://civic-solver-backend.onrender.com)

---

## Features

* User Registration
* Login Authentication
* JWT Authorization
* OTP Email Verification
* Create Issues
* Upload Images
* Cloudinary Integration
* AI-based Issue Classification
* Duplicate Image Detection
* Upvotes
* Comments
* Delete Comments
* Notifications
* Admin-only Features
* Update Issue Status
* Delete Issues
* Admin Dashboard Stats
* Real-time Notifications

---

## Tech Stack

### Core

* Node.js
* Express.js

### Database

* PostgreSQL (Neon)

### ORM

* Prisma
* Prisma Client

### Authentication

* bcryptjs
* jsonwebtoken

### Uploads

* multer
* cloudinary
* multer-storage-cloudinary

### Real-time

* socket.io

### Utilities

* dotenv
* cors
* image-hash

---

## Project Structure

src/
│── config/
│── controllers/
│── middleware/
│── routes/
│── utils/

prisma/
│── schema.prisma
│── migrations/

server.js
socket.js
cloudinary.js

---

## Installation

Clone repository:

```bash
git clone https://github.com/Charan08Teja/civic-solver-backend.git
```

Go into project:

```bash
cd civic-solver-backend
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create `.env` file:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Prisma Setup

Generate Prisma Client:

```bash
npx prisma generate
```

Push schema:

```bash
npx prisma db push
```

Run migrations:

```bash
npx prisma migrate dev
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

## Run Server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

---

## API Routes

### Auth

POST `/api/auth/register`
POST `/api/auth/login`
POST `/api/auth/verify-otp`

### Issues

POST `/api/issues`
GET `/api/issues`
POST `/api/issues/:id/upvote`

### Comments

POST `/api/issues/:id/comment`
GET `/api/issues/:id/comments`
DELETE `/api/issues/comments/:id`

### Notifications

GET `/api/notifications`

### Admin

GET `/api/admin/issues`
PATCH `/api/admin/issues/:id/status`
DELETE `/api/admin/issues/:id`
GET `/api/admin/stats`

---

## Deployment

Backend deployed on:

* Render

Database hosted on:

* Neon PostgreSQL

Images hosted on:

* Cloudinary

---

## Security

* Password hashing with bcrypt
* JWT authentication
* Role-based authorization
* Protected routes

---

## Future Improvements

* Search API
* Better AI classification
* Spam detection
* Issue escalation
* Analytics improvements

---

## Author

Charan
