const axios = require("axios");

const BASE_URL = "http://localhost:3000/api";

// --- Offline responses ---
const responses = {
    greeting: {
        vi: "Xin chào! Tôi là trợ lý ảo BossHouse. Tôi có thể giúp gì cho bạn?",
        en: "Hello! I am BossHouse virtual assistant. How can I help you?"
    },
    introduction: {
        vi: "🏠 BossHouse là trung tâm chăm sóc thú cưng toàn diện tại TP. Cần Thơ, cung cấp dịch vụ chăm sóc & tắm, trông giữ thú cưng, khám sức khỏe, tiêm phòng và tư vấn nhận nuôi. Chúng tôi cam kết mang lại dịch vụ tốt nhất cho thú cưng của bạn.",
        en: "🏠 BossHouse is a full-service pet care center in Can Tho City, offering grooming, boarding, health check, vaccination, and adoption consultation. We are committed to providing the best care for your beloved pets."
    },
    location: {
        vi: "📍 BossHouse nằm tại Số 600 Đường Nguyễn Văn Cừ (nối dài), P. An Bình, TP. Cần Thơ. Chúng tôi rất mong được đón tiếp bạn!",
        en: "📍 BossHouse located at 600 Nguyen Van Cu Street (extension), An Binh Ward, Can Tho City. We look forward to welcoming you!"
    },
    openHours: {
        vi: "🕗 Giờ mở cửa: 8:00 - 17:00 tất cả các ngày trong tuần.",
        en: "🕗 Open hours: 8 AM - 5 PM, every day of the week."
    },
    petCare: {
        vi: {
            dog: "Khi chó bị bệnh, hãy đưa đến bác sĩ thú y ngay. Giữ vệ sinh, cho uống thuốc theo chỉ dẫn và đảm bảo chế độ ăn phù hợp.",
            cat: "Khi mèo bị bệnh, hãy đưa đến bác sĩ thú y. Đảm bảo vệ sinh, chế độ ăn và uống thuốc theo chỉ dẫn."
        },
        en: {
            dog: "When your dog is sick, take it to a veterinarian immediately. Keep it clean, give medication as prescribed, and ensure a proper diet.",
            cat: "When your cat is sick, take it to a veterinarian. Maintain hygiene and follow the prescribed medication and diet."
        }
    },
    general: {
        vi: "Nếu bạn cần bất kỳ thông tin nào về BossHouse hoặc dịch vụ của chúng tôi, hãy hỏi, tôi luôn sẵn sàng hỗ trợ!",
        en: "If you need any information about BossHouse or our services, just ask, I am always ready to help!"
    },
    outOfScope: {
        vi: "Xin lỗi, tôi chỉ trả lời câu hỏi trong phạm vi cửa hàng (dịch vụ, thú cưng, bác sĩ, đơn hàng,...).",
        en: "Sorry, I only answer questions related to the store (services, pets, veterinarians, orders, etc.)."
    }
};

// --- Helper: format MongoDB items ---
const formatItemForDisplay = (item, type) => {
    let fieldsToShow = [];
    switch (type) {
        case "pets":
            fieldsToShow = ["name", "age", "breed", "gender", "species", "weight", "is_active"];
            break;
        case "services":
            fieldsToShow = ["name", "base_price", "description", "duration_minutes"];
            break;
        case "products":
            fieldsToShow = ["name", "price", "description", "category"];
            break;
        case "veterinarians":
            fieldsToShow = ["name", "specialty", "years_experience", "bio", "is_active"];
            break;
        default:
            fieldsToShow = Object.keys(item).filter(k => !["_id", "createdAt", "updatedAt", "__v"].includes(k));
    }
    return fieldsToShow
        .filter(key => item[key] !== undefined && item[key] !== null)
        .map(key => `+ ${key}: ${item[key]}`)
        .join("\n");
};

