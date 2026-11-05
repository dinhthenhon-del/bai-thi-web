/**
 * checkout.js - Q7: Inline Form Validation with Custom Regex & Simulated Payment API
 * Student: Đinh Thế Nhơn - MSSV: K244060739 - Lớp: K24406
 * Business Web Development - Code BW08
 */

const CheckoutManager = {
    // Custom Regex Definitions required by Q7
    // Định dạng số điện thoại Việt Nam: Bắt đầu 0 hoặc +84, kèm đầu số mạng 3,5,7,8,9 và 8 chữ số
    REGEX_VN_PHONE: /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/,
    
    // Định dạng Email tiêu chuẩn
    REGEX_EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

    STORAGE_KEY_ORDERS: "bw08_custom_orders",

    init: function () {
        this.setupInlineValidation();
    },

    openCheckoutModal: function () {
        const { totalQty, grandTotal } = CartManager.calculateTotal();
        if (totalQty === 0) {
            alert("Giỏ hàng của bạn đang trống! Hãy thêm sản phẩm trước khi thanh toán.");
            return;
        }

        // Close mini-cart
        CartManager.toggleMiniCart(false);

        // Autofill if logged in
        const user = AuthManager.getCurrentUser();
        if (user) {
            document.getElementById("checkout-name").value = user.fullName || "";
            document.getElementById("checkout-phone").value = user.phone || "";
            document.getElementById("checkout-email").value = user.email || "";
            document.getElementById("checkout-address").value = user.address || "";
        }

        document.getElementById("checkout-total-display").textContent = Number(grandTotal).toLocaleString("vi-VN") + " đ";
        document.getElementById("checkout-modal").style.display = "flex";

        // Trigger immediate validation on pre-filled inputs
        this.validateName();
        this.validatePhone();
        this.validateEmail();
        this.validateAddress();
    },

    closeCheckoutModal: function () {
        document.getElementById("checkout-modal").style.display = "none";
    },

    /**
     * Q7: Gắn sự kiện keyup, blur, input để kiểm tra NGAY LẬP TỨC định dạng Regex
     */
    setupInlineValidation: function () {
        const phoneInput = document.getElementById("checkout-phone");
        const emailInput = document.getElementById("checkout-email");
        const nameInput = document.getElementById("checkout-name");
        const addressInput = document.getElementById("checkout-address");

        if (phoneInput) {
            ["keyup", "blur", "input"].forEach(ev => {
                phoneInput.addEventListener(ev, () => this.validatePhone());
            });
        }

        if (emailInput) {
            ["keyup", "blur", "input"].forEach(ev => {
                emailInput.addEventListener(ev, () => this.validateEmail());
            });
        }

        if (nameInput) {
            ["keyup", "blur", "input"].forEach(ev => {
                nameInput.addEventListener(ev, () => this.validateName());
            });
        }

        if (addressInput) {
            ["keyup", "blur", "input"].forEach(ev => {
                addressInput.addEventListener(ev, () => this.validateAddress());
            });
        }
    },

    validatePhone: function () {
        const input = document.getElementById("checkout-phone");
        const feedback = document.getElementById("phone-feedback");
        if (!input || !feedback) return false;

        const val = input.value.trim();
        if (!val) {
            input.className = "form-control input-invalid";
            feedback.className = "form-feedback feedback-invalid";
            feedback.textContent = "Vui lòng nhập số điện thoại.";
            return false;
        }

        if (this.REGEX_VN_PHONE.test(val)) {
            input.className = "form-control input-valid";
            feedback.className = "form-feedback feedback-valid";
            feedback.textContent = "✓ Số điện thoại hợp lệ (Đầu số Việt Nam).";
            return true;
        } else {
            input.className = "form-control input-invalid";
            feedback.className = "form-feedback feedback-invalid";
            feedback.textContent = "✗ Số điện thoại không hợp lệ (Ví dụ: 0985561713 hoặc +84985561713).";
            return false;
        }
    },

    validateEmail: function () {
        const input = document.getElementById("checkout-email");
        const feedback = document.getElementById("email-feedback");
        if (!input || !feedback) return false;

        const val = input.value.trim();
        if (!val) {
            input.className = "form-control input-invalid";
            feedback.className = "form-feedback feedback-invalid";
            feedback.textContent = "Vui lòng nhập địa chỉ email.";
            return false;
        }

        if (this.REGEX_EMAIL.test(val)) {
            input.className = "form-control input-valid";
            feedback.className = "form-feedback feedback-valid";
            feedback.textContent = "✓ Email hợp lệ.";
            return true;
        } else {
            input.className = "form-control input-invalid";
            feedback.className = "form-feedback feedback-invalid";
            feedback.textContent = "✗ Email không đúng định dạng (Ví dụ: ten@domain.com).";
            return false;
        }
    },

    validateName: function () {
        const input = document.getElementById("checkout-name");
        const feedback = document.getElementById("name-feedback");
        if (!input || !feedback) return false;

        const val = input.value.trim();
        if (val.length >= 2) {
            input.className = "form-control input-valid";
            feedback.className = "form-feedback feedback-valid";
            feedback.textContent = "✓ Họ và tên hợp lệ.";
            return true;
        } else {
            input.className = "form-control input-invalid";
            feedback.className = "form-feedback feedback-invalid";
            feedback.textContent = "Vui lòng nhập họ và tên của bạn.";
            return false;
        }
    },

    validateAddress: function () {
        const input = document.getElementById("checkout-address");
        const feedback = document.getElementById("address-feedback");
        if (!input || !feedback) return false;

        const val = input.value.trim();
        if (val.length >= 5) {
            input.className = "form-control input-valid";
            feedback.className = "form-feedback feedback-valid";
            feedback.textContent = "✓ Địa chỉ giao hàng hợp lệ.";
            return true;
        } else {
            input.className = "form-control input-invalid";
            feedback.className = "form-feedback feedback-invalid";
            feedback.textContent = "Vui lòng nhập địa chỉ cụ thể để giao hàng.";
            return false;
        }
    },

    /**
     * Submit Order - Lưu vào LocalStorage với xử lý lỗi nghiêm ngặt (Resolves Codex issue 5)
     */
    processPayment: function (event) {
        event.preventDefault();

        const isNameValid = this.validateName();
        const isPhoneValid = this.validatePhone();
        const isEmailValid = this.validateEmail();
        const isAddressValid = this.validateAddress();

        if (!isNameValid || !isPhoneValid || !isEmailValid || !isAddressValid) {
            alert("Vui lòng hoàn tất đúng các thông tin giao hàng trước khi thanh toán!");
            return;
        }

        const fullName = document.getElementById("checkout-name").value.trim();
        const phone = document.getElementById("checkout-phone").value.trim();
        const email = document.getElementById("checkout-email").value.trim();
        const address = document.getElementById("checkout-address").value.trim();
        const paymentMethod = document.getElementById("checkout-payment-method").value;

        const { totalQty, grandTotal } = CartManager.calculateTotal();
        if (totalQty <= 0) {
            alert("Giỏ hàng đang trống! Vui lòng chọn sản phẩm trước khi thanh toán.");
            return;
        }

        const orderId = "ORD-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);

        // Normalize items array to match carts.xml schema exactly (Resolves Codex issue 4)
        const normalizedItems = Object.values(CartManager.items).map(it => ({
            productId: String(it.productId || it.id),
            id: String(it.productId || it.id),
            productName: it.productName || it.name,
            name: it.productName || it.name,
            color: it.color || "Standard",
            quantity: Number(it.quantity),
            price: Number(it.price),
            subtotal: Number(it.subtotal || (it.price * it.quantity)),
            image: it.image
        }));

        const newOrder = {
            orderId: orderId,
            orderDate: new Date().toISOString(),
            customerName: fullName,
            customerPhone: phone,
            customerEmail: email,
            customerAddress: address,
            paymentMethod: paymentMethod,
            totalAmount: grandTotal,
            status: "Completed",
            items: normalizedItems
        };

        // Q7 Fix: CHỈ xóa giỏ hàng và báo thành công KHI LocalStorage thực sự lưu thành công
        try {
            const listStr = localStorage.getItem(this.STORAGE_KEY_ORDERS);
            const list = listStr ? JSON.parse(listStr) : [];
            list.unshift(newOrder);
            localStorage.setItem(this.STORAGE_KEY_ORDERS, JSON.stringify(list));

            // Kiểm tra xác nhận dữ liệu đã được ghi vào LocalStorage
            const verifySaved = localStorage.getItem(this.STORAGE_KEY_ORDERS);
            if (!verifySaved || !verifySaved.includes(orderId)) {
                throw new Error("Dữ liệu đơn hàng chưa được xác nhận trong bộ nhớ LocalStorage.");
            }
        } catch (saveError) {
            console.error("Lỗi khi lưu đơn hàng vào LocalStorage:", saveError);
            alert(`⚠️ LỖI THANH TOÁN: Không thể lưu đơn hàng vào bộ nhớ (${saveError.message}). Giỏ hàng của bạn vẫn được bảo toàn nguyên vẹn. Vui lòng thử lại!`);
            return; // DỪNG LUỒNG XỬ LÝ NGAY LẬP TỨC - KHÔNG XÓA GIỎ HÀNG
        }

        // Bước này CHỈ CHẠY khi lưu thành công 100%:
        CartManager.clearCart();
        this.closeCheckoutModal();

        alert(`🎉 ĐẶT HÀNG THÀNH CÔNG!\n\nMã đơn hàng: ${orderId}\nKhách hàng: ${fullName}\nSố điện thoại: ${phone}\nTổng tiền: ${grandTotal.toLocaleString("vi-VN")} đ\nPhương thức: ${paymentMethod}\n\nĐơn hàng đã được lưu trữ thành công vào hệ thống!`);
    }
};
