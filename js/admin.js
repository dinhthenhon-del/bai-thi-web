/**
 * admin.js - Q8: Administrator Management Dashboard & Orders Analytics
 * Student: Đinh Thế Nhơn - MSSV: K244060739 - Lớp: K24406
 * Business Web Development - Code BW08
 */

const AdminDashboard = {
    allOrders: [],

    init: function () {
        this.verifyAccess();
    },

    verifyAccess: function () {
        const loginCard = document.getElementById("admin-login-card");
        const dashboardView = document.getElementById("admin-dashboard-view");
        const u = AuthManager.getCurrentUser();

        if (!AuthManager.isAdminOrManager()) {
            if (loginCard) loginCard.style.display = "block";
            if (dashboardView) dashboardView.style.display = "none";
            return;
        }

        if (loginCard) loginCard.style.display = "none";
        if (dashboardView) dashboardView.style.display = "block";

        const staffNameEl = document.getElementById("admin-staff-name");
        if (staffNameEl) {
            staffNameEl.textContent = `${u.fullName} (${u.role} - ${u.department || 'Quản trị'})`;
        }

        this.loadOrdersData();
    },

    handleAdminLogin: function (event) {
        event.preventDefault();
        const email = document.getElementById("admin-login-email").value.trim().toLowerCase();
        const pwd = document.getElementById("admin-login-pwd").value.trim();
        const msg = document.getElementById("admin-login-feedback");

        // Fetch employees.json
        fetch("data/employees.json")
            .then(res => res.json())
            .then(employees => {
                for (const emp of Object.values(employees)) {
                    if (emp.email.toLowerCase() === email && emp.password === pwd) {
                        if (emp.role === "Admin" || emp.role === "Sales Manager") {
                            const userObj = {
                                id: emp.id,
                                fullName: emp.fullName,
                                email: emp.email,
                                role: emp.role,
                                userType: "employee",
                                department: emp.department
                            };
                            AuthManager.setCurrentUser(userObj);
                            msg.className = "form-feedback feedback-valid";
                            msg.textContent = `Chào ${emp.fullName}! Xác thực quản trị viên thành công.`;
                            setTimeout(() => AdminDashboard.verifyAccess(), 500);
                            return;
                        } else {
                            msg.className = "form-feedback feedback-invalid";
                            msg.textContent = `Tài khoản ${emp.fullName} có vai trò ${emp.role}, không có quyền quản trị!`;
                            return;
                        }
                    }
                }

                msg.className = "form-feedback feedback-invalid";
                msg.textContent = "Email hoặc mật khẩu nhân viên quản trị không đúng!";
            })
            .catch(err => {
                // Preloaded check
                if (email === "admin@bw08.com" && pwd === "123") {
                    AuthManager.setCurrentUser({
                        id: "EMP001",
                        fullName: "Trần Thành Công",
                        email: "admin@bw08.com",
                        role: "Admin",
                        userType: "employee"
                    });
                    AdminDashboard.verifyAccess();
                } else {
                    msg.className = "form-feedback feedback-invalid";
                    msg.textContent = "Lỗi kết nối xác thực: " + err.message;
                }
            });
    },

    quickLogin: function (email, pwd) {
        document.getElementById("admin-login-email").value = email;
        document.getElementById("admin-login-pwd").value = pwd;
    },

    loadOrdersData: function () {
        // 1. Load carts.xml
        fetch("data/carts.xml")
            .then(res => {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.text();
            })
            .then(xmlStr => {
                const systemOrders = XMLParser.parseCartsXML(xmlStr);
                this.combineAndRender(systemOrders);
            })
            .catch(err => {
                console.warn("Using preloaded carts.xml:", err);
                const xmlStr = window.PRELOADED_CARTS_XML || "";
                const systemOrders = XMLParser.parseCartsXML(xmlStr);
                this.combineAndRender(systemOrders);
            });
    },

    combineAndRender: function (systemOrders) {
        // 2. Load custom orders from LocalStorage
        let customOrders = [];
        try {
            customOrders = JSON.parse(localStorage.getItem(CheckoutManager.STORAGE_KEY_ORDERS) || "[]");
        } catch (e) {
            customOrders = [];
        }

        // Merge: custom orders first, then system orders
        this.allOrders = [...customOrders, ...systemOrders];

        this.calculateKPIs();
        this.renderTopSellingProducts();
        this.renderOrdersTable(this.allOrders);
    },

    calculateKPIs: function () {
        const totalOrders = this.allOrders.length;
        const totalRevenue = this.allOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

        let totalItemsSold = 0;
        this.allOrders.forEach(o => {
            if (o.items && Array.isArray(o.items)) {
                totalItemsSold += o.items.reduce((s, it) => s + (Number(it.quantity) || 1), 0);
            }
        });

        document.getElementById("kpi-revenue").textContent = Number(totalRevenue).toLocaleString("vi-VN") + " đ";
        document.getElementById("kpi-orders-count").textContent = totalOrders;
        document.getElementById("kpi-items-sold").textContent = `${totalItemsSold} sản phẩm`;
        document.getElementById("kpi-avg-order").textContent = Number(avgOrderValue).toLocaleString("vi-VN") + " đ";
    },

    /**
     * Q8: Render Top Sản Phẩm Bán Chạy Nhất (Resolves Codex issue 4)
     * Thống nhất mã sản phẩm pId, không bao giờ bị 'Sản phẩm #undefined'
     */
    renderTopSellingProducts: function () {
        const container = document.getElementById("top-products-container");
        if (!container) return;

        // Bảng gom nhóm theo Mã sản phẩm (pId)
        const salesMap = {};

        this.allOrders.forEach(o => {
            if (o.items && Array.isArray(o.items)) {
                o.items.forEach(it => {
                    const pId = String(it.productId || it.id || "SP").trim();
                    const pName = it.productName || it.name || `Sản phẩm #${pId}`;
                    const pImg = it.image || "https://via.placeholder.com/60?text=Product";
                    const qty = Number(it.quantity) || 1;
                    const price = Number(it.price) || 0;
                    const subtotal = Number(it.subtotal) || (price * qty);

                    if (!salesMap[pId]) {
                        salesMap[pId] = {
                            id: pId,
                            name: pName,
                            qty: 0,
                            revenue: 0,
                            image: pImg
                        };
                    }
                    salesMap[pId].qty += qty;
                    salesMap[pId].revenue += subtotal;

                    // Nếu trước đó lưu tạm 'Sản phẩm #...', cập nhật tên chính thức khi có
                    if (pName && !pName.includes("undefined") && salesMap[pId].name.startsWith("Sản phẩm #")) {
                        salesMap[pId].name = pName;
                    }
                });
            }
        });

        const sorted = Object.values(salesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

        if (sorted.length === 0) {
            container.innerHTML = `<p style="color:#a0aec0;font-size:13px;">Chưa có dữ liệu sản phẩm bán ra.</p>`;
            return;
        }

        container.innerHTML = "";
        sorted.forEach((p, idx) => {
            const div = document.createElement("div");
            div.className = "top-product-item";
            div.innerHTML = `
                <div class="top-product-rank">#${idx + 1}</div>
                <div style="flex:1;">
                    <div style="font-weight:700;font-size:13.5px;color:#2d3748;line-height:1.3;">${p.name}</div>
                    <div style="font-size:12px;color:#718096;margin-top:2px;">
                        Mã SP: <code>${p.id}</code> &bull; Đã bán: <strong style="color:#38a169;">${p.qty}</strong> cái &bull; Doanh thu: <strong>${Number(p.revenue).toLocaleString("vi-VN")} đ</strong>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    },

    renderOrdersTable: function (ordersList) {
        const tbody = document.getElementById("admin-orders-tbody");
        const countBadge = document.getElementById("orders-table-count");
        if (!tbody) return;

        tbody.innerHTML = "";
        if (countBadge) countBadge.textContent = `${ordersList.length} đơn hàng`;

        if (ordersList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#a0aec0;">Không có đơn hàng nào phù hợp với bộ lọc.</td></tr>`;
            return;
        }

        ordersList.forEach((o, idx) => {
            const tr = document.createElement("tr");
            const dateStr = new Date(o.orderDate).toLocaleDateString("vi-VN");
            const statusClass = o.status === "Completed" ? "status-completed" : (o.status === "Processing" ? "status-processing" : "status-pending");

            // Format items summary
            let itemsSummary = "";
            if (o.items && Array.isArray(o.items)) {
                itemsSummary = o.items.map(it => `${it.quantity}x ${it.productName || it.name} (${it.color || 'Standard'})`).join(", ");
            }

            tr.innerHTML = `
                <td style="text-align:center;font-weight:bold;">${idx + 1}</td>
                <td style="font-weight:bold;color:#2b6cb0;">${o.orderId}</td>
                <td>
                    <div style="font-weight:700;">${o.customerName}</div>
                    <small style="color:#718096;">${o.customerPhone || ''}</small>
                    <div style="font-size:11.5px;color:#a0aec0;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${itemsSummary}">${itemsSummary}</div>
                </td>
                <td>${dateStr}</td>
                <td><span class="status-badge ${statusClass}">${o.status}</span></td>
                <td style="text-align:right;font-weight:bold;color:#e53e3e;">${Number(o.totalAmount).toLocaleString("vi-VN")} đ</td>
                <td style="font-size:12.5px;color:#4a5568;">${o.paymentMethod || 'COD'}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    filterOrdersByStatus: function () {
        const statusVal = document.getElementById("order-status-filter")?.value || "ALL";
        if (statusVal === "ALL") {
            this.renderOrdersTable(this.allOrders);
        } else {
            const filtered = this.allOrders.filter(o => o.status === statusVal);
            this.renderOrdersTable(filtered);
        }
    }
};

document.addEventListener("DOMContentLoaded", function () {
    AdminDashboard.init();
});