// --- API map ---
const apiMap = {
    "dịch vụ": { path: "/services", label: "Dịch vụ", type: "services" },
    "bác sĩ": { path: "/veterinarians", label: "Bác sĩ thú y", type: "veterinarians" },
    "thú cưng": { path: "/pets", label: "Thú cưng", type: "pets" },
    "khuyến mãi": { path: "/promotions", label: "Khuyến mãi", type: "promotions" },
    "sản phẩm": { path: "/products", label: "Sản phẩm", type: "products" },
    "đơn hàng": { path: "/orders", label: "Đơn hàng", type: "orders" },
    "đặt lịch": { path: "/bookings", label: "Lịch đặt", type: "bookings" },
    "bài viết": { path: "/posts", label: "Bài viết", type: "posts" },
};

// --- Detect language ---
const detectLang = (text) => /[ăâáàảạêếèệẻẽđíìỉịĩôơóòỏọõưúùủũụýỳỷỹỵ]/i.test(text) ? "vi" : "en";

// --- Controller ---
const handleQuery = async (req, res) => {
    const { question } = req.body;
    if (!question) return res.json({ reply: "Xin vui lòng nhập câu hỏi." });

    const qLower = question.toLowerCase().trim();
    const lang = detectLang(question);

    // 1️⃣ Greeting
    if (/\b(xin chào|chào)\b/i.test(qLower)) return res.json({ reply: responses.greeting.vi });
    if (/\b(hi|hello)\b/i.test(qLower)) return res.json({ reply: responses.greeting.en });

    try {
        // 2️⃣ Check MongoDB first
        const foundKey = Object.keys(apiMap).find(k => qLower.includes(k));

        if (foundKey) {
            const { path, label, type } = apiMap[foundKey];
            const dataRes = await axios.get(`${BASE_URL}${path}`);
            const data = dataRes.data.data || dataRes.data;

            if (Array.isArray(data) && data.length > 0) {
                const formatted = data.map((item, i) => `${i + 1}. ${item.name || item.title || "N/A"}\n${formatItemForDisplay(item, type)}`).join("\n\n");
                return res.json({ reply: `📘 ${label} (${data.length}):\n${formatted}` });
            }
        }

        // 3️⃣ Offline fallback
        if (lang === "vi") {
            if (/giới thiệu|về cửa hàng/i.test(qLower)) return res.json({ reply: responses.introduction.vi });
            if (/địa chỉ|cửa hàng|vị trí/i.test(qLower)) return res.json({ reply: responses.location.vi });
            if (/giờ mở cửa|thời gian hoạt động/i.test(qLower)) return res.json({ reply: responses.openHours.vi });
            if (/thông tin|tư vấn/i.test(qLower)) return res.json({ reply: responses.general.vi });
            if (/chó.*bệnh/i.test(qLower)) return res.json({ reply: responses.petCare.vi.dog });
            if (/mèo.*bệnh/i.test(qLower)) return res.json({ reply: responses.petCare.vi.cat });
        } else {
            if (/about|introduction/i.test(qLower)) return res.json({ reply: responses.introduction.en });
            if (/address|where|shop/i.test(qLower)) return res.json({ reply: responses.location.en });
            if (/open|closing/i.test(qLower)) return res.json({ reply: responses.openHours.en });
            if (/info|general/i.test(qLower)) return res.json({ reply: responses.general.en });
            if (/dog.*sick/i.test(qLower)) return res.json({ reply: responses.petCare.en.dog });
            if (/cat.*sick/i.test(qLower)) return res.json({ reply: responses.petCare.en.cat });
        }

        // 4️⃣ Outside scope
        return res.json({
            reply: lang === "vi"
                ? responses.outOfScope.vi
                : responses.outOfScope.en
        });

    } catch (err) {
        console.error("❌ Chatbot Error:", err.message);
        return res.status(500).json({
            reply: lang === "vi"
                ? "Đã có lỗi xảy ra khi xử lý câu hỏi."
                : "An error occurred while processing your question."
        });
    }
};

module.exports = { handleQuery };
