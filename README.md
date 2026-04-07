# Team-Project
# 🚀 Civic Solver Backend

A scalable backend system for reporting, tracking, and resolving civic issues with real-time notifications.

---

## 📌 Overview

Civic Solver is a platform that allows users to report local civic issues (like potholes, garbage, streetlights, etc.), interact with them through comments and upvotes, and track their resolution status.

This backend powers the entire system, including authentication, issue management, admin controls, and real-time notifications.

---

## ✨ Features

### 👤 User Features

* 🔐 JWT-based Authentication (Register/Login)
* 📝 Report issues with description, location & image
* 🔍 Duplicate issue detection (text + image hashing)
* 👍 Upvote issues
* 💬 Comment on issues
* 🔔 Receive notifications (real-time + stored)

### 🛠️ Admin Features

* 📊 Dashboard statistics (total, pending, resolved, etc.)
* 🔎 Advanced filtering (status, search, location radius)
* ✏️ Update issue status
* ❌ Delete issues
* 👁️ View detailed issue data

### ⚡ Real-Time Features

* 🔔 Instant notifications using Socket.IO
* 👥 Online user tracking
* 📡 Live updates for comments & upvotes

---

## 🧱 Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Authentication:** JWT
* **Real-Time:** Socket.IO
* **File Uploads:** Multer
* **Image Processing:** Custom hashing
* **Other:** string-similarity

---

## 📂 Project Structure

```
civic-solver-backend/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── utils/
│
├── uploads/
├── socket.js
├── server.js
├── package.json
└── .env
```

---

## ⚙️ Environment Variables

Create a `.env` file in root:

```
DATABASE_URL=your_database_url
JWT_SECRET=your_secret_key
PORT=5000
```

---

## 🚀 Installation & Setup

### 1️⃣ Clone the repository

```
git clone https://github.com/YOUR_USERNAME/civic-solver-backend.git
cd civic-solver-backend
```

### 2️⃣ Install dependencies

```
npm install
```

### 3️⃣ Setup database

```
npx prisma migrate dev
```

### 4️⃣ Run the server

```
npx nodemon server.js
```

Server will run on:

```
http://localhost:5000
```

---

## 🔌 API Endpoints

### 🔐 Auth

* `POST /api/auth/register`
* `POST /api/auth/login`

### 📌 Issues

* `POST /api/issues` → Create issue
* `GET /api/issues` → Get all issues
* `POST /api/issues/:id/upvote` → Upvote
* `POST /api/issues/:id/comment` → Add comment

### 🛠️ Admin

* `GET /api/admin` → Get all issues (admin)
* `PATCH /api/admin/:id/status` → Update status
* `DELETE /api/admin/:id` → Delete issue
* `GET /api/admin/stats` → Dashboard stats

### 💬 Comments

* `GET /api/issues/:id/comments`
* `DELETE /api/comments/:id`

### 🔔 Notifications

* `GET /api/notifications`
* `PATCH /api/notifications/:id/read`

---

## ⚡ Real-Time (Socket.IO)

### Connection

```
ws://localhost:5000
```

### Events

#### Register User

```
socket.emit("register", userId);
```

#### Receive Notification

```
socket.on("notification", (data) => {
  console.log(data);
});
```

---

## 🧠 Key Concepts Implemented

* 🔍 Duplicate Detection (Text + Image Hashing)
* 🌍 Geolocation Filtering (Haversine formula)
* ⚡ Real-time communication (WebSockets)
* 🔐 Secure authentication (JWT)
* 🧩 Modular backend architecture

---

## 📸 Future Improvements

* 🔔 Notification UI (Frontend)
* 📱 Mobile app integration
* 📍 Map-based issue visualization
* 📊 Analytics dashboard
* 📧 Email notifications

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.


---

## 👨‍💻 Author

Charan Teja , Sunil Reddy , Md Mazhar
GitHub: https://github.com/Charan08Teja

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
