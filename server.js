const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// ── Supabase ──
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ── Nodemailer (only used for OTP + token email to customer) ──
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// ── Google Auth ──
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ==========================================
// AUTO-SEED MENU (runs once if table is empty)
// ==========================================
async function seedMenuItems() {
    const { count, error } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true });

    if (error) { console.error('Seed check failed:', error.message); return; }
    if (count > 0) { console.log('✅ Menu already seeded.'); return; }

    console.log('Loading default menu items...');
    const initialMenu = [
        { name: "Masala Dosa",          description: "Crispy dosa with spiced potato filling",         price: 50,  time: 8,  veg: true,  category: "Breakfast", popular: true,  icon: "🥞" },
        { name: "Idli Sambar",           description: "Soft steamed idlis with hot sambar",              price: 35,  time: 5,  veg: true,  category: "Breakfast", popular: false, icon: "🍛" },
        { name: "Veg Fried Rice",        description: "Wok-tossed rice with fresh vegetables",          price: 60,  time: 10, veg: true,  category: "Lunch",     popular: true,  icon: "🍚" },
        { name: "Masala Chai",           description: "Spiced ginger tea brewed with milk",              price: 15,  time: 3,  veg: true,  category: "Drinks",    popular: true,  icon: "☕" },
        { name: "Paneer Butter Masala",  description: "Creamy tomato gravy with soft paneer cubes",     price: 90,  time: 10, veg: true,  category: "Lunch",     popular: false, icon: "🧀" },
        { name: "Cold Coffee",           description: "Blended chilled coffee with milk and ice cream",  price: 50,  time: 5,  veg: true,  category: "Drinks",    popular: true,  icon: "🧋" },
        { name: "Vada Pav",              description: "Spicy potato patty in a soft bun",               price: 30,  time: 3,  veg: true,  category: "Snacks",    popular: true,  icon: "🍔" },
        { name: "Samosa (2 pcs)",        description: "Golden crispy pastry with spiced peas",          price: 25,  time: 2,  veg: true,  category: "Snacks",    popular: false, icon: "🥙" },
        { name: "Egg Puff",              description: "Flaky pastry filled with spiced boiled egg",     price: 30,  time: 3,  veg: false, category: "Snacks",    popular: false, icon: "🥚" },
        { name: "Lemon Rice",            description: "Tangy lemon seasoned rice",                      price: 50,  time: 5,  veg: true,  category: "Lunch",     popular: false, icon: "🍋" },
        { name: "Fresh Lime Soda",       description: "Refreshing lime soda with mint",                 price: 25,  time: 2,  veg: true,  category: "Drinks",    popular: false, icon: "🥤" },
        { name: "Curd Rice",             description: "Chilled rice mixed with fresh curd",             price: 45,  time: 3,  veg: true,  category: "Lunch",     popular: false, icon: "🥣" },
        { name: "Lassi",                 description: "Chilled creamy yogurt drink",                    price: 30,  time: 2,  veg: true,  category: "Drinks",    popular: false, icon: "🥛" },
        { name: "Noodles",               description: "Stir-fried noodles with veggies",                price: 60,  time: 8,  veg: true,  category: "Snacks",    popular: false, icon: "🍜" },
        { name: "Aloo Paratha",          description: "Whole wheat flatbread stuffed with potatoes",   price: 55,  time: 6,  veg: true,  category: "Breakfast", popular: false, icon: "🫓" },
        { name: "Chicken Biryani",       description: "Made with pure quality fresh chicken",           price: 150, time: 6,  veg: false, category: "Non-veg",   popular: true,  icon: "🍲" }
    ];

    const { error: insertError } = await supabase.from('menu_items').insert(initialMenu);
    if (insertError) console.error('Seeding failed:', insertError.message);
    else console.log('✅ Menu seeded successfully!');
}

// ==========================================
// MENU ROUTES
// ==========================================

app.get('/api/menu', async (req, res) => {
    const { data, error } = await supabase
        .from('menu_items').select('*').order('id', { ascending: true });
    if (error) return res.status(500).json({ message: 'Error fetching menu' });
    const mapped = data.map(item => ({
        id: item.id, name: item.name, desc: item.description,
        price: item.price, time: item.time, veg: item.veg,
        category: item.category, popular: item.popular,
        icon: item.icon, inStock: item.in_stock
    }));
    res.json(mapped);
});

