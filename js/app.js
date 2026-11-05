/**
 * app.js - Main Application Orchestrator (Code BW08)
 * Student: Đinh Thế Nhơn - MSSV: K244060739 - Lớp: K24406
 * Business Web Development - Lecturer: TS. Trần Duy Thanh (UEL)
 */

const App = {
    products: [],
    reviewsMap: {},
    ratingsMap: {},
    employees: {},
    customers: {},

    init: function () {
        AuthManager.updateHeaderUserChip();
        CartManager.init();
        CheckoutManager.init();
        SearchManager.init();

        this.loadInitialData();
    },

    getAllProducts: function () {
        return this.products;
    },

    getProductById: function (id) {
        return this.products.find(p => String(p.id) === String(id));
    },

    getRatingsMap: function () {
        return this.ratingsMap;
    },

    /**
     * AJAX Fetch with safety timeout (Mandatory for Q1, Q5)
     */
    fetchWithTimeout: function (url, timeoutMs = 2500) {
        return Promise.race([
            fetch(url),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout " + timeoutMs + "ms")), timeoutMs)
            )
        ]);
    },

    /**
     * Load products.xml and reviews.xml via real AJAX
     */
    loadInitialData: function () {
        const statusBox = document.getElementById("status-badge");
        if (statusBox) {
            statusBox.textContent = "Connecting via AJAX fetch()...";
            statusBox.style.color = "#3182ce";
        }

        // 1. Fetch products.xml
        const loadProducts = this.fetchWithTimeout("data/products.xml", 2500)
            .then(res => {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.text();
            })
            .catch(err => {
                console.warn("AJAX products.xml error, using preloaded fallback XML:", err.message);
                return window.PRELOADED_PRODUCTS_XML || "";
            });

        // 2. Fetch reviews.xml
        const loadReviews = this.fetchWithTimeout("data/reviews.xml", 2500)
            .then(res => {
                if (!res.ok) throw new Error("HTTP " + res.status);
                return res.text();
            })
            .catch(err => {
                console.warn("AJAX reviews.xml error, using preloaded fallback XML:", err.message);
                return window.PRELOADED_REVIEWS_XML || "";
            });

        // 3. Fetch employees and customers
        const loadEmployees = this.fetchWithTimeout("data/employees.json", 2500)
            .then(res => res.json())
            .catch(() => ({}));

        const loadCustomers = this.fetchWithTimeout("data/customers.json", 2500)
            .then(res => res.json())
            .catch(() => ({}));

        Promise.all([loadProducts, loadReviews, loadEmployees, loadCustomers])
            .then(([prodXml, revXml, emps, custs]) => {
                // Parse products
                this.products = XMLParser.parseProductsXML(prodXml);

                // Parse reviews and compute average ratings
                this.reviewsMap = XMLParser.parseReviewsXML(revXml);
                this.ratingsMap = XMLParser.computeAverageRatings(this.reviewsMap);

                this.employees = emps;
                this.customers = custs;

                // Hide skeleton loading and render products
                this.hideSkeletonLoading();
                this.renderProducts(this.products);

                // Attach Event Delegation (Q4)
                const container = document.getElementById("products-grid");
                CartManager.setupEventDelegation(container);

                if (statusBox) {
                    statusBox.textContent = `✓ Đã nạp ${this.products.length} sản phẩm từ products.xml & ${Object.keys(this.ratingsMap).length} đánh giá từ reviews.xml (AJAX)`;
                    statusBox.style.color = "#2f855a";
                }
            })
            .catch(err => {
                console.error("Critical loading error:", err);
                this.hideSkeletonLoading();
                if (statusBox) {
                    statusBox.textContent = "Lỗi nạp dữ liệu: " + err.message;
                    statusBox.style.color = "#e53e3e";
                }
            });
    },

    hideSkeletonLoading: function () {
        const skeleton = document.getElementById("skeleton-container");
        if (skeleton) skeleton.style.display = "none";
        const grid = document.getElementById("products-grid");
        if (grid) grid.style.display = "grid";
    },

    /**
     * Q3: Render products grid
     * Q5: Tạo thẻ <span> số sao trung bình chèn lên ảnh sản phẩm
     */
    renderProducts: function (productsList) {
        const grid = document.getElementById("products-grid");
        const countEl = document.getElementById("results-count-text");
        if (!grid) return;

        grid.innerHTML = "";

        if (countEl) {
            countEl.textContent = `Hiển thị ${productsList.length} trên tổng số ${this.products.length} sản phẩm`;
        }

        if (productsList.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; color: #a0aec0; background: #fff; border-radius: 12px; border: 1px dashed #cbd5e0;">
                    <div style="font-size: 40px; margin-bottom: 10px;">🔍</div>
                    <h3 style="color:#4a5568;">Không tìm thấy sản phẩm nào phù hợp!</h3>
                    <p style="font-size: 13.5px; margin-top: 6px;">Vui lòng thử bỏ bớt bộ lọc hoặc chọn từ khóa khác.</p>
                </div>
            `;
            return;
        }

        productsList.forEach(prod => {
            const article = document.createElement("article");
            article.className = "product-card";

            // Rating info from reviews.xml
            const rInfo = this.ratingsMap[prod.id];
            const avgScore = rInfo ? rInfo.avgRating : (prod.baseRating ? prod.baseRating.rate : 4.0);
            const reviewCount = rInfo ? rInfo.count : (prod.baseRating ? prod.baseRating.count : 0);

            // First color variant
            const defaultVariant = prod.colors && prod.colors.length > 0 ? prod.colors[0] : "Standard";

            // Color dots preview
            let colorDotsHtml = "";
            if (prod.colors && prod.colors.length > 0) {
                colorDotsHtml = prod.colors.map(c => {
                    const bg = c.toLowerCase() === "gold" ? "#d69e2e" : (c.toLowerCase() === "silver" ? "#a0aec0" : c.toLowerCase());
                    return `<span class="color-dot" style="background-color: ${bg};" title="${c}"></span>`;
                }).join("");
            }

            article.innerHTML = `
                <div class="product-img-wrapper">
                    <!-- Q5: <span> rating badge chèn lên ảnh -->
                    <span class="rating-badge" data-id="${prod.id}" title="Bấm để xem chi tiết đánh giá từ khách hàng">
                        ★ ${avgScore} <small style="color:#718096;font-size:10px;">(${reviewCount})</small>
                    </span>
                    <img src="${prod.image}" alt="${prod.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <div class="product-category">${prod.category}</div>
                    <h3 class="product-name" title="${prod.name}">${prod.name}</h3>
                    <div class="product-price-row">
                        <div class="product-price">${Number(prod.price).toLocaleString("vi-VN")} đ</div>
                        <div class="product-stock">Kho: ${prod.stock} cái</div>
                    </div>
                    <div class="product-colors-preview">
                        <small style="color:#718096;font-size:11px;margin-right:4px;">Màu:</small>
                        ${colorDotsHtml}
                    </div>
                    <!-- Q4: Buttons with data-id and data-variant -->
                    <div class="product-card-actions">
                        <button type="button" class="btn-add-cart" data-id="${prod.id}" data-variant="${defaultVariant}">
                            🛒 Thêm vào giỏ
                        </button>
                        <button type="button" class="btn-quick-view" data-id="${prod.id}" data-variant="${defaultVariant}">
                            👁 Xem nhanh
                        </button>
                    </div>
                </div>
            `;

            grid.appendChild(article);
        });
    },

    /**
     * Q4: Quick View Modal
     */
    openQuickViewModal: function (productId, defaultVariant) {
        const prod = this.getProductById(productId);
        if (!prod) return;

        const modal = document.getElementById("quick-view-modal");
        const body = document.getElementById("quick-view-body");
        if (!modal || !body) return;

        const rInfo = this.ratingsMap[prod.id];
        const avgScore = rInfo ? rInfo.avgRating : 4.5;
        const count = rInfo ? rInfo.count : 0;

        let colorOptions = "";
        prod.colors.forEach((c, idx) => {
            const checked = (c === defaultVariant || idx === 0) ? "checked" : "";
            colorOptions += `
                <label style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid #cbd5e0;border-radius:6px;font-size:13px;font-weight:600;">
                    <input type="radio" name="modal-variant-color" value="${c}" ${checked}> ${c}
                </label>
            `;
        });

        body.innerHTML = `
            <div style="display:flex;gap:24px;flex-wrap:wrap;">
                <div style="flex:1;min-width:240px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:12px;padding:20px;border:1px solid #e2e8f0;">
                    <img src="${prod.image}" alt="${prod.name}" style="max-height:240px;max-width:100%;object-fit:contain;">
                </div>
                <div style="flex:1.4;min-width:280px;display:flex;flex-direction:column;">
                    <span style="font-size:11px;font-weight:bold;color:#718096;text-transform:uppercase;">${prod.category}</span>
                    <h2 style="font-size:18px;color:#1a202c;margin:6px 0 10px;">${prod.name}</h2>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                        <span style="background:#fffaf0;color:#dd6b20;font-weight:bold;padding:2px 8px;border-radius:12px;border:1px solid #f6ad55;font-size:12px;">
                            ★ ${avgScore} (${count} đánh giá)
                        </span>
                        <span style="color:#38a169;font-size:12.5px;font-weight:600;">Tồn kho: ${prod.stock} sản phẩm</span>
                    </div>
                    <div style="font-size:22px;font-weight:800;color:#e53e3e;margin-bottom:14px;">
                        ${Number(prod.price).toLocaleString("vi-VN")} đ
                    </div>
                    <p style="font-size:13px;color:#4a5568;line-height:1.5;margin-bottom:16px;">
                        ${prod.description}
                    </p>
                    <div style="margin-bottom:16px;">
                        <label style="display:block;font-size:12px;font-weight:bold;color:#4a5568;margin-bottom:6px;">CHỌN MÀU SẮC:</label>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            ${colorOptions}
                        </div>
                    </div>
                    <div style="margin-bottom:20px;display:flex;align-items:center;gap:12px;">
                        <label style="font-size:12px;font-weight:bold;color:#4a5568;">SỐ LƯỢNG:</label>
                        <input type="number" id="modal-qty-input" value="1" min="1" max="${prod.stock}" style="width:70px;padding:6px;border:1px solid #cbd5e0;border-radius:6px;text-align:center;font-weight:bold;">
                    </div>
                    <div style="display:flex;gap:10px;margin-top:auto;">
                        <button type="button" class="btn btn-primary" onclick="App.addModalItemToCart('${prod.id}')" style="padding:12px 20px;">
                            🛒 Thêm vào giỏ hàng
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="App.openRatingDetailModal('${prod.id}')">
                            ★ Xem đánh giá
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = "flex";
    },

    addModalItemToCart: function (productId) {
        const selectedRadio = document.querySelector('input[name="modal-variant-color"]:checked');
        const color = selectedRadio ? selectedRadio.value : "Standard";
        const qtyInput = document.getElementById("modal-qty-input");
        const qty = parseInt(qtyInput ? qtyInput.value : "1", 10);

        if (isNaN(qty) || qty <= 0) {
            alert("Số lượng phải là số nguyên dương lớn hơn 0!");
            return;
        }

        // Q6: Only close modal if adding to cart passes stock and quantity checks!
        if (CartManager.addItem(productId, color, qty)) {
            this.closeModal("quick-view-modal");
            CartManager.toggleMiniCart(true);
        }
    },

    /**
     * Q5: Rating Detail Modal - Hiển thị danh sách khách hàng đã rating cho sản phẩm
     */
    openRatingDetailModal: function (productId) {
        const prod = this.getProductById(productId);
        if (!prod) return;

        const modal = document.getElementById("rating-detail-modal");
        const body = document.getElementById("rating-detail-body");
        const title = document.getElementById("rating-detail-title");
        if (!modal || !body) return;

        title.textContent = `Đánh giá sản phẩm: ${prod.name}`;

        const reviews = this.reviewsMap[productId] || [];
        const rInfo = this.ratingsMap[productId];
        const avg = rInfo ? rInfo.avgRating : 4.5;

        if (reviews.length === 0) {
            body.innerHTML = `
                <div style="text-align:center;padding:30px;color:#a0aec0;">
                    <p>Chưa có đánh giá nào cho sản phẩm này.</p>
                </div>
            `;
        } else {
            let listHtml = "";
            reviews.forEach(r => {
                const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
                listHtml += `
                    <div style="padding:14px;border-bottom:1px solid #edf2f7;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <strong style="color:#2d3748;">👤 ${r.customerName}</strong>
                            <span style="color:#718096;font-size:12px;">📅 ${r.date}</span>
                        </div>
                        <div style="color:#dd6b20;font-size:14px;margin-bottom:6px;">${stars} (${r.rating}/5)</div>
                        <p style="color:#4a5568;font-size:13.5px;">"${r.comment}"</p>
                    </div>
                `;
            });

            body.innerHTML = `
                <div style="background:#fffaf0;padding:16px;border-radius:10px;border:1px solid #f6ad55;margin-bottom:18px;display:flex;align-items:center;gap:16px;">
                    <div style="font-size:36px;font-weight:800;color:#dd6b20;">${avg}</div>
                    <div>
                        <div style="color:#dd6b20;font-size:18px;">${"★".repeat(Math.round(avg))}</div>
                        <div style="font-size:12.5px;color:#744210;">Dựa trên <strong>${reviews.length}</strong> đánh giá thực tế từ khách hàng (phân tích từ <code>reviews.xml</code> bằng DOMParser)</div>
                    </div>
                </div>
                <div style="max-height:360px;overflow-y:auto;">
                    ${listHtml}
                </div>
            `;
        }

        modal.style.display = "flex";
    },

    openLoginModal: function () {
        document.getElementById("login-modal").style.display = "flex";
    },

    handleLoginSubmit: function (event) {
        event.preventDefault();
        const email = document.getElementById("login-email").value.trim().toLowerCase();
        const pwd = document.getElementById("login-password").value.trim();
        const msg = document.getElementById("login-feedback-msg");

        // 1. Check Employees (Admin / Sales Manager)
        for (const emp of Object.values(this.employees)) {
            if (emp.email.toLowerCase() === email && emp.password === pwd) {
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
                msg.textContent = `Xin chào ${emp.fullName}! Đăng nhập thành công.`;
                setTimeout(() => {
                    this.closeModal("login-modal");
                    CartManager.loadFromStorage();
                    CartManager.updateCartBadge();
                }, 600);
                return;
            }
        }

        // 2. Check Customers
        for (const cust of Object.values(this.customers)) {
            if (cust.email.toLowerCase() === email && cust.password === pwd) {
                const userObj = {
                    id: cust.id,
                    fullName: cust.fullName,
                    email: cust.email,
                    phone: cust.phone,
                    address: cust.address,
                    userType: "customer"
                };
                AuthManager.setCurrentUser(userObj);
                msg.className = "form-feedback feedback-valid";
                msg.textContent = `Xin chào ${cust.fullName}! Đăng nhập thành công.`;
                setTimeout(() => {
                    this.closeModal("login-modal");
                    CartManager.loadFromStorage();
                    CartManager.updateCartBadge();
                }, 600);
                return;
            }
        }

        msg.className = "form-feedback feedback-invalid";
        msg.textContent = "Email hoặc mật khẩu không chính xác! Hãy chọn tài khoản mẫu bên dưới.";
    },

    fillDemoAccount: function (email, pwd) {
        document.getElementById("login-email").value = email;
        document.getElementById("login-password").value = pwd;
    },

    closeModal: function (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = "none";
    }
};

// Bootstrap app on DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
    App.init();
});
