/**
 * parser.js - Q1 & Q5: XML Processing and Analysis using DOMParser
 * Student: Đinh Thế Nhơn - MSSV: K244060739 - Lớp: K24406
 * Business Web Development - Code BW08
 */

const XMLParser = {
    /**
     * Parse products.xml using DOMParser (Q1)
     */
    parseProductsXML: function (xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const productNodes = xmlDoc.querySelectorAll("product");
        const products = [];

        productNodes.forEach(node => {
            const id = node.getAttribute("id") || "";
            const name = node.querySelector("name") ? node.querySelector("name").textContent : "No Name";
            const price = node.querySelector("price") ? Number(node.querySelector("price").textContent) : 0;
            const category = node.querySelector("category") ? node.querySelector("category").textContent : "general";
            const image = node.querySelector("image") ? node.querySelector("image").textContent : "";
            const description = node.querySelector("description") ? node.querySelector("description").textContent : "";
            const stock = node.querySelector("stock") ? Number(node.querySelector("stock").textContent) : 0;

            // Extract colors array
            const colorNodes = node.querySelectorAll("colors color");
            const colors = [];
            colorNodes.forEach(c => colors.push(c.textContent.trim()));

            // Base rating
            const ratingNode = node.querySelector("rating");
            const baseRate = ratingNode ? Number(ratingNode.getAttribute("rate") || 4.0) : 4.0;
            const baseCount = ratingNode ? Number(ratingNode.getAttribute("count") || 100) : 100;

            products.push({
                id: id,
                name: name,
                price: price,
                category: category,
                image: image,
                description: description,
                stock: stock,
                colors: colors.length > 0 ? colors : ["Black", "Blue"],
                baseRating: { rate: baseRate, count: baseCount }
            });
        });

        return products;
    },

    /**
     * Parse reviews.xml using DOMParser (Q5)
     * Reads all <review> nodes and groups by product_id
     */
    parseReviewsXML: function (xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const reviewNodes = xmlDoc.querySelectorAll("review");
        const reviewsByProduct = {};

        reviewNodes.forEach(node => {
            const reviewId = node.getAttribute("id") || "";
            const productId = node.querySelector("product_id") ? node.querySelector("product_id").textContent.trim() : "";
            const customerName = node.querySelector("customer_name") ? node.querySelector("customer_name").textContent.trim() : "Khách hàng";
            const rating = node.querySelector("rating") ? Number(node.querySelector("rating").textContent) : 5;
            const comment = node.querySelector("comment") ? node.querySelector("comment").textContent.trim() : "";
            const date = node.querySelector("date") ? node.querySelector("date").textContent.trim() : "";

            if (!reviewsByProduct[productId]) {
                reviewsByProduct[productId] = [];
            }

            reviewsByProduct[productId].push({
                id: reviewId,
                productId: productId,
                customerName: customerName,
                rating: rating,
                comment: comment,
                date: date
            });
        });

        return reviewsByProduct;
    },

    /**
     * Compute average rating for each product from reviews.xml (Q5)
     */
    computeAverageRatings: function (reviewsByProduct) {
        const ratingStats = {};

        for (const [productId, reviews] of Object.entries(reviewsByProduct)) {
            if (reviews.length === 0) continue;
            const total = reviews.reduce((sum, r) => sum + r.rating, 0);
            const avg = (total / reviews.length).toFixed(1);

            ratingStats[productId] = {
                avgRating: Number(avg),
                count: reviews.length,
                reviews: reviews
            };
        }

        return ratingStats;
    },

    /**
     * Parse carts.xml using DOMParser (Q1, Q8)
     */
    parseCartsXML: function (xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");
        const orderNodes = xmlDoc.querySelectorAll("order");
        const orders = [];

        orderNodes.forEach(node => {
            const orderId = node.getAttribute("id") || "";
            const orderDate = node.querySelector("order_date") ? node.querySelector("order_date").textContent : "";
            const empNode = node.querySelector("employee");
            const employeeName = empNode ? empNode.textContent : "Chưa phân công";

            const custNode = node.querySelector("customer");
            const customerName = custNode && custNode.querySelector("name") ? custNode.querySelector("name").textContent : "Khách hàng";
            const customerPhone = custNode && custNode.querySelector("phone") ? custNode.querySelector("phone").textContent : "";
            const customerAddress = custNode && custNode.querySelector("address") ? custNode.querySelector("address").textContent : "";

            const status = node.querySelector("status") ? node.querySelector("status").textContent : "Processing";
            const totalAmount = node.querySelector("total_amount") ? Number(node.querySelector("total_amount").textContent) : 0;
            const paymentMethod = node.querySelector("payment_method") ? node.querySelector("payment_method").textContent : "COD";

            const itemNodes = node.querySelectorAll("items item");
            const items = [];
            itemNodes.forEach(it => {
                items.push({
                    productId: it.getAttribute("product_id") || "",
                    productName: it.querySelector("product_name") ? it.querySelector("product_name").textContent : "",
                    color: it.querySelector("color") ? it.querySelector("color").textContent : "",
                    quantity: it.querySelector("quantity") ? Number(it.querySelector("quantity").textContent) : 1,
                    price: it.querySelector("price") ? Number(it.querySelector("price").textContent) : 0,
                    subtotal: it.querySelector("subtotal") ? Number(it.querySelector("subtotal").textContent) : 0
                });
            });

            orders.push({
                orderId: orderId,
                orderDate: orderDate,
                employeeName: employeeName,
                customerName: customerName,
                customerPhone: customerPhone,
                customerAddress: customerAddress,
                status: status,
                totalAmount: totalAmount,
                paymentMethod: paymentMethod,
                items: items
            });
        });

        return orders;
    }
};