app.post('/api/menu', async (req, res) => {
    const { name, desc, price, time, veg, category, popular, icon } = req.body;
    if (!name || !price || !category)
        return res.status(400).json({ message: 'name, price and category are required.' });
    const { data, error } = await supabase.from('menu_items').insert([{
        name: name.trim(), description: desc || '', price: Number(price),
        time: Number(time) || 5, veg: veg !== undefined ? veg : true,
        category, popular: popular || false, icon: icon || '🍽️', in_stock: true
    }]).select().single();
    if (error) return res.status(500).json({ message: 'Error adding item: ' + error.message });
    res.status(201).json({ message: 'Menu item added successfully!', item: { ...data, desc: data.description, inStock: data.in_stock } });
});

app.patch('/api/menu/:id/toggle-stock', async (req, res) => {
    const { data: item, error: fetchError } = await supabase
        .from('menu_items').select('in_stock').eq('id', req.params.id).single();
    if (fetchError || !item) return res.status(404).json({ message: 'Item not found' });
    const { data, error } = await supabase.from('menu_items')
        .update({ in_stock: !item.in_stock }).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ message: 'Error updating stock' });
    res.json({ message: 'Stock updated successfully', inStock: data.in_stock });
});

app.put('/api/menu/:id', async (req, res) => {
    const { name, desc, price, time, veg, category, popular, icon } = req.body;
    if (!name || !price || !category)
        return res.status(400).json({ message: 'name, price and category are required.' });
    const { data, error } = await supabase.from('menu_items').update({
        name: name.trim(), description: desc || '', price: Number(price),
        time: Number(time) || 5, veg, category, popular, icon: icon || '🍽️'
    }).eq('id', req.params.id).select().single();
    if (error) return res.status(500).json({ message: 'Error updating item: ' + error.message });
    res.json({ message: 'Item updated successfully!', item: { ...data, desc: data.description, inStock: data.in_stock } });
});

app.delete('/api/menu/:id', async (req, res) => {
    const { error } = await supabase.from('menu_items').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ message: 'Error deleting item: ' + error.message });
    res.json({ message: 'Item deleted successfully!' });
});

// ==========================================
// AI CHAT PROXY — hides Groq API key from browser
// ==========================================

app.post('/api/ai/chat', async (req, res) => {
    const { messages } = req.body;
    if (!messages) return res.status(400).json({ error: 'No messages provided' });

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.GROQ_API_KEY
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                max_tokens: 500,
                messages: messages
            })
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Groq proxy error:', err.message);
        res.status(500).json({ error: 'AI service error' });
    }
});

// ==========================================
// ADMIN LOGIN
// ==========================================

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// ==========================================
// ADMIN ORDERS
// ==========================================

app.get('/api/admin/orders', async (req, res) => {
    const { data, error } = await supabase
        .from('orders').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: 'Error fetching orders' });
    res.json(data);
});

// ==========================================
// GOOGLE AUTH
// ==========================================

app.post('/api/google-auth', async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const email = payload.email;
        const name  = payload.name;

        if (!email.endsWith('@gmail.com'))
            return res.status(403).json({ message: 'Only Gmail accounts are allowed.' });

        let { data: user } = await supabase.from('users').select('*').eq('email', email).single();
        if (!user) {
            const { data: newUser, error } = await supabase
                .from('users').insert([{ name, email, password: 'google-oauth' }]).select().single();
            if (error) return res.status(500).json({ message: 'Failed to create user.' });
            user = newUser;
        }
        res.status(200).json({ message: 'Google sign-in successful!', email: user.email, name: user.name });
    } catch (err) {
        console.error('Google auth error:', err.message);
        res.status(401).json({ message: 'Invalid Google token.' });
    }
});

// ==========================================
// FORGOT PASSWORD — OTP
// ==========================================

const otpStore = {};

