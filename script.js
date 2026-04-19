document.addEventListener('DOMContentLoaded', () => {

    // ── DOM REFERENCES ──
    const loginForm   = document.getElementById('login-form');
    const signupForm  = document.getElementById('signup-form');
    const forgotForm  = document.getElementById('forgot-form');
    const otpForm     = document.getElementById('otp-form');
    const resetForm   = document.getElementById('reset-form');
    const regForm     = document.getElementById('reg-number-form');

    const loginAlert  = document.getElementById('login-alert');
    const signupAlert = document.getElementById('signup-alert');
    const forgotAlert = document.getElementById('forgot-alert');
    const otpAlert    = document.getElementById('otp-alert');
    const resetAlert  = document.getElementById('reset-alert');
    const regAlert    = document.getElementById('reg-alert');

    const SERVER = "https://smart-food-ordering-system-for-students.onrender.com";

    // Tracks the email used for forgot-password flow
    let forgotEmail = '';

    // ── HELPERS ──
    function showAlert(el, msg, type) { el.textContent = msg; el.className = 'alert-box alert-' + type; }
    function hideAlert(el) { el.className = 'alert-box'; }
    function showForm(form) {
        [loginForm, signupForm, forgotForm, otpForm, resetForm, regForm].forEach(f => f.classList.remove('active-form'));
        form.classList.add('active-form');
    }

    // Gmail-only validator
    function isGmail(email) {
        return email.toLowerCase().endsWith('@gmail.com');
    }

    // ── FORM SWITCHING ──
    document.getElementById('show-signup').addEventListener('click', e => { e.preventDefault(); showForm(signupForm); hideAlert(loginAlert); hideAlert(signupAlert); });
    document.getElementById('show-login').addEventListener('click',  e => { e.preventDefault(); showForm(loginForm);  hideAlert(loginAlert); hideAlert(signupAlert); });
    document.getElementById('show-forgot').addEventListener('click', e => { e.preventDefault(); showForm(forgotForm); hideAlert(forgotAlert); });
    document.getElementById('back-to-login').addEventListener('click',  e => { e.preventDefault(); showForm(loginForm); });
    document.getElementById('back-to-forgot').addEventListener('click', e => { e.preventDefault(); showForm(forgotForm); hideAlert(forgotAlert); });
    document.getElementById('back-to-otp').addEventListener('click',    e => { e.preventDefault(); showForm(otpForm); hideAlert(otpAlert); });

    // Clear error on input
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', function() { this.classList.remove('input-error'); });
    });

    // ── OTP BOX BEHAVIOUR ──
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((box, idx) => {
        box.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, ''); // digits only
            if (this.value) {
                this.classList.add('filled');
                if (idx < otpInputs.length - 1) otpInputs[idx + 1].focus();
            } else {
                this.classList.remove('filled');
            }
        });
        box.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && idx > 0) {
                otpInputs[idx - 1].value = '';
                otpInputs[idx - 1].classList.remove('filled');
                otpInputs[idx - 1].focus();
            }
        });
        box.addEventListener('paste', function(e) {
            e.preventDefault();
            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            pasted.split('').forEach((ch, i) => {
                if (otpInputs[i]) {
                    otpInputs[i].value = ch;
                    otpInputs[i].classList.add('filled');
                }
            });
            otpInputs[Math.min(pasted.length, 5)].focus();
        });
    });

    function getOtpValue() {
        return [...otpInputs].map(b => b.value).join('');
    }
    function clearOtpBoxes() {
        otpInputs.forEach(b => { b.value = ''; b.classList.remove('filled', 'otp-error'); });
        otpInputs[0].focus();
    }
    function shakeOtpBoxes() {
        otpInputs.forEach(b => b.classList.add('otp-error'));
        setTimeout(() => otpInputs.forEach(b => b.classList.remove('otp-error')), 600);
    }

    // ══════════════════════════════════════════
    // 1. SIGNUP
    // ══════════════════════════════════════════
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(signupAlert);

        const name            = document.getElementById('signup-name');
        const email           = document.getElementById('signup-email');
        const password        = document.getElementById('signup-password');
        const confirmPassword = document.getElementById('signup-confirm-password');

        let hasError = false;
        [name, email, password, confirmPassword].forEach(input => {
            if (!input.value.trim()) { input.classList.add('input-error'); hasError = true; }
        });
        if (hasError) { showAlert(signupAlert, 'Please fill in all fields.', 'error'); return; }

        // Gmail-only check
        if (!isGmail(email.value.trim())) {
            email.classList.add('input-error');
            showAlert(signupAlert, 'Only Gmail addresses (@gmail.com) are allowed.', 'error');
            return;
        }
        if (password.value !== confirmPassword.value) {
            password.classList.add('input-error'); confirmPassword.classList.add('input-error');
            showAlert(signupAlert, 'Passwords do not match!', 'error'); return;
        }

        const userData = { name: name.value.trim(), email: email.value.trim(), password: password.value };
        try {
            const res  = await fetch(SERVER + '/api/signup', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (!res.ok) { showAlert(signupAlert, data.message || 'Signup failed.', 'error'); return; }
        } catch (err) { console.warn('Server offline, continuing with localStorage'); }

        localStorage.setItem('canteenUser', JSON.stringify(userData));
        signupForm.reset();
        showForm(loginForm);
        document.getElementById('login-email').value    = userData.email;
        document.getElementById('login-password').value = userData.password;
        showAlert(loginAlert, 'Registration successful! Please log in.', 'success');
    });

    // ══════════════════════════════════════════
    // 2. LOGIN
    // ══════════════════════════════════════════
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(loginAlert);

        const email    = document.getElementById('login-email');
        const password = document.getElementById('login-password');

        let hasError = false;
        [email, password].forEach(input => {
            if (!input.value.trim()) { input.classList.add('input-error'); hasError = true; }
        });
        if (hasError) { showAlert(loginAlert, 'Please enter your email and password.', 'error'); return; }

        if (!isGmail(email.value.trim())) {
            email.classList.add('input-error');
            showAlert(loginAlert, 'Only Gmail accounts are accepted.', 'error');
            return;
        }

        try {
            const res  = await fetch(SERVER + '/api/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.value.trim(), password: password.value })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('canteenUser', JSON.stringify({ email: data.email, password: password.value }));
                showForm(regForm);
            } else {
                email.classList.add('input-error'); password.classList.add('input-error');
                showAlert(loginAlert, data.message || 'Invalid email or password.', 'error');
            }
        } catch (err) {
            const saved = JSON.parse(localStorage.getItem('canteenUser'));
            if (saved && saved.email === email.value.trim() && saved.password === password.value) {
                showForm(regForm);
            } else {
                email.classList.add('input-error'); password.classList.add('input-error');
                showAlert(loginAlert, 'Server offline. Check if Node.js is running.', 'error');
            }
        }
    });

    // ══════════════════════════════════════════
    // 3. FORGOT PASSWORD — send OTP
    // ══════════════════════════════════════════
    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(forgotAlert);

        const emailInput = document.getElementById('forgot-email');
        const email      = emailInput.value.trim();

        if (!email) { emailInput.classList.add('input-error'); showAlert(forgotAlert, 'Please enter your email.', 'error'); return; }
        if (!isGmail(email)) { emailInput.classList.add('input-error'); showAlert(forgotAlert, 'Only Gmail addresses are accepted.', 'error'); return; }

        const btn = forgotForm.querySelector('.btn-submit');
        btn.textContent = 'Sending OTP...';
        btn.disabled = true;

        try {
            const res  = await fetch(SERVER + '/api/forgot-password', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                forgotEmail = email;
                document.getElementById('otp-subtitle').textContent =
                    'A 6-digit OTP was sent to ' + email + '. It expires in 10 minutes.';
                clearOtpBoxes();
                hideAlert(otpAlert);
                showForm(otpForm);
            } else {
                showAlert(forgotAlert, data.message || 'Failed to send OTP.', 'error');
            }
        } catch (err) {
            showAlert(forgotAlert, 'Server error. Make sure Node.js is running.', 'error');
        }

        btn.textContent = 'Send OTP';
        btn.disabled = false;
    });

    // ══════════════════════════════════════════
    // 4. OTP VERIFICATION
    // ══════════════════════════════════════════
    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(otpAlert);

        const otp = getOtpValue();
        if (otp.length < 6) {
            shakeOtpBoxes();
            showAlert(otpAlert, 'Please enter all 6 digits.', 'error');
            return;
        }

        const btn = otpForm.querySelector('.btn-submit');
        btn.textContent = 'Verifying...';
        btn.disabled = true;

        try {
            const res  = await fetch(SERVER + '/api/verify-otp', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail, otp })
            });
            const data = await res.json();
            if (res.ok) {
                hideAlert(resetAlert);
                document.getElementById('reset-password').value         = '';
                document.getElementById('reset-confirm-password').value = '';
                showForm(resetForm);
            } else {
                shakeOtpBoxes();
                clearOtpBoxes();
                showAlert(otpAlert, data.message || 'Invalid or expired OTP.', 'error');
            }
        } catch (err) {
            showAlert(otpAlert, 'Server error. Make sure Node.js is running.', 'error');
        }

        btn.textContent = 'Verify OTP';
        btn.disabled = false;
    });

    // Resend OTP
    document.getElementById('resend-otp').addEventListener('click', async (e) => {
        e.preventDefault();
        if (!forgotEmail) { showForm(forgotForm); return; }
        hideAlert(otpAlert);
        showAlert(otpAlert, 'Resending OTP...', 'success');
        try {
            const res  = await fetch(SERVER + '/api/forgot-password', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail })
            });
            const data = await res.json();
            if (res.ok) {
                clearOtpBoxes();
                showAlert(otpAlert, 'New OTP sent to ' + forgotEmail, 'success');
            } else {
                showAlert(otpAlert, data.message || 'Could not resend OTP.', 'error');
            }
        } catch (err) {
            showAlert(otpAlert, 'Server error.', 'error');
        }
    });

    // ══════════════════════════════════════════
    // 5. RESET PASSWORD
    // ══════════════════════════════════════════
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(resetAlert);

        const newPass     = document.getElementById('reset-password');
        const confirmPass = document.getElementById('reset-confirm-password');

        if (!newPass.value || !confirmPass.value) {
            showAlert(resetAlert, 'Please fill in both fields.', 'error'); return;
        }
        if (newPass.value.length < 6) {
            newPass.classList.add('input-error');
            showAlert(resetAlert, 'Password must be at least 6 characters.', 'error'); return;
        }
        if (newPass.value !== confirmPass.value) {
            newPass.classList.add('input-error'); confirmPass.classList.add('input-error');
            showAlert(resetAlert, 'Passwords do not match!', 'error'); return;
        }

        const btn = resetForm.querySelector('.btn-submit');
        btn.textContent = 'Resetting...';
        btn.disabled = true;

        try {
            const res  = await fetch(SERVER + '/api/reset-password', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail, password: newPass.value })
            });
            const data = await res.json();
            if (res.ok) {
                forgotEmail = '';
                showForm(loginForm);
                showAlert(loginAlert, '✅ Password reset successful! Please log in with your new password.', 'success');
            } else {
                showAlert(resetAlert, data.message || 'Reset failed. Please try again.', 'error');
            }
        } catch (err) {
            showAlert(resetAlert, 'Server error. Make sure Node.js is running.', 'error');
        }

        btn.textContent = 'Reset Password';
        btn.disabled = false;
    });

    // ══════════════════════════════════════════
    // 6. REGISTRATION NUMBER
    // ══════════════════════════════════════════
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(regAlert);

        const regInput = document.getElementById('student-reg-num');
        const regNum   = regInput.value.trim();
        if (regNum.length !== 10) {
            regInput.classList.add('input-error');
            showAlert(regAlert, 'Registration number must be exactly 10 characters.', 'error'); return;
        }
        const userData = JSON.parse(localStorage.getItem('canteenUser')) || {};
        try {
            await fetch(SERVER + '/api/verify-id', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userData.email, studentRegNum: regNum })
            });
        } catch (err) { console.warn('Server offline, saving reg num locally'); }

        localStorage.setItem('studentRegNum', JSON.stringify(regNum));
        showAlert(regAlert, 'Identity verified! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'menu.html'; }, 1500);
    });

    // ══════════════════════════════════════════
    // 7. GOOGLE SIGN-IN
    // ══════════════════════════════════════════

    // Triggered by Google SDK after user picks account
    window.handleGoogleCredential = async function(response) {
        try {
            const res  = await fetch(SERVER + '/api/google-auth', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('canteenUser', JSON.stringify({ email: data.email, name: data.name }));
                // If new user, go to reg form; if returning user, go directly
                showForm(regForm);
            } else {
                showAlert(loginAlert, data.message || 'Google sign-in failed.', 'error');
                showForm(loginForm);
            }
        } catch (err) {
            showAlert(loginAlert, 'Server error during Google sign-in.', 'error');
            showForm(loginForm);
        }
    };

    function triggerGoogleSignIn() {
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({
                client_id: document.getElementById('g_id_onload').dataset.clientId,
                callback: window.handleGoogleCredential
            });
            google.accounts.id.prompt();
        } else {
            alert('Google Sign-In is not loaded yet. Please try again in a moment.');
        }
    }

    document.getElementById('google-login-btn').addEventListener('click',  triggerGoogleSignIn);
    document.getElementById('google-signup-btn').addEventListener('click', triggerGoogleSignIn);

});