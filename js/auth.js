/**
 * auth.js - Authentication & User Session Manager
 * Student: Đinh Thế Nhơn - MSSV: K244060739 - Lớp: K24406
 * Business Web Development - Code BW08
 */

const AuthManager = {
    STORAGE_KEY_USER: "bw08_current_user",
    STORAGE_KEY_CUSTOMERS: "bw08_customers_data",
    STORAGE_KEY_EMPLOYEES: "bw08_employees_data",

    getCurrentUser: function () {
        try {
            const u = localStorage.getItem(this.STORAGE_KEY_USER);
            return u ? JSON.parse(u) : null;
        } catch (e) {
            return null;
        }
    },

    setCurrentUser: function (user) {
        if (user) {
            localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(user));
        } else {
            localStorage.removeItem(this.STORAGE_KEY_USER);
        }
        this.updateHeaderUserChip();
    },

    logout: function () {
        localStorage.removeItem(this.STORAGE_KEY_USER);
        this.updateHeaderUserChip();
        if (typeof CartManager !== "undefined") {
            CartManager.updateCartBadge();
        }
        alert("Đã đăng xuất tài khoản thành công!");
        window.location.reload();
    },

    getUserCartKey: function () {
        const u = this.getCurrentUser();
        return u && u.id ? `bw08_cart_${u.id}` : "bw08_cart_guest";
    },

    isAdminOrManager: function () {
        const u = this.getCurrentUser();
        if (!u) return false;
        return u.userType === "employee" && (u.role === "Admin" || u.role === "Sales Manager");
    },

    updateHeaderUserChip: function () {
        const chip = document.getElementById("header-user-chip");
        if (!chip) return;
        const u = this.getCurrentUser();
        if (u) {
            const role = u.userType === "employee" ? `[${u.role}]` : `[Khách hàng]`;
            chip.innerHTML = `
                <span>👤 <strong>${u.fullName}</strong> <small style="color:#718096;">${role}</small></span>
                <button type="button" onclick="AuthManager.logout()" style="background:none;border:none;color:#e53e3e;font-size:12px;font-weight:bold;cursor:pointer;margin-left:6px;">Đăng xuất</button>
            `;
        } else {
            chip.innerHTML = `
                <span>Chào, <strong>Khách vãng lai</strong></span>
                <button type="button" onclick="App.openLoginModal()" style="background:none;border:none;color:#3182ce;font-size:12px;font-weight:bold;cursor:pointer;margin-left:6px;">Đăng nhập</button>
            `;
        }
    }
};