app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email || !email.endsWith('@gmail.com'))
        return res.status(400).json({ message: 'A valid Gmail address is required.' });

    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };

    try {
        await transporter.sendMail({
            from: `"CanteenGo" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'CanteenGo — Your OTP for Password Reset',
            html: `
                <div style="font-family:Segoe UI,sans-serif;max-width:480px;margin:auto;background:#f9f9f9;border-radius:12px;overflow:hidden;">
                    <div style="background:#ff5722;padding:24px;text-align:center">
                        <h1 style="color:white;margin:0;font-size:24px">🍽️ CanteenGo</h1>
                    </div>
                    <div style="padding:32px;background:#fff">
                        <h2 style="color:#2f3640;margin-bottom:8px">Password Reset OTP</h2>
                        <p style="color:#636e72;margin-bottom:24px">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
                        <div style="background:#f1f2f6;border-radius:12px;padding:20px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:700;color:#ff5722">${otp}</div>
                        <p style="color:#b2bec3;font-size:12px;margin-top:20px">If you didn't request this, ignore this email.</p>
                    </div>
                </div>
            `
        });
        res.status(200).json({ message: 'OTP sent successfully!' });
    } catch (err) {
        console.error('Email send error:', err.message);
        res.status(500).json({ message: 'Failed to send OTP email.' });
    }
});

app.post('/api/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore[email];
    if (!record) return res.status(400).json({ message: 'No OTP request found. Please request a new OTP.' });
    if (Date.now() > record.expiresAt) {
        delete otpStore[email];
        return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (record.otp !== otp) return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    otpStore[email].verified = true;
    res.status(200).json({ message: 'OTP verified!' });
});

app.post('/api/reset-password', async (req, res) => {
    const { email, password } = req.body;
    const record = otpStore[email];
    if (!record || !record.verified)
        return res.status(403).json({ message: 'OTP not verified. Please complete verification first.' });
    const { error } = await supabase.from('users').update({ password }).eq('email', email);
    if (error) return res.status(500).json({ message: 'Failed to reset password.' });
    delete otpStore[email];
    res.status(200).json({ message: 'Password reset successfully!' });
});

// ==========================================
// AUTH ROUTES
// ==========================================

app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ message: 'Email already registered!' });
    const { error } = await supabase.from('users').insert([{ name, email, password }]);
    if (error) return res.status(500).json({ message: 'Server error: ' + error.message });
    res.status(201).json({ message: 'Registration successful!' });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error || !user || user.password !== password)
        return res.status(401).json({ message: 'Invalid email or password!' });
    res.status(200).json({ message: 'Login successful!', email: user.email });
});

app.post('/api/verify-id', async (req, res) => {
    const { email, studentRegNum } = req.body;
    const { error } = await supabase.from('users').update({ student_reg_num: studentRegNum }).eq('email', email);
    if (error) return res.status(500).json({ message: 'Server error: ' + error.message });
    res.status(200).json({ message: 'ID Verified!' });
});

// ==========================================
// ORDER ROUTES
// ==========================================

// PLACE ORDER — no email sent, admin sees it in My Orders tab
app.post('/api/orders', async (req, res) => {
    const { studentEmail, studentRegNum, items, total } = req.body;

    const { data: existingUser } = await supabase
        .from('users').select('id, student_reg_num').eq('email', studentEmail).single();

    if (!existingUser) {
        await supabase.from('users').insert([{ name: studentEmail, email: studentEmail, password: 'local' }]);
    }

    const regNum = studentRegNum || existingUser?.student_reg_num || 'Not Verified';

    const { data: order, error } = await supabase
        .from('orders')
        .insert([{ student_email: studentEmail, student_reg_num: regNum, items, total, status: 'Pending' }])
        .select().single();

    if (error) return res.status(500).json({ message: 'Server error: ' + error.message });
    res.status(200).json({ message: 'Order placed!', orderId: order.id });
});

// UPDATE ORDER STATUS — Admin clicks Accept or Reject in My Orders tab
app.patch('/api/orders/:id/status', async (req, res) => {
    const { status } = req.body;
    const allowed = ['Approved', 'Rejected', 'Pending', 'Paid', 'Collected'];
    if (!status || !allowed.includes(status))
        return res.status(400).json({ message: 'Invalid status value.' });
    const { data, error } = await supabase
        .from('orders').update({ status }).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ message: 'Order not found.' });
    res.json({ message: 'Order status updated to ' + status, order: data });
});

// CHECK ORDER STATUS — polled by customer frontend every 3s
app.get('/api/orders/:id/status', async (req, res) => {
    const { data: order, error } = await supabase
        .from('orders').select('status').eq('id', req.params.id).single();
    if (error || !order) return res.json({ status: 'Not Found' });
    res.json({ status: order.status });
});

// PAYMENT DONE — generate unique token, save to DB, email token to customer
app.post('/api/orders/:id/payment-done', async (req, res) => {

    // Generate unique token — check DB to avoid any repeats
    let tokenNumber = '';
    let attempts = 0;
    while (!tokenNumber && attempts < 20) {
        attempts++;
        const { count: totalCount } = await supabase
            .from('orders').select('*', { count: 'exact', head: true });
        const candidate = 'TKN-' + String((totalCount || 0) + attempts).padStart(4, '0');
        const { data: existing } = await supabase
            .from('orders').select('id').eq('token_number', candidate).maybeSingle();
        if (!existing) tokenNumber = candidate;
    }
    // Fallback — timestamp-based, guaranteed unique
    if (!tokenNumber) tokenNumber = 'TKN-' + Date.now().toString().slice(-6);

    const { data: order, error } = await supabase
        .from('orders').update({ status: 'Paid', token_number: tokenNumber })
        .eq('id', req.params.id).select().single();

    if (error || !order) return res.status(404).json({ message: 'Order not found' });

    const orderDetails = order.items.map(i =>
        `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee">${i.qty}x ${i.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">₹${i.price * i.qty}</td>
        </tr>`
    ).join('');

    // Email token to the student's own Gmail
    transporter.sendMail({
        from: `"CanteenGo" <${process.env.GMAIL_USER}>`,
        to: order.student_email,
        subject: `✅ Payment Successful — Your Token: ${tokenNumber}`,
        html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:500px;margin:auto;background:#f9f9f9;border-radius:12px;overflow:hidden;">
            <div style="background:#ff5722;padding:24px;text-align:center">
                <h1 style="color:white;margin:0;font-size:26px">🍽️ CanteenGo</h1>
                <p style="color:#ffe0d6;margin:6px 0 0;font-size:14px">Payment Confirmed!</p>
            </div>
            <div style="padding:32px;background:#fff">
                <p style="color:#333;font-size:15px">Hi <strong>${order.student_email}</strong>,</p>
                <p style="color:#555">Your payment was successful. Show this token at the counter to collect your food.</p>
                <div style="background:#fff3e0;border:2px dashed #ff5722;border-radius:12px;padding:20px;text-align:center;margin:24px 0">
                    <p style="color:#888;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px">Your Token Number</p>
                    <h2 style="color:#ff5722;font-size:42px;margin:0;letter-spacing:6px;font-weight:900">${tokenNumber}</h2>
                </div>
                <p style="color:#555;font-weight:600;margin-bottom:8px">Items Ordered:</p>
                <table style="width:100%;border-collapse:collapse;background:#f9f9f9;border-radius:8px;overflow:hidden">
                    ${orderDetails}
                    <tr style="background:#fff3e0">
                        <td style="padding:10px 12px;font-weight:700;color:#333">Total Paid</td>
                        <td style="padding:10px 12px;font-weight:700;color:#ff5722;text-align:right">${order.total}</td>
                    </tr>
                </table>
                <p style="color:#888;font-size:13px;margin-top:24px">📌 Walk up to the canteen counter and show your token number. The staff will hand you your food!</p>
                <p style="color:#b2bec3;font-size:11px;margin-top:16px">Reg No: ${order.student_reg_num}</p>
            </div>
        </div>
        `
    }, (err) => { if (err) console.error('Token email error:', err.message); });

    res.status(200).json({ message: 'Payment confirmed!', tokenNumber });
});

// MARK AS COLLECTED — Admin clicks "Mark Collected" in Tokens tab
app.patch('/api/orders/:id/collected', async (req, res) => {
    const { data, error } = await supabase
        .from('orders').update({ status: 'Collected' }).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order marked as collected', order: data });
});

// GET TOKENS — Admin Tokens tab (Paid + Collected orders)
app.get('/api/admin/tokens', async (req, res) => {
    const { data, error } = await supabase
        .from('orders').select('*').in('status', ['Paid', 'Collected'])
        .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: 'Error fetching tokens' });
    res.json(data);
});

// ==========================================
// START SERVER
// ==========================================
async function startServer() {
    await seedMenuItems();
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

startServer();
