document.addEventListener('DOMContentLoaded', function() {

    // Global variables
    var menuItems = []; 
    var cart = JSON.parse(localStorage.getItem('canteenCart')) || {};

    // Get DOM Elements
    var menuGrid = document.getElementById('menu-grid');
    var itemCountSpan = document.getElementById('item-count');
    var cartCountSpan = document.querySelector('.cart-count');
    var cartModal = document.getElementById('cart-modal-overlay');
    var cartBtn = document.getElementById('cart-btn');
    var closeCartBtn = document.getElementById('close-cart-btn');
    var cartItemsContainer = document.getElementById('cart-items-container');
    var cartTotalPrice = document.getElementById('cart-total-price');
    var placeOrderBtn = document.getElementById('place-order-btn');
    var paymentModal = document.getElementById('payment-modal-overlay');
    var finalPayBtn = document.getElementById('final-pay-btn');
    var payTabs = document.querySelectorAll('.pay-tab');
    var payViews = document.querySelectorAll('.pay-view');
    var filterBtns = document.querySelectorAll('.filter-btn');
    var logoutBtn = document.getElementById('logout-btn');
    var logoutModal = document.getElementById('logout-modal-overlay');
    var confirmLogoutBtn = document.getElementById('confirm-logout-btn');
    var cancelLogoutBtn = document.getElementById('cancel-logout-btn');
    var logoutEmailDisplay = document.getElementById('logout-email-display');
    var contactBtn = document.getElementById('contact-btn');
    var contactModal = document.getElementById('contact-modal-overlay');
    var closeContactBtn = document.getElementById('close-contact-btn');

 const SERVER = "https://smart-food-ordering-system-for-students.onrender.com";
    // ==========================================
    // 1. FETCH LIVE MENU FROM DATABASE
    // ==========================================
    async function loadLiveMenu() {
        try {
            const response = await fetch(SERVER + '/api/menu');
            menuItems = await response.json();
            renderMenu(menuItems);
            updateCartUI();
        } catch (error) {
            menuGrid.innerHTML = '<p style="color:red; text-align:center; padding:40px;">Failed to load menu from server. Make sure Node.js is running.</p>';
            console.error("Database connection failed", error);
        }
    }

    // ==========================================
    // 2. RENDER MENU WITH STOCK LOGIC
    // ==========================================
    function renderMenu(items) {
        menuGrid.innerHTML = '';
        itemCountSpan.textContent = items.length + ' items';
        if (items.length === 0) {
            menuGrid.innerHTML = '<p style="color:#a9b1d6;font-size:18px;grid-column:1/-1;text-align:center;padding:40px 0">No items found.</p>';
            return;
        }
        
        items.forEach(function(item) {
            var popularTag = item.popular ? '<span class="tag popular"><i class="fas fa-star"></i> Popular</span>' : '<span></span>';
            var vegTag = item.veg ? '<span class="diet-tag veg"><i class="fas fa-leaf"></i> Veg</span>' : '<span class="diet-tag non-veg"><i class="fas fa-bone"></i> Non-Veg</span>';
            var stockTag = item.inStock ? '' : '<span class="tag" style="background:red; color:white; font-weight:bold"><i class="fas fa-ban"></i> Sold Out</span>';
            var opacityStyle = item.inStock ? '' : 'opacity: 0.5; filter: grayscale(80%); pointer-events: none;';
            var buttonHTML = item.inStock 
                ? '<button class="btn-add" data-id="' + item.id + '">+ Add</button>'
                : '<button style="background:grey; color:white; border:none; padding:6px 12px; border-radius:15px;" disabled>Unavailable</button>';

            menuGrid.innerHTML +=
                '<div class="menu-card" style="' + opacityStyle + '">' +
                  '<div class="card-header">' + popularTag + vegTag + stockTag + '</div>' +
                  '<div class="card-icon">' + item.icon + '</div>' +
                  '<h3 class="card-title">' + item.name + '</h3>' +
                  '<p class="card-desc">' + item.desc + '</p>' +
                  '<div class="card-bottom">' +
                    '<div class="price-time">' +
                      '<span class="price">&#8377;' + item.price + '</span>' +
                      '<span class="time"><i class="fas fa-clock"></i> ' + item.time + ' min</span>' +
                    '</div>' +
                    buttonHTML +
                  '</div>' +
                '</div>';
        });

        document.querySelectorAll('.btn-add').forEach(function(button) {
            button.addEventListener('click', function(e) {
                var itemId = parseInt(e.target.getAttribute('data-id'));
                addToCart(itemId);
                e.target.textContent = 'Added!';
                e.target.classList.add('added-state');
                setTimeout(function() {
                    e.target.textContent = '+ Add';
                    e.target.classList.remove('added-state');
                }, 1000);
            });
        });
    }

    // ==========================================
    // 3. CART LOGIC
    // ==========================================
    function updateCartUI() {
        var totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
        cartCountSpan.textContent = totalItems;
        localStorage.setItem('canteenCart', JSON.stringify(cart));
        renderCartItems();
    }

    function renderCartItems() {
        cartItemsContainer.innerHTML = '';
        var total = 0;
        Object.keys(cart).forEach(function(id) {
            var itemId = parseInt(id);
            var item = menuItems.find(i => i.id === itemId);
            var quantity = cart[id];
            
            if (item && item.inStock === false) {
                delete cart[id];
                quantity = 0;
            }

            if (item && quantity > 0) {
                total += item.price * quantity;
                cartItemsContainer.innerHTML +=
                    '<div class="cart-item-row" data-id="' + itemId + '">' +
                      '<div class="item-info">' +
                        '<div class="item-icon">' + item.icon + '</div>' +
                        '<div class="item-text">' +
                          '<span class="item-name">' + item.name + '</span>' +
                          '<span class="item-price">&#8377;' + item.price + '</span>' +
                        '</div>' +
                      '</div>' +
                      '<div class="quantity-controls">' +
                        '<button class="qty-btn dec-qty"><i class="fas fa-minus"></i></button>' +
                        '<span class="qty-num">' + quantity + '</span>' +
                        '<button class="qty-btn inc-qty"><i class="fas fa-plus"></i></button>' +
                      '</div>' +
                    '</div>';
            }
        });
        cartTotalPrice.innerHTML = '&#8377;' + total;
        cartTotalPrice.dataset.total = total;
        
        cartItemsContainer.querySelectorAll('.dec-qty').forEach(btn => {
            btn.addEventListener('click', e => changeQuantity(e, -1));
        });
        cartItemsContainer.querySelectorAll('.inc-qty').forEach(btn => {
            btn.addEventListener('click', e => changeQuantity(e, 1));
        });
    }

    function addToCart(itemId) {
        if (cart[itemId]) cart[itemId]++;
        else cart[itemId] = 1;
        updateCartUI();
    }

    function changeQuantity(e, change) {
        var itemId = e.target.closest('.cart-item-row').getAttribute('data-id');
        cart[itemId] += change;
        if (cart[itemId] <= 0) delete cart[itemId];
        updateCartUI();
    }

    cartBtn.addEventListener('click', () => cartModal.classList.add('open'));
    closeCartBtn.addEventListener('click', () => cartModal.classList.remove('open'));

    // ==========================================
    // 4. CHECKOUT & PAYMENT
    // ==========================================
    payTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            payTabs.forEach(t => t.classList.remove('active'));
            payViews.forEach(v => v.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.getAttribute('data-target')).classList.add('active');
        });
    });

    placeOrderBtn.addEventListener('click', async function() {
        if (Object.keys(cart).length === 0) { alert('Your cart is empty!'); return; }
        var currentTotal = cartTotalPrice.dataset.total || '0';
        var currentTotalDisplay = '\u20B9' + currentTotal;
        var studentRegNum = JSON.parse(localStorage.getItem('studentRegNum')) || 'Unknown ID';
        var studentData = JSON.parse(localStorage.getItem('canteenUser')) || { email: 'student@gmail.com' };
        var orderItems = Object.keys(cart).map(id => {
            var item = menuItems.find(i => i.id === parseInt(id));
            return { name: item.name, price: item.price, qty: cart[id] };
        });
        
        cartModal.classList.remove('open');
        alert('Sending order... Please wait while the owner reviews it.');
        placeOrderBtn.disabled = true;
        
        try {
            var response = await fetch(SERVER + '/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentEmail: studentData.email, studentRegNum: studentRegNum, items: orderItems, total: currentTotalDisplay })
            });
            var data = await response.json();
            if (response.ok) {
                var orderId = data.orderId;
                finalPayBtn.dataset.orderId = orderId;
                
                var checkInterval = setInterval(async function() {
                    var statusRes = await fetch(SERVER + '/api/orders/' + orderId + '/status');
                    var statusData = await statusRes.json();
                    if (statusData.status === 'Approved') {
                        clearInterval(checkInterval);
                        alert('SUCCESS! Owner approved your order. Proceeding to payment.');
                        paymentModal.classList.add('open');
                        finalPayBtn.textContent = 'Proceed to Pay ' + currentTotalDisplay;
                        placeOrderBtn.disabled = false;
                    } else if (statusData.status === 'Rejected') {
                        clearInterval(checkInterval);
                        alert('Your order was declined. Please try again.');
                        placeOrderBtn.disabled = false;
                    }
                }, 3000);
            } else {
                alert('Error placing order.');
                placeOrderBtn.disabled = false;
            }
        } catch (error) {
            alert('Could not connect to server.');
            placeOrderBtn.disabled = false;
        }
    });

    finalPayBtn.addEventListener('click', async function() {
        finalPayBtn.textContent = 'Processing...';
        finalPayBtn.style.backgroundColor = '#2ecc71';
        finalPayBtn.disabled = true;
        var orderId = finalPayBtn.dataset.orderId;
        var tokenNumber = '';

        if (orderId) {
            try {
                var payRes = await fetch(SERVER + '/api/orders/' + orderId + '/payment-done', { method: 'POST' });
                var payData = await payRes.json();
                tokenNumber = payData.tokenNumber || ('#' + Math.floor(1000 + Math.random() * 9000));
            } catch (e) {
                console.warn(e);
                tokenNumber = '#' + Math.floor(1000 + Math.random() * 9000);
            }
        }

        setTimeout(function() {
            paymentModal.classList.remove('open');

            // Show a styled token popup instead of plain alert
            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center';
            overlay.innerHTML =
                '<div style="background:#fff;border-radius:20px;padding:40px 36px;max-width:360px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.4)">' +
                    '<div style="font-size:52px;margin-bottom:12px">🎉</div>' +
                    '<h2 style="color:#333;margin:0 0 6px;font-size:22px">Payment Successful!</h2>' +
                    '<p style="color:#888;font-size:14px;margin-bottom:24px">Check your email for your token & order details.</p>' +
                    '<div style="background:#fff3e0;border:2px dashed #ff5722;border-radius:12px;padding:18px;margin-bottom:24px">' +
                        '<p style="color:#888;font-size:11px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px">Your Token</p>' +
                        '<h1 style="color:#ff5722;font-size:40px;margin:0;letter-spacing:5px;font-weight:900">' + tokenNumber + '</h1>' +
                    '</div>' +
                    '<p style="color:#555;font-size:13px;margin-bottom:24px">📌 Show this token at the canteen counter to collect your food!</p>' +
                    '<button id="token-ok-btn" style="background:#ff5722;color:white;border:none;padding:12px 32px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">Got it!</button>' +
                '</div>';
            document.body.appendChild(overlay);
            document.getElementById('token-ok-btn').addEventListener('click', function() {
                document.body.removeChild(overlay);
            });

            cart = {};
            updateCartUI();
            finalPayBtn.textContent = 'Proceed to Pay';
            finalPayBtn.style.backgroundColor = '#3b82f6';
            finalPayBtn.disabled = false;
        }, 1500);
    });

    // ==========================================
    // 5. FILTERS & SEARCH
    // ==========================================
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            var category = e.target.getAttribute('data-category');
            var filtered = category === 'all' ? menuItems
                : category === 'veg' ? menuItems.filter(i => i.veg === true)
                : category === 'Non-veg' ? menuItems.filter(i => i.veg === false)
                : menuItems.filter(i => i.category === category);
            renderMenu(filtered);
        });
    });

    document.getElementById('search-input').addEventListener('input', function(e) {
        var term = e.target.value.toLowerCase().trim();
        var results = menuItems.filter(item => item.name.toLowerCase().includes(term) || item.desc.toLowerCase().includes(term));
        renderMenu(results);
    });

    // ==========================================
    // 6. LOGOUT & MODALS
    // ==========================================
    if(logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            var savedUser = JSON.parse(localStorage.getItem('canteenUser'));
            logoutEmailDisplay.textContent = (savedUser && savedUser.email) ? savedUser.email : 'your account';
            logoutModal.classList.add('open');
        });
    }
    if(cancelLogoutBtn) cancelLogoutBtn.addEventListener('click', function() { logoutModal.classList.remove('open'); });
    if(confirmLogoutBtn) confirmLogoutBtn.addEventListener('click', function() {
        localStorage.removeItem('studentRegNum');
        localStorage.removeItem('canteenCart');
        window.location.href = 'index.html';
    });

    if(contactBtn) contactBtn.addEventListener('click', function() { contactModal.classList.add('open'); });
    if(closeContactBtn) closeContactBtn.addEventListener('click', function() { contactModal.classList.remove('open'); });
    if(contactModal) {
        contactModal.addEventListener('click', function(e) {
            if (e.target === contactModal) contactModal.classList.remove('open');
        });
    }

    // ==========================================
    // 7. AI CHAT — with Add Menu Item & Place Order actions
    // ==========================================
    var aiSidebar = document.getElementById('ai-sidebar');
    var aiToggleBtn = document.getElementById('ai-toggle-btn');
    var closeAiBtn = document.getElementById('close-ai-btn');
    var chatWindow = document.getElementById('chat-window');
    var aiInput = document.getElementById('ai-user-input');
    var aiSend = document.getElementById('ai-send-btn');

    // ---- ACTION FUNCTIONS ----

    // Add a new menu item to the DB and reload the menu
    async function aiAddMenuItem(itemData) {
        const res = await fetch(SERVER + '/api/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });
        const data = await res.json();
        if (res.ok) {
            await loadLiveMenu(); // Refresh menu on page
            return { success: true, item: data.item };
        } else {
            return { success: false, message: data.message };
        }
    }

    // Add items to cart only (AI cannot place orders)
    function aiAddToCart(itemNames, quantities) {
        var notFound = [];
        var added = [];

        itemNames.forEach(function(name, idx) {
            var qty = quantities && quantities[idx] ? parseInt(quantities[idx]) : 1;
            var found = menuItems.find(m => m.name.toLowerCase().includes(name.toLowerCase()));
            if (found && found.inStock) {
                cart[found.id] = (cart[found.id] || 0) + qty;
                added.push({ name: found.name, qty: qty, price: found.price });
            } else if (found && !found.inStock) {
                notFound.push(name + ' (out of stock)');
            } else {
                notFound.push(name);
            }
        });

        updateCartUI();
        return { added, notFound };
    }

    // ---- SYSTEM PROMPT (dynamic — always reads live menuItems) ----
    function getSystemPrompt() {
        var menuList = menuItems.map(function(item, idx) {
            return (idx + 1) + '.' +
                item.name + ' Rs' + item.price +
                ' ' + item.time + 'min' +
                ' ' + (item.veg ? 'Veg' : 'NonVeg') +
                ' ' + item.category +
                (item.popular ? ' Popular' : '') +
                (item.inStock ? '' : ' [OUT OF STOCK]');
        }).join('\n');

        return "You are CanteenBot, a friendly AI assistant for CanteenGo - a student canteen ordering app.\n" +
            "CANTEEN: Open Lunch 12-2PM weekdays. Avg wait 5 min.\n" +
            "Contact: lagadapati.sai@gmail.com | +91 9849165987.\n\n" +
            "CURRENT MENU:\n" + menuList + "\n\n" +
            "YOU HAVE TWO SPECIAL POWERS — use them by returning JSON actions:\n\n" +
            "POWER 1 — ADD MENU ITEM:\n" +
            "If the user asks to add a new item to the menu (e.g. 'add Poha to the menu'), respond with ONLY this JSON (no extra text):\n" +
            '{"action":"add_menu_item","name":"...","desc":"...","price":0,"time":0,"veg":true,"category":"Breakfast|Lunch|Snacks|Drinks|Non-veg","icon":"emoji"}\n\n' +
            "POWER 2 — ADD TO CART:\n" +
            "If the user asks to add items to their cart (e.g. 'add 2 masala dosa', 'I want vada pav', 'add chai for me'), respond with ONLY this JSON (no extra text):\n" +
            '{"action":"add_to_cart","items":["Masala Dosa","Masala Chai"],"quantities":[2,1]}\n\n' +
            "IMPORTANT RULES:\n" +
            "- For add_menu_item and add_to_cart, return ONLY the raw JSON, nothing else.\n" +
            "- You can ONLY add items to the cart. You CANNOT place, submit or confirm orders. If the user asks to place/submit/confirm an order, tell them to click the 'My Order' button themselves.\n" +
            "- For all other questions (menu info, recommendations, how to order, etc.), reply normally in friendly text with emojis.\n" +
            "- Keep normal answers short and helpful.\n" +
            "- Categories must be exactly: Breakfast, Lunch, Snacks, Drinks, Non-veg";
    }

    var conversationHistory = [];

    if (aiToggleBtn && aiSidebar) {
        aiToggleBtn.addEventListener('click', function() { aiSidebar.classList.add('open'); });
        closeAiBtn.addEventListener('click', function() { aiSidebar.classList.remove('open'); });

        function formatMessage(text) {
            return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        }

        function addMessage(text, sender) {
            var div = document.createElement('div');
            div.className = 'message ' + (sender === 'user' ? 'user-message' : 'bot-message');
            div.innerHTML = sender === 'bot' ? formatMessage(text) : text;
            chatWindow.appendChild(div);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        async function sendMessage() {
            var text = aiInput.value.trim();
            if (!text) return;

            conversationHistory.push({ role: 'user', content: text });
            addMessage(text, 'user');
            aiInput.value = '';
            aiSend.disabled = true;

            var loadingDiv = document.createElement('div');
            loadingDiv.className = 'message bot-message';
            loadingDiv.innerHTML = 'Thinking... <i class="fas fa-spinner fa-spin"></i>';
            chatWindow.appendChild(loadingDiv);
            chatWindow.scrollTop = chatWindow.scrollHeight;

            try {
                var messages = [{ role: 'system', content: getSystemPrompt() }].concat(conversationHistory);

                var response = await fetch(SERVER + '/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: messages })
                });

                var data = await response.json();
                chatWindow.removeChild(loadingDiv);

                if (data.choices && data.choices[0] && data.choices[0].message) {
                    var reply = data.choices[0].message.content.trim();
                    conversationHistory.push({ role: 'assistant', content: reply });
                    if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);

                    // ---- TRY TO PARSE AS ACTION JSON ----
                    var parsed = null;
                    try {
                        // Strip any accidental markdown fences
                        var cleaned = reply.replace(/```json|```/g, '').trim();
                        parsed = JSON.parse(cleaned);
                    } catch(e) { parsed = null; }

                    if (parsed && parsed.action === 'add_menu_item') {
                        // --- HANDLE ADD MENU ITEM ---
                        addMessage('⏳ Adding <strong>' + parsed.name + '</strong> to the menu...', 'bot');
                        var result = await aiAddMenuItem({
                            name: parsed.name,
                            desc: parsed.desc || '',
                            price: parsed.price || 0,
                            time: parsed.time || 5,
                            veg: parsed.veg !== false,
                            category: parsed.category || 'Snacks',
                            popular: false,
                            icon: parsed.icon || '🍽️'
                        });
                        if (result.success) {
                            addMessage(
                                '✅ Done! <strong>' + result.item.name + '</strong> has been added to the menu for ₹' + result.item.price + '! 🎉 The menu has been refreshed.',
                                'bot'
                            );
                        } else {
                            addMessage('❌ Could not add item: ' + result.message, 'bot');
                        }

                    } else if (parsed && parsed.action === 'add_to_cart') {
                        // --- HANDLE ADD TO CART ---
                        var result = aiAddToCart(parsed.items, parsed.quantities);
                        if (result.added.length > 0) {
                            var summary = result.added.map(i => i.qty + 'x ' + i.name).join(', ');
                            var msg = '🛒 Added to your cart: <strong>' + summary + '</strong>!';
                            if (result.notFound.length > 0) {
                                msg += '<br>⚠️ Could not find: ' + result.notFound.join(', ');
                            }
                            msg += '<br><br>Click <strong>My Order</strong> button at the top to review and place your order 👆';
                            addMessage(msg, 'bot');
                        } else {
                            addMessage('❌ Could not find: ' + result.notFound.join(', ') + '. Please check the item name and try again.', 'bot');
                        }

                    } else {
                        // --- NORMAL TEXT REPLY ---
                        addMessage(reply, 'bot');
                    }

                } else {
                    var errMsg = data.error ? data.error.message : 'No response received.';
                    addMessage('Error: ' + errMsg, 'bot');
                }
            } catch (error) {
                chatWindow.removeChild(loadingDiv);
                addMessage('Connection error! Check your internet connection.', 'bot');
                console.error('Groq AI Error:', error);
            }

            aiSend.disabled = false;
        }
        aiSend.addEventListener('click', sendMessage);
        aiInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // ==========================================
    // 8. INITIALIZE APP
    // ==========================================
    loadLiveMenu();
});