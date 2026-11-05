/**
 * search.js - Q2: Advanced Search Form & Multi-criteria Filtering
 * Student: Đinh Thế Nhơn - MSSV: K244060739 - Lớp: K24406
 * Business Web Development - Code BW08
 */

const SearchManager = {
    init: function () {
        this.setupFormListeners();
    },

    setupFormListeners: function () {
        const form = document.getElementById("advanced-search-form");
        if (!form) return;

        // Listen to form submit with HTML5 Validation check (Resolves Codex issue 1)
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (SearchManager.validatePriceRange()) {
                SearchManager.applyFilters();
            }
        });

        // Price inputs validation on change / input
        const minPriceInput = document.getElementById("search-min-price");
        const maxPriceInput = document.getElementById("search-max-price");

        if (minPriceInput) {
            minPriceInput.addEventListener("input", () => this.validatePriceRange());
            minPriceInput.addEventListener("change", () => {
                if (this.validatePriceRange()) this.applyFilters();
            });
        }

        if (maxPriceInput) {
            maxPriceInput.addEventListener("input", () => this.validatePriceRange());
            maxPriceInput.addEventListener("change", () => {
                if (this.validatePriceRange()) this.applyFilters();
            });
        }

        // Other filters
        const categorySelect = document.getElementById("search-category");
        if (categorySelect) {
            categorySelect.addEventListener("change", () => this.applyFilters());
        }

        const ratingSelect = document.getElementById("search-rating");
        if (ratingSelect) {
            ratingSelect.addEventListener("change", () => this.applyFilters());
        }

        const nameInput = document.getElementById("search-keyword");
        if (nameInput) {
            nameInput.addEventListener("input", () => this.applyFilters());
        }

        const sortSelect = document.getElementById("sort-by");
        if (sortSelect) {
            sortSelect.addEventListener("change", () => this.applyFilters());
        }
    },

    /**
     * Q2: Validation HTML5 tùy biến cho khoảng giá tối thiểu - tối đa (Resolves Codex issue 1)
     */
    validatePriceRange: function () {
        const minInput = document.getElementById("search-min-price");
        const maxInput = document.getElementById("search-max-price");
        if (!minInput || !maxInput) return true;

        const minVal = minInput.value.trim();
        const maxVal = maxInput.value.trim();

        const min = minVal !== "" ? Number(minVal) : null;
        const max = maxVal !== "" ? Number(maxVal) : null;

        if (min !== null && max !== null && min > max) {
            maxInput.setCustomValidity(`Giá tối đa (${max.toLocaleString('vi-VN')} đ) phải lớn hơn hoặc bằng giá tối thiểu (${min.toLocaleString('vi-VN')} đ)!`);
            maxInput.reportValidity();
            return false;
        } else {
            maxInput.setCustomValidity("");
            return true;
        }
    },

    applyFilters: function () {
        const form = document.getElementById("advanced-search-form");
        if (form && !form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (!this.validatePriceRange()) {
            return;
        }

        let products = App.getAllProducts();
        if (!products || products.length === 0) return;

        // 1. Keyword search (Name/Title/Description)
        const keyword = (document.getElementById("search-keyword")?.value || "").trim().toLowerCase();
        if (keyword) {
            products = products.filter(p => p.name.toLowerCase().includes(keyword) || p.description.toLowerCase().includes(keyword));
        }

        // 2. Category filter
        const category = document.getElementById("search-category")?.value || "ALL";
        if (category !== "ALL") {
            products = products.filter(p => p.category === category);
        }

        // 3. Price range filter (min - max with HTML5 validation)
        const minPriceVal = document.getElementById("search-min-price")?.value;
        const maxPriceVal = document.getElementById("search-max-price")?.value;

        if (minPriceVal !== "" && !isNaN(minPriceVal)) {
            const min = Number(minPriceVal);
            products = products.filter(p => p.price >= min);
        }

        if (maxPriceVal !== "" && !isNaN(maxPriceVal)) {
            const max = Number(maxPriceVal);
            products = products.filter(p => p.price <= max);
        }

        // 4. Color filter
        const selectedColors = [];
        document.querySelectorAll('input[name="filter-color"]:checked').forEach(cb => {
            selectedColors.push(cb.value);
        });

        if (selectedColors.length > 0) {
            products = products.filter(p => {
                return p.colors && p.colors.some(c => selectedColors.includes(c));
            });
        }

        // 5. Rating filter (based on reviews.xml average rating)
        const minRating = Number(document.getElementById("search-rating")?.value || "0");
        if (minRating > 0) {
            const ratingsMap = App.getRatingsMap();
            products = products.filter(p => {
                const info = ratingsMap[p.id];
                const avg = info ? info.avgRating : (p.baseRating ? p.baseRating.rate : 0);
                return avg >= minRating;
            });
        }

        // 6. Sort results
        const sortBy = document.getElementById("sort-by")?.value || "DEFAULT";
        if (sortBy === "PRICE_ASC") {
            products.sort((a, b) => a.price - b.price);
        } else if (sortBy === "PRICE_DESC") {
            products.sort((a, b) => b.price - a.price);
        } else if (sortBy === "RATING_DESC") {
            const ratingsMap = App.getRatingsMap();
            products.sort((a, b) => {
                const rA = ratingsMap[a.id] ? ratingsMap[a.id].avgRating : 0;
                const rB = ratingsMap[b.id] ? ratingsMap[b.id].avgRating : 0;
                return rB - rA;
            });
        }

        App.renderProducts(products);
    },

    resetFilters: function () {
        const form = document.getElementById("advanced-search-form");
        if (form) form.reset();

        const minInput = document.getElementById("search-min-price");
        const maxInput = document.getElementById("search-max-price");
        if (minInput) minInput.setCustomValidity("");
        if (maxInput) maxInput.setCustomValidity("");

        document.querySelectorAll(".color-chip-label").forEach(chip => {
            chip.classList.remove("active");
            const cb = chip.querySelector("input");
            if (cb) cb.checked = false;
        });

        const keywordInput = document.getElementById("search-keyword");
        if (keywordInput) keywordInput.value = "";

        const sortSelect = document.getElementById("sort-by");
        if (sortSelect) sortSelect.value = "DEFAULT";

        App.renderProducts(App.getAllProducts());
    },

    toggleColorChip: function (chipElement) {
        const cb = chipElement.querySelector('input[type="checkbox"]');
        if (cb) {
            cb.checked = !cb.checked;
            chipElement.classList.toggle("active", cb.checked);
            this.applyFilters();
        }
    }
};
