/**
 * cart.js - Q4 & Q6: Shopping Cart State Management & UI Event Delegation
 * Student: Đinh Thế Nhơn - MSSV: K244060739 - Lớp: K24406
 * Business Web Development - Code BW08
 */

const CartManager = {
    // Q6: Đối tượng (Object) trong JavaScript để lưu trữ trạng thái giỏ hàng
    items: {},

    init: function () {
        this.loadFromStorage();
        this.updateCartBadge();
    },

    loadFromStorage: function () {
        try {
            const key = AuthManager.getUserCartKey();
            const data = localStorage.getItem(key);
            this.items = data ? JSON.parse(data) : {};
        } catch (e) {
            this.items = {};
        }
    },

    saveToStorage: function () {
        const key = AuthManager.getUserCartKey();
        localStorage.setItem(key, JSON.stringify(this.items));
        this.updateCartBadge();
    },

    /**
     * Q6: Cập nhật giỏ hàng: kiểm tra số lượng dương và tồn kho (Resolves Codex issue 2)
     */
    addItem: function (productId, variantColor, quantity = 1) {
        const product = App.getProductById(productId);
        if (!product) {
            alert("Không tìm thấy sản phẩm trong hệ thống!");
            return false;
        }

        // 1. Kiểm tra số lượng hợp lệ là số nguyên dương > 0
        const parsedQty = parseInt(quantity, 10);
        if (isNaN(parsedQty) || parsedQty <= 0) {
            alert("⚠️ Lỗi: Số lượng sản phẩm thêm vào giỏ phải là số nguyên dương lớn hơn 0!");
            return false;
        }

        // Unique item key based on product id + variant color
        const itemKey = `${productId}_${variantColor}`;
        const currentQtyInCart = this.items[itemKey] ? Number(this.items[itemKey].quantity) : 0;
        const stockLimit = Number(product.stock) || 0;

        // 2. Chặn vượt quá tồn kho (tính cả lượng đã có trong giỏ hàng)
        if (currentQtyInCart + parsedQty > stockLimit) {
            const remainingAllowed = Math.max(0, stockLimit - currentQtyInCart);
            if (remainingAllowed === 0) {
                alert(`⚠️ Tồn kho không đủ: Sản phẩm "${product.name}" (${variantColor}) đã có ${currentQtyInCart} cái trong giỏ, đạt mức tồn kho tối đa (${stockLimit} cái)!`);
            } else {
                alert(`⚠️ Tồn kho không đủ: Bạn đã có ${currentQtyInCart} cái trong giỏ. Chỉ có thể thêm tối đa ${remainingAllowed} cái nữa (Tồn kho: ${stockLimit} cái)!`);
            }
            return false;
        }

        // 3. Thống nhất cấu trúc dữ liệu Item (Resolves Codex issue 4)
        if (this.items[itemKey]) {
            this.items[itemKey].quantity += parsedQty;
            this.items[itemKey].subtotal = this.items[itemKey].quantity * this.items[itemKey].price;
        } else {
            this.items[itemKey] = {
                productId: String(product.id),
                id: String(product.id),
                productName: product.name,
                name: product.name,
                price: Number(product.price),
                image: product.image,
                color: variantColor,
                quantity: parsedQty,
                subtotal: Number(product.price) * parsedQty
            };
        }

        this.saveToStorage();
        this.renderMiniCart();

        this.showToast(`✓ Đã thêm ${parsedQty}x "${product.name}" (${variantColor}) vào giỏ hàng!`);
        return true;
    },

    updateQty: function (itemKey, delta) {
        if (!this.items[itemKey]) return;
        const item = this.items[itemKey];
        const product = App.getProductById(item.productId || item.id);
        const stockLimit = product ? Number(product.stock) : 999;

        const newQty = item.quantity + delta;
        if (newQty <= 0) {
            if (confirm(`Xóa sản phẩm "${item.productName || item.name}" (${item.color}) khỏi giỏ hàng?`)) {
                delete this.items[itemKey];
            } else {
                return;
            }
        } else if (newQty > stockLimit) {
            alert(`⚠️ Số lượng vượt quá tồn kho khả dụng (${stockLimit} sản phẩm)!`);
            return;
        } else {
            item.quantity = newQty;
            item.subtotal = item.quantity * item.price;
        }

        this.saveToStorage();
        this.renderMiniCart();
    },

    removeItem: function (itemKey) {
        if (this.items[itemKey]) {
            delete this.items[itemKey];
            this.saveToStorage();
            this.renderMiniCart();
        }
    },

    clearCart: function () {
        this.items = {};
        this.saveToStorage();
        this.renderMiniCart();
    },

    calculateTotal: function () {
        let totalQty = 0;
        let grandTotal = 0;

        for (const item of Object.values(this.items)) {
            totalQty += Number(item.quantity);
            grandTotal += Number(item.subtotal);
        }

        return {
            totalQty: totalQty,
            grandTotal: grandTotal
        };
    },

    updateCartBadge: function () {
        const badge = document.getElementById("header-cart-badge");
        if (!badge) return;
        const { totalQty } = this.calculateTotal();
        badge.textContent = totalQty;
    },

    /**
     * Q6: Render BẢNG Mini-cart hiển thị đè lên màn hình (position: absolute & z-index)
     * Trình bày dưới dạng Table có đầy đủ các cột (Resolves Codex issue 3)
     */
    renderMiniCart: function () {
        const overlay = document.getElementById("mini-cart-overlay");
        const body = document.getElementById("mini-cart-body");
        const totalEl = document.getElementById("mini-cart-total");
        if (!overlay || !body || !totalEl) return;

        const itemsList = Object.entries(this.items);
        const { grandTotal, totalQty } = this.calculateTotal();

        totalEl.textContent = Number(grandTotal).toLocaleString("vi-VN") + " đ";

        if (itemsList.length === 0) {
            body.innerHTML = `
                <div style="text-align: center; padding: 30px 10px; color: #a0aec0;">
                    <div style="font-size: 36px; margin-bottom: 8px;">🛒</div>
                    <p style="font-weight: 600;">Giỏ hàng của bạn đang trống</p>
                    <small>Hãy chọn sản phẩm yêu thích và bấm "Thêm vào giỏ"!</small>
                </div>
            `;
            return;
        }

        // Q6 Requirement: BẢNG Mini-cart
        let rowsHtml = "";
        itemsList.forEach(([key, item], idx) => {
            const pName = item.productName || item.name;
            rowsHtml += `
                <tr style="border-bottom:1px solid #edf2f7;">
                    <td style="text-align:center;padding:8px 4px;">
                        <img src="${item.image}" alt="${pName}" style="width:40px;height:40px;object-fit:contain;border:1px solid #e2e8f0;border-radius:4px;padding:2px;background:#fff;">
                    </td>
                    <td style="padding:8px 6px;">
                        <div style="font-weight:700;font-size:12.5px;color:#2d3748;line-height:1.3;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${pName}">
                            ${pName}
                        </div>
                        <small style="color:#718096;font-size:11px;">Màu: <strong>${item.color}</strong></small>
                    </td>
                    <td style="text-align:right;font-size:12px;color:#4a5568;padding:8px 6px;white-space:nowrap;">
                        ${Number(item.price).toLocaleString("vi-VN")} đ
                    </td>
                    <td style="text-align:center;padding:8px 4px;white-space:nowrap;">
                        <div style="display:inline-flex;align-items:center;gap:3px;">
                            <button type="button" onclick="CartManager.updateQty('${key}', -1)" style="width:20px;height:20px;font-weight:bold;cursor:pointer;border:1px solid #cbd5e0;background:#edf2f7;border-radius:3px;font-size:11px;">-</button>
                            <span style="font-size:12px;font-weight:bold;min-width:18px;text-align:center;">${item.quantity}</span>
                            <button type="button" onclick="CartManager.updateQty('${key}', 1)" style="width:20px;height:20px;font-weight:bold;cursor:pointer;border:1px solid #cbd5e0;background:#edf2f7;border-radius:3px;font-size:11px;">+</button>
                        </div>
                    </td>
                    <td style="text-align:right;font-weight:bold;color:#e53e3e;font-size:12.5px;padding:8px 6px;white-space:nowrap;">
                        ${Number(item.subtotal).toLocaleString("vi-VN")} đ
                    </td>
                    <td style="text-align:center;padding:8px 4px;">
                        <button type="button" onclick="CartManager.removeItem('${key}')" style="background:none;border:none;color:#e53e3e;font-size:16px;cursor:pointer;font-weight:bold;" title="Xóa món này">&times;</button>
                    </td>
                </tr>
            `;
        });

        body.innerHTML = `
            <table class="mini-cart-table" style="width:100%;border-collapse:collapse;font-size:12.5px;">
                <thead>
                    <tr style="background:#f7fafc;color:#4a5568;font-size:11px;text-transform:uppercase;border-bottom:2px solid #e2e8f0;">
                        <th style="padding:6px 4px;text-align:center;width:48px;">Ảnh</th>
                        <th style="padding:6px 6px;text-align:left;">Sản phẩm</th>
                        <th style="padding:6px 6px;text-align:right;width:75px;">Đơn giá</th>
                        <th style="padding:6px 4px;text-align:center;width:65px;">SL</th>
                        <th style="padding:6px 6px;text-align:right;width:85px;">Thành tiền</th>
                        <th style="padding:6px 4px;text-align:center;width:30px;">Xóa</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;
    },

    toggleMiniCart: function (forceState) {
        const overlay = document.getElementById("mini-cart-overlay");
        if (!overlay) return;

        if (forceState !== undefined) {
            overlay.style.display = forceState ? "flex" : "none";
        } else {
            overlay.style.display = overlay.style.display === "flex" ? "none" : "flex";
        }

        if (overlay.style.display === "flex") {
            this.renderMiniCart();
        }
    },

    /**
     * Q4: EVENT DELEGATION
     * Gắn duy nhất 1 Event Listener trên container cha #products-grid
     */
    setupEventDelegation: function (containerElement) {
        if (!containerElement) return;

        containerElement.addEventListener("click", function (event) {
            // 1. Thêm vào giỏ hàng
            const btnAdd = event.target.closest(".btn-add-cart");
            if (btnAdd) {
                event.preventDefault();
                const productId = btnAdd.getAttribute("data-id");
                const variantColor = btnAdd.getAttribute("data-variant") || "Standard";
                if (CartManager.addItem(productId, variantColor, 1)) {
                    CartManager.toggleMiniCart(true);
                }
                return;
            }

            // 2. Xem nhanh sản phẩm
            const btnQuick = event.target.closest(".btn-quick-view");
            if (btnQuick) {
                event.preventDefault();
                const productId = btnQuick.getAttribute("data-id");
                const variantColor = btnQuick.getAttribute("data-variant") || "Standard";
                App.openQuickViewModal(productId, variantColor);
                return;
            }

            // 3. Xem chi tiết đánh giá từ thẻ span rating
            const ratingBadge = event.target.closest(".rating-badge");
            if (ratingBadge) {
                event.preventDefault();
                const productId = ratingBadge.getAttribute("data-id");
                App.openRatingDetailModal(productId);
                return;
            }
        });

        console.log("✓ Event Delegation setup complete on parent container #products-grid");
    },

    showToast: function (msg) {
        let toast = document.getElementById("cart-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "cart-toast";
            toast.style.cssText = "position:fixed;bottom:24px;right:24px;background:#2d3748;color:#fff;padding:12px 20px;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,0.2);z-index:9999;font-size:13.5px;font-weight:600;display:none;";
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.display = "block";
        setTimeout(() => { toast.style.display = "none"; }, 2500);
    }
};
