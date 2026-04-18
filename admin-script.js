// ============================================================
// CanteenGo — Admin Panel Script
// ============================================================

const SERVER = 'https://canteengo.onrender.com';

// Admin credentials verified server-side

// State
var allMenuItems  = [];
var allOrders     = [];
var editingItemId = null;   // null = adding new, number = editing existing
var deletingItemId = null;

// Auto icon state (per modal open)
var iconAutoState = {
    lastAppliedIcon: null
};

function guessIconFromName(name) {
    var text = (name || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return '🍽️';

    var rules = [
        { test: /\b(biryani|biriyani|pulav|pulao)\b/, icon: '🍛' },
        { test: /\b(mutton|lamb|goat)\b/, icon: '🍖' },
        { test: /\b(chicken)\b/, icon: '🍗' },
        { test: /\b(fish|prawn|shrimp)\b/, icon: '🐟' },
        { test: /\b(egg)\b/, icon: '🥚' },
        { test: /\b(dosa)\b/, icon: '🥞' },
        { test: /\b(idli)\b/, icon: '🍚' },
        { test: /\b(noodle|noodles|ramen|chowmein)\b/, icon: '🍜' },
        { test: /\b(fried rice|rice)\b/, icon: '🍚' },
        { test: /\b(paneer|cheese)\b/, icon: '🧀' },
        { test: /\b(paratha|roti|chapati|naan)\b/, icon: '🫓' },
        { test: /\b(burger|sandwich)\b/, icon: '🍔' },
        { test: /\b(pizza)\b/, icon: '🍕' },
        { test: /\b(samosa|puff|pakoda|bajji|vada)\b/, icon: '🥟' },
        { test: /\b(chai|tea)\b/, icon: '☕' },
        { test: /\b(cold coffee|coffee|milkshake|lassi|smoothie|shake)\b/, icon: '🧋' },
        { test: /\b(soda|lime|lemon)\b/, icon: '🥤' },
        { test: /\b(ice cream)\b/, icon: '🍨' },
        { test: /\b(cake|pastry)\b/, icon: '🍰' },
        { test: /\b(salad)\b/, icon: '🥗' }
    ];

    for (var i = 0; i < rules.length; i++) {
        if (rules[i].test.test(text)) return rules[i].icon;
    }
    return '🍽️';
}

function parseRupees(value) {
    if (typeof value === 'number' && isFinite(value)) return value;
    if (typeof value !== 'string') return 0;
    var match = value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    if (!match) return 0;
    var num = Number(match[0]);
    return isFinite(num) ? num : 0;
}

function formatRupees(amount) {
    var n = Number(amount);
    if (!isFinite(n)) n = 0;
    // Keep it simple: show as integer rupees
    var rounded = Math.round(n);
    return '₹' + rounded.toLocaleString('en-IN');
}

function maybeAutoFillIcon() {
    var nameInput = document.getElementById('f-name');
    var iconInput = document.getElementById('f-icon');
    if (!nameInput || !iconInput) return;

    var name = nameInput.value.trim();
    var guessed = guessIconFromName(name);
    var currentIcon = (iconInput.value || '').trim();
    var treatAsAuto = !currentIcon || (iconAutoState.lastAppliedIcon && currentIcon === iconAutoState.lastAppliedIcon);

    if (name && treatAsAuto) {
        iconInput.value = guessed;
        iconAutoState.lastAppliedIcon = guessed;
    }
}

// ============================================================
// 1. LOGIN
// ============================================================
document.getElementById('admin-login-btn').addEventListener('click', handleLogin);
document.getElementById('admin-pass').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') handleLogin();
});

