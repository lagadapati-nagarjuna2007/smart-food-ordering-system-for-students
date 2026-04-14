# smart-food-ordering-system-for-students-frontend-files
CanteenGo frontend — Student canteen ordering system built with HTML, CSS and JavaScript. Students can browse the menu, place orders, make payments and receive a token number to collect food at the counter without waiting in queue.
# 🍽️ CanteenGo — Smart Campus Food Ordering System
CanteenGo is a full-stack web application that eliminates long canteen queues for students. Students can browse the menu, place orders, make payments, and receive a unique token number — all before reaching the counter. The admin manages orders in real time and gets automated monthly income reports via Telegram.
---
## 🚀 Live Demo
> Coming soon / Deploy link here
---
## 📌 Problem Statement
Students in colleges have very limited lunch break time. Waiting in long canteen queues wastes valuable time. CanteenGo solves this by letting students order food in advance online and simply collect it at the counter using a token number — no waiting, no confusion.
---
## ✨ Features
### 👨‍🎓 Student Side
- 📋 Browse full canteen menu with categories (Breakfast, Lunch, Snacks, Drinks, Non-Veg)
- 🛒 Add items to cart and place orders instantly
- 🔐 Sign up / Login with email & password
- 🔑 Google Sign-In support
- 📧 OTP-based password reset via Gmail
- 💳 Payment confirmation flow
- 🎫 Receive unique Token Number via email after payment
- 📦 My Orders panel — track order status in real time (Pending → Approved → Paid → Collected)

### 👨‍💼 Admin Side
- 🔒 Secure admin login
- 📊 View all incoming orders in real time
- ✅ Approve or ❌ Reject orders with one click
- 🎫 Token management — mark orders as Collected
- 🍽️ Full menu management — Add, Edit, Delete items, Toggle stock availability
- 📅 Automated **monthly income report** sent to admin's Telegram at 11:59 PM on the last day of every month

### 🤖 Telegram Bot
- Auto-sends monthly report to admin including:
  - 💰 Total income for the month
  - 🧾 Total number of orders
  - 🏆 Top 3 selling items
  - 📉 Lowest selling item

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | Supabase (PostgreSQL) |
| Authentication | Google OAuth 2.0, OTP via Nodemailer |
| AI Chatbot | Groq API (LLaMA 3.3 70B) |
| Telegram Bot | node-telegram-bot-api |
| Scheduler | node-cron |
| Email | Nodemailer (Gmail SMTP) |
| Hosting | (Add your hosting platform here) |

---

## 📁 Project Structure

```
canteengo/
├── index.html          # Landing page
├── menu.html           # Student menu & ordering page
├── admin.html          # Admin dashboard
├── menu-script.js      # Student side logic
├── admin-script.js     # Admin side logic
├── menu-style.css      # Menu page styles
├── style.css           # Global styles
├── admin.css           # Admin panel styles
├── server.js           # Express backend + all API routes
├── telegramReport.js   # Telegram bot + monthly cron job
├── package.json
├── .env                # Environment variables (never pushed to GitHub)
└── .gitignore
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/lagadapati-nagarjuna2007/smart-food-ordering-system-for-students.git
cd smart-food-ordering-system-for-students
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a `.env` file in the root folder
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GMAIL_USER=your_gmail_address
GMAIL_PASS=your_gmail_app_password
GOOGLE_CLIENT_ID=your_google_oauth_client_id
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
GROQ_API_KEY=your_groq_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
PORT=3000
```

### 4. Run the server
```bash
node server.js
```

### 5. Open in browser
```
http://localhost:3000
```

---

## 🗄️ Supabase Tables

### `users`
| Column | Type |
|---|---|
| id | uuid (primary key) |
| name | text |
| email | text |
| password | text |
| student_reg_num | text |

### `menu_items`
| Column | Type |
|---|---|
| id | int (primary key) |
| name | text |
| description | text |
| price | int |
| time | int |
| veg | boolean |
| category | text |
| popular | boolean |
| icon | text |
| in_stock | boolean |

### `orders`
| Column | Type |
|---|---|
| id | uuid (primary key) |
| student_email | text |
| student_reg_num | text |
| items | jsonb |
| total | text |
| status | text |
| token_number | text |
| created_at | timestamp |

---

## 📱 Order Flow

```
Student places order
        ↓
Admin sees order → Approves / Rejects
        ↓
Student makes payment
        ↓
Token Number generated → Sent to student email
        ↓
Student shows token at counter → Admin marks Collected
```

---

## 📊 Telegram Monthly Report (Auto)

At **11:59 PM on the last day of every month**, the admin receives a Telegram message like this:

```
📊 Monthly Report — April 2026
━━━━━━━━━━━━━━━━━━━━
💰 Total Income: ₹12,450.00
🧾 Total Orders: 87

🏆 Top Selling Items:
  🥇 Chicken Biryani — 43 sold
  🥈 Masala Dosa — 31 sold
  🥉 Cold Coffee — 28 sold

📉 Lowest Selling Item:
  📉 Fruit Salad — 2 sold
━━━━━━━━━━━━━━━━━━━━
Auto-generated by CanteenGo 🍽️
```

---

## 🔐 Security Notes

- `.env` file is excluded from GitHub via `.gitignore`
- Admin credentials are stored in environment variables only
- Google OAuth tokens are verified server-side
- OTP expires after 10 minutes

---

## 👨‍💻 Author

**Lagadapati Nagarjuna Sai**
- GitHub: [@lagadapati-nagarjuna2007](https://github.com/lagadapati-nagarjuna2007)

---
## 📄 License

This project is open source and available under the [ISC License](LICENSE).