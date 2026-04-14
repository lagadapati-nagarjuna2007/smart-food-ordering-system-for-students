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

Create a file named `.env` in your project root and add the following keys. Follow the steps below to get each value.

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

---

## 🔑 How to Get Each `.env` Key

### 1. `SUPABASE_URL` and `SUPABASE_KEY`
1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Open your project
3. Click **Project Settings** (gear icon on the left sidebar)
4. Click **API** under the settings menu
5. Copy **Project URL** → paste as `SUPABASE_URL`
6. Copy **anon / public** key under Project API Keys → paste as `SUPABASE_KEY`

---

### 2. `GMAIL_USER` and `GMAIL_PASS`
> CanteenGo uses Gmail to send OTP emails and payment token emails.

1. `GMAIL_USER` → your full Gmail address (e.g. `yourname@gmail.com`)
2. For `GMAIL_PASS` → you need a **Gmail App Password** (not your normal Gmail password):
   - Go to your Google Account → [https://myaccount.google.com](https://myaccount.google.com)
   - Click **Security** on the left
   - Enable **2-Step Verification** if not already enabled
   - Search for **App Passwords** in the search bar
   - Select App → **Mail**, Device → **Windows Computer**
   - Click **Generate**
   - Copy the 16-character password → paste as `GMAIL_PASS`

---

### 3. `GOOGLE_CLIENT_ID`
> Required for Google Sign-In feature.

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Under **Authorized JavaScript origins** add:
   - `http://localhost:3000`
7. Click **Create**
8. Copy the **Client ID** → paste as `GOOGLE_CLIENT_ID`

---

### 4. `ADMIN_USERNAME` and `ADMIN_PASSWORD`
> These are your own custom credentials for the admin panel login.

- Set any username you want, e.g. `ADMIN_USERNAME=admin`
- Set any strong password, e.g. `ADMIN_PASSWORD=canteen@123`
- These are only stored in your `.env` file and never exposed publicly

---

### 5. `GROQ_API_KEY`
> Required for the AI chatbot feature powered by LLaMA 3.3.

1. Go to [https://console.groq.com](https://console.groq.com) and sign in
2. Click **API Keys** on the left sidebar
3. Click **Create API Key**
4. Give it a name (e.g. `CanteenGo`)
5. Copy the key → paste as `GROQ_API_KEY`

---

### 6. `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
> Required for the automated monthly income report sent to Telegram.

**To get `TELEGRAM_BOT_TOKEN`:**
1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Enter a name for your bot (e.g. `CanteenGo Admin Bot`)
4. Enter a username ending in `bot` (e.g. `canteengo_admin_bot`)
5. BotFather will give you a token — copy it → paste as `TELEGRAM_BOT_TOKEN`

**To get `TELEGRAM_CHAT_ID`:**
1. Open Telegram and search for your newly created bot
2. Click **Start** and send any message like `hi`
3. Open this URL in your browser (replace with your token):
   ```
   https://api.telegram.org/botYOURTOKEN/getUpdates
   ```
4. Look for `"chat":{"id":XXXXXXXXX}` in the response
5. Copy that number → paste as `TELEGRAM_CHAT_ID`

---

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

**Lagadapati Sai Nagarjuna**
- GitHub: [@lagadapati-nagarjuna2007](https://github.com/lagadapati-nagarjuna2007)

---

## 📄 License

This project is open source and available under the [ISC License](LICENSE).