async function handleLogin() {
    var user = document.getElementById('admin-user').value.trim();
    var pass = document.getElementById('admin-pass').value;
    var err  = document.getElementById('login-error');
    var btn  = document.getElementById('admin-login-btn');

    if (!user || !pass) { err.style.display = 'block'; return; }

    btn.textContent = 'Logging in...';
    btn.disabled = true;

    try {
        var res = await fetch(SERVER + '/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        var data = await res.json();
        if (res.ok && data.success) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('admin-layout').style.display = 'flex';
            err.style.display = 'none';
            initAdmin();
        } else {
            err.style.display = 'block';
            document.getElementById('admin-pass').value = '';
        }
    } catch (e) {
        err.style.display = 'block';
    }

    btn.textContent = 'Login';
    btn.disabled = false;
}

// Auto-login if session exists
if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    document.getElementById('login-screen').style.display  = 'none';
    document.getElementById('admin-layout').style.display  = 'flex';
    initAdmin();
}

document.getElementById('admin-logout-btn').addEventListener('click', function() {
    sessionStorage.removeItem('adminLoggedIn');
    location.reload();
});

// ============================================================
// 2. TAB NAVIGATION
// ============================================================
document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
        switchTab(this.getAttribute('data-tab'));
    });
});

function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    document.querySelectorAll('.tab-page').forEach(function(p) { p.classList.remove('active'); });

    document.querySelector('[data-tab="' + tab + '"]').classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');

    if (tab === 'menu')      loadMenuItems();
    if (tab === 'orders')    loadOrders();
    if (tab === 'tokens')    loadTokens();
    if (tab === 'dashboard') loadDashboard();
}

// ============================================================
// 3. INIT
// ============================================================
function initAdmin() {
    loadDashboard();
    loadMenuItems();
}

// ============================================================
// 4. DASHBOARD
// ============================================================
async function loadDashboard() {
    try {
        // Load menu count
        var menuRes = await fetch(SERVER + '/api/menu');
        var menuData = await menuRes.json();
        allMenuItems = menuData;
        document.getElementById('stat-menu-count').textContent = menuData.length;

        // Load orders
        var ordersRes = await fetch(SERVER + '/api/admin/orders');
        var ordersData = await ordersRes.json();
        allOrders = ordersData;

        document.getElementById('stat-total-orders').textContent   = ordersData.length;
        document.getElementById('stat-pending-orders').textContent = ordersData.filter(o => o.status === 'Pending').length;
        var paidOrders = ordersData.filter(o => o.status === 'Paid' || o.status === 'Collected');
        document.getElementById('stat-paid-orders').textContent    = paidOrders.length;

        var incomeEl = document.getElementById('stat-total-income');
        if (incomeEl) {
            var totalIncome = paidOrders.reduce(function(sum, o) {
                return sum + parseRupees(o.total);
            }, 0);
            incomeEl.textContent = formatRupees(totalIncome);
        }

        // Recent orders removed from dashboard

    } catch (err) {
        console.error('Dashboard load error:', err);
        showToast('Could not connect to server', 'error');
    }
}

// ============================================================
// 5. MENU MANAGEMENT
// ============================================================
async function loadMenuItems() {
    document.getElementById('menu-table-body').innerHTML =
        '<tr class="loading-row"><td colspan="8"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    try {
        var res  = await fetch(SERVER + '/api/menu');
        allMenuItems = await res.json();
        renderMenuTable(allMenuItems);
    } catch (err) {
        document.getElementById('menu-table-body').innerHTML =
            '<tr class="empty-row"><td colspan="8">❌ Failed to load menu. Is the server running?</td></tr>';
    }
}

function renderMenuTable(items) {
    document.getElementById('menu-count-label').textContent = items.length + ' Items';
    var tbody = document.getElementById('menu-table-body');
    if (items.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No items found.</td></tr>';
        return;
    }
    tbody.innerHTML = items.map(function(item) {
        return '<tr>' +
            '<td class="item-icon-cell">' + item.icon + '</td>' +
            '<td><span class="item-name">' + item.name + '</span></td>' +
            '<td><span class="badge badge-cat">' + item.category + '</span></td>' +
            '<td><strong style="color:#c0caf5">₹' + item.price + '</strong></td>' +
            '<td>' + item.time + ' min</td>' +
            '<td><span class="badge ' + (item.veg ? 'badge-veg' : 'badge-nonveg') + '">' +
                (item.veg ? '🌿 Veg' : '🍗 Non-Veg') + '</span></td>' +
            '<td>' +
                '<label class="toggle-switch">' +
                    '<input type="checkbox" ' + (item.inStock ? 'checked' : '') +
                    ' onchange="toggleStock(' + item.id + ', this)">' +
                    '<span class="toggle-slider"></span>' +
                '</label>' +
            '</td>' +
            '<td>' +
                '<div class="actions-cell">' +
                    '<button class="btn-edit" onclick="openEditModal(' + item.id + ')"><i class="fas fa-pen"></i> Edit</button>' +
                    '<button class="btn-danger" onclick="openDeleteModal(' + item.id + ', \'' + item.name.replace(/'/g, "\\'") + '\')"><i class="fas fa-trash"></i></button>' +
                '</div>' +
            '</td>' +
        '</tr>';
    }).join('');
}

// Toggle stock directly from table
async function toggleStock(itemId, checkbox) {
    try {
        var res = await fetch(SERVER + '/api/menu/' + itemId + '/toggle-stock', { method: 'PATCH' });
        var data = await res.json();
        showToast(data.inStock ? '✅ Item marked In Stock' : '🔴 Item marked Out of Stock', 'success');
    } catch (err) {
        checkbox.checked = !checkbox.checked; // revert on failure
        showToast('Failed to update stock', 'error');
    }
}

// ── ADD ITEM MODAL ──
document.getElementById('add-item-btn').addEventListener('click', function() {
    editingItemId = null;
    clearForm();
    iconAutoState.lastAppliedIcon = null;
    document.getElementById('modal-title').textContent = 'Add New Item';
    document.getElementById('save-item-btn').innerHTML = '<i class="fas fa-plus"></i> Add Item';
    document.getElementById('item-modal').classList.add('open');
});

document.getElementById('close-item-modal').addEventListener('click', closeItemModal);
document.getElementById('cancel-item-btn').addEventListener('click', closeItemModal);
function closeItemModal() { document.getElementById('item-modal').classList.remove('open'); }

// ── EDIT ITEM MODAL ──
function openEditModal(itemId) {
    var item = allMenuItems.find(function(i) { return i.id === itemId; });
    if (!item) return;
    editingItemId = itemId;

    document.getElementById('f-name').value     = item.name;
    document.getElementById('f-icon').value     = item.icon;
    document.getElementById('f-desc').value     = item.desc || '';
    document.getElementById('f-price').value    = item.price;
    document.getElementById('f-time').value     = item.time;
    document.getElementById('f-category').value = item.category;
    document.getElementById('f-veg').value      = String(item.veg);
    document.getElementById('f-popular').value  = String(item.popular);

    document.getElementById('modal-title').textContent    = 'Edit Item';
    document.getElementById('save-item-btn').innerHTML    = '<i class="fas fa-save"></i> Save Changes';
    document.getElementById('item-modal').classList.add('open');

    // Only treat existing icon as auto if it matches the current guess.
    var guessed = guessIconFromName(item.name);
    var existingIcon = (item.icon || '').trim();
    iconAutoState.lastAppliedIcon = existingIcon && existingIcon === guessed ? existingIcon : null;
}

function clearForm() {
    ['f-name','f-icon','f-desc','f-price','f-time'].forEach(function(id) {
        document.getElementById(id).value = '';
    });
    document.getElementById('f-category').value = 'Breakfast';
    document.getElementById('f-veg').value       = 'true';
    document.getElementById('f-popular').value   = 'false';
}

// Auto-pick icon while typing name (does not override manual icon edits)
(function wireAutoIcon() {
    var nameInput = document.getElementById('f-name');
    var iconInput = document.getElementById('f-icon');
    if (!nameInput || !iconInput) return;

    nameInput.addEventListener('input', maybeAutoFillIcon);
    nameInput.addEventListener('blur', maybeAutoFillIcon);

    iconInput.addEventListener('input', function() {
        var current = (iconInput.value || '').trim();
        if (!current) {
            iconAutoState.lastAppliedIcon = null;
            // If icon was cleared, refill immediately (if name exists)
            maybeAutoFillIcon();
        }
    });
})();

// ── SAVE ITEM (Add or Edit) ──
document.getElementById('save-item-btn').addEventListener('click', async function() {
    var name     = document.getElementById('f-name').value.trim();
    var icon     = document.getElementById('f-icon').value.trim();
    var desc     = document.getElementById('f-desc').value.trim();
    var price    = document.getElementById('f-price').value;
    var time     = document.getElementById('f-time').value;
    var category = document.getElementById('f-category').value;
    var veg      = document.getElementById('f-veg').value === 'true';
    var popular  = document.getElementById('f-popular').value === 'true';

    if (!name || !price || !category) {
        showToast('Name, price and category are required', 'error'); return;
    }

    var payload = { name, desc, price: Number(price), time: Number(time) || 5, veg, category, popular, icon: icon || guessIconFromName(name) || '🍽️' };
    var btn = document.getElementById('save-item-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        var res, data;
        if (editingItemId !== null) {
            // EDIT existing item
            res  = await fetch(SERVER + '/api/menu/' + editingItemId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // ADD new item
            res  = await fetch(SERVER + '/api/menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        data = await res.json();
        if (res.ok) {
            showToast(editingItemId !== null ? '✅ Item updated!' : '✅ Item added!', 'success');
            closeItemModal();
            loadMenuItems();
            loadDashboard();
        } else {
            showToast(data.message || 'Something went wrong', 'error');
        }
    } catch (err) {
        showToast('Server error', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Save Item';
});

// ── DELETE ITEM ──
function openDeleteModal(itemId, itemName) {
    deletingItemId = itemId;
    document.getElementById('delete-item-name').textContent = itemName;
    document.getElementById('delete-modal').classList.add('open');
}
document.getElementById('cancel-delete-btn').addEventListener('click', function() {
    document.getElementById('delete-modal').classList.remove('open');
});
document.getElementById('confirm-delete-btn').addEventListener('click', async function() {
    if (!deletingItemId) return;
    try {
        var res = await fetch(SERVER + '/api/menu/' + deletingItemId, { method: 'DELETE' });
        var data = await res.json();
        if (res.ok) {
            showToast('🗑️ Item deleted!', 'success');
            document.getElementById('delete-modal').classList.remove('open');
            loadMenuItems();
            loadDashboard();
        } else {
            showToast(data.message || 'Delete failed', 'error');
        }
    } catch (err) {
        showToast('Server error', 'error');
    }
});

// ============================================================
// 6. ORDERS
// ============================================================
async function loadOrders() {
    document.getElementById('orders-table-body').innerHTML =
        '<tr class="loading-row"><td colspan="7"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    try {
        var res = await fetch(SERVER + '/api/admin/orders');
        allOrders = await res.json();
        applyOrderFilter();
    } catch (err) {
        document.getElementById('orders-table-body').innerHTML =
            '<tr class="empty-row"><td colspan="7">❌ Failed to load orders.</td></tr>';
    }
}

document.getElementById('order-filter').addEventListener('change', applyOrderFilter);
document.getElementById('refresh-orders-btn').addEventListener('click', loadOrders);

function applyOrderFilter() {
    var filter = document.getElementById('order-filter').value;
    var filtered = filter === 'all' ? allOrders : allOrders.filter(function(o) { return o.status === filter; });
    renderOrdersTable(filtered, 'orders-table-body', false);
}

function renderOrdersTable(orders, tbodyId, compact) {
    var tbody = document.getElementById(tbodyId);
    var colCount = compact ? 5 : 7;
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="' + colCount + '">No orders found.</td></tr>';
        return;
    }
    tbody.innerHTML = orders.map(function(order) {
        var itemSummary = Array.isArray(order.items)
            ? order.items.map(function(i) { return i.qty + 'x ' + i.name; }).join(', ')
            : '—';
        var shortSummary = itemSummary.length > 35 ? itemSummary.substring(0, 35) + '…' : itemSummary;
        var time = order.created_at ? new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

        var actionButtons = '';
        if (!compact) {
            if (order.status === 'Pending') {
                actionButtons =
                    '<button class="btn-accept" onclick="updateOrderStatus(\'' + order.id + '\', \'Approved\', event)"><i class="fas fa-check"></i> Accept</button> ' +
                    '<button class="btn-reject" onclick="updateOrderStatus(\'' + order.id + '\', \'Rejected\', event)"><i class="fas fa-times"></i> Reject</button>';
            } else {
                actionButtons = '<span style="color:#565f89;font-size:12px;">—</span>';
            }
        }

        var row = '<tr style="cursor:pointer" onclick="openOrderModal(\'' + order.id + '\')">' +
            '<td>' + (order.student_email || '—') + '</td>' +
            '<td>' + (order.student_reg_num || '—') + '</td>';

        if (!compact) {
            row += '<td title="' + itemSummary + '">' + shortSummary + '</td>';
        }

        row +=
            '<td><strong style="color:#c0caf5">' + (order.total || '—') + '</strong></td>' +
            '<td><span class="status-badge status-' + order.status + '">' + order.status + '</span></td>' +
            '<td>' + time + '</td>';

        if (!compact) {
            row += '<td onclick="event.stopPropagation()">' + actionButtons + '</td>';
        }

        row += '</tr>';
        return row;
    }).join('');
}

function openOrderModal(orderId) {
    var order = allOrders.find(function(o) { return o.id === orderId; });
    if (!order) return;
    var itemsList = Array.isArray(order.items)
        ? order.items.map(function(i) {
            return '<li><span>' + i.qty + 'x ' + i.name + '</span><span>₹' + (i.price * i.qty) + '</span></li>';
          }).join('')
        : '<li>No items</li>';

    document.getElementById('order-modal-content').innerHTML =
        '<p style="font-size:13px;color:#565f89;margin-bottom:4px">Student</p>' +
        '<p style="color:#c0caf5;margin-bottom:16px">' + order.student_email + '</p>' +
        '<p style="font-size:13px;color:#565f89;margin-bottom:4px">Reg No</p>' +
        '<p style="color:#c0caf5;margin-bottom:16px">' + (order.student_reg_num || '—') + '</p>' +
        '<p style="font-size:13px;color:#565f89;margin-bottom:8px">Items Ordered</p>' +
        '<ul class="order-items-list">' + itemsList + '</ul>' +
        '<div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:12px;border-top:1px solid #292e42">' +
            '<strong style="color:#c0caf5">Total</strong>' +
            '<strong style="color:#ff5722;font-size:16px">' + order.total + '</strong>' +
        '</div>' +
        '<div style="margin-top:16px;text-align:center">' +
            '<span class="status-badge status-' + order.status + '" style="font-size:14px;padding:6px 16px">' + order.status + '</span>' +
        '</div>';

    document.getElementById('order-modal').classList.add('open');
}

document.getElementById('close-order-modal').addEventListener('click', function() {
    document.getElementById('order-modal').classList.remove('open');
});

// ── ACCEPT / REJECT ORDER ──
async function updateOrderStatus(orderId, newStatus, event) {
    if (event) event.stopPropagation();
    try {
        var res = await fetch(SERVER + '/api/orders/' + orderId + '/status', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        var data = await res.json();
        if (res.ok) {
            showToast(newStatus === 'Approved' ? '✅ Order Accepted!' : '❌ Order Rejected!', 'success');
            loadOrders();
            loadDashboard();
        } else {
            showToast(data.message || 'Failed to update order', 'error');
        }
    } catch (err) {
        showToast('Server error', 'error');
    }
}

// ============================================================
// 7. TOKENS
// ============================================================
var allTokens = [];

async function loadTokens() {
    var searchBox = document.getElementById('token-search');
    if (searchBox) searchBox.value = '';
    document.getElementById('tokens-table-body').innerHTML =
        '<tr class="loading-row"><td colspan="7"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
    try {
        var res = await fetch(SERVER + '/api/admin/tokens');
        allTokens = await res.json();
        renderTokensTable(allTokens);
    } catch (err) {
        document.getElementById('tokens-table-body').innerHTML =
            '<tr class="empty-row"><td colspan="7">❌ Failed to load tokens.</td></tr>';
    }
}

document.getElementById('refresh-tokens-btn').addEventListener('click', loadTokens);

function filterTokens(query) {
    var q = query.toLowerCase().trim();
    if (!q) { renderTokensTable(allTokens); return; }
    var filtered = allTokens.filter(function(t) {
        return (t.token_number && t.token_number.toLowerCase().includes(q)) ||
               (t.student_email && t.student_email.toLowerCase().includes(q)) ||
               (t.student_reg_num && t.student_reg_num.toLowerCase().includes(q));
    });
    renderTokensTable(filtered);
}

function renderTokensTable(tokens) {
    var tbody = document.getElementById('tokens-table-body');
    var active = tokens.filter(function(t) { return t.status === 'Paid'; });
    var collected = tokens.filter(function(t) { return t.status === 'Collected'; });
    document.getElementById('tokens-count-label').textContent =
        active.length + ' Active Token' + (active.length !== 1 ? 's' : '') +
        (collected.length > 0 ? ' · ' + collected.length + ' Collected' : '');

    if (!tokens || tokens.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No tokens yet. Tokens appear after customers pay.</td></tr>';
        return;
    }

    // Sort: Paid first, then Collected
    var sorted = active.concat(collected);

    tbody.innerHTML = sorted.map(function(order) {
        var itemSummary = Array.isArray(order.items)
            ? order.items.map(function(i) { return i.qty + 'x ' + i.name; }).join(', ')
            : '—';
        var shortSummary = itemSummary.length > 40 ? itemSummary.substring(0, 40) + '…' : itemSummary;
        var time = order.created_at
            ? new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
            : '—';
        var tokenDisplay = order.token_number
            ? '<span class="token-badge">' + order.token_number + '</span>'
            : '<span style="color:#565f89">—</span>';
        var actionBtn = order.status === 'Paid'
            ? '<button class="btn-collected" onclick="markCollected(\'' + order.id + '\', event)"><i class="fas fa-check-double"></i> Mark Collected</button>'
            : '<span class="status-badge status-Collected">✔ Collected</span>';

        return '<tr>' +
            '<td>' + tokenDisplay + '</td>' +
            '<td>' + (order.student_email || '—') + '</td>' +
            '<td>' + (order.student_reg_num || '—') + '</td>' +
            '<td title="' + itemSummary + '">' + shortSummary + '</td>' +
            '<td><strong style="color:#c0caf5">' + (order.total || '—') + '</strong></td>' +
            '<td>' + time + '</td>' +
            '<td>' + actionBtn + '</td>' +
        '</tr>';
    }).join('');
}

async function markCollected(orderId, event) {
    if (event) event.stopPropagation();
    try {
        var res = await fetch(SERVER + '/api/orders/' + orderId + '/collected', { method: 'PATCH' });
        var data = await res.json();
        if (res.ok) {
            showToast('✅ Token marked as Collected!', 'success');
            loadTokens();
            loadDashboard();
        } else {
            showToast(data.message || 'Failed to update', 'error');
        }
    } catch (err) {
        showToast('Server error', 'error');
    }
}

// ============================================================
// 8. TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type + ' show';
    setTimeout(function() { toast.className = 'toast'; }, 3000);
}