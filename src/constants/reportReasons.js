export const REPORT_REASON_METADATA = {
    INAPPROPRIATE_CONTENT: {
        title: "Nội dung không phù hợp",
        description: "Bài đăng chứa nội dung không phù hợp, nhạy cảm hoặc phản cảm",
    },
    FRAUD_OR_SCAM: {
        title: "Lừa đảo hoặc giả mạo",
        description: "Có dấu hiệu lừa đảo, giả mạo thông tin",
    },
    SPAM_OR_ADVERTISING: {
        title: "Spam hoặc quảng cáo",
        description: "Bài đăng spam, trùng lặp hoặc quảng cáo không liên quan đến nền tảng.",
    },
    MISLEADING_INFORMATION: {
        title: "Thông tin sai lệch",
        description: "Cung cấp thông tin sai lệch, không trung thực về chỗ ở, giá, tiện nghi, vị trí,…",
    },
    COPYRIGHT_VIOLATION: {
        title: "Vi phạm bản quyền",
        description: "Vi phạm bản quyền hình ảnh, nội dung, thương hiệu của người khác.",
    },
    HARASSMENT_OR_DISCRIMINATION: {
        title: "Quấy rối hoặc phân biệt đối xử",
        description: "Bài đăng có phát ngôn phân biệt đối xử, xúc phạm hoặc quấy rối người khác.",
    },
    UNSAFE_OR_DANGEROUS: {
        title: "Nguy hiểm hoặc không an toàn",
        description: "Bài đăng mô tả chỗ ở hoặc hoạt động nguy hiểm, không đảm bảo an toàn.",
    },
    FAKE_OR_NON_EXISTENT: {
        title: "Tin giả hoặc không tồn tại",
        description: "Tin giả hoặc không tồn tại thực tế, hình ảnh lấy từ nơi khác.",
    },
    OTHER: {
        title: "Lý do khác",
        description: "Lý do khác",
    },
};

const formatReasonFallback = (code) => {
    if (!code) {
        return { title: "", description: "" };
    }

    const readable = String(code)
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

    return {
        title: readable,
        description: readable,
    };
};

export const mapReportReasonCodes = (codes) => {
    if (!Array.isArray(codes)) {
        return [];
    }

    return codes.map((code) => {
        const normalized = code ? String(code).toUpperCase() : "";
        const metadata = REPORT_REASON_METADATA[normalized];
        if (metadata) {
            return { code: normalized, ...metadata };
        }
        const fallback = formatReasonFallback(normalized);
        return { code: normalized, ...fallback };
    });
};

export const getReportReasonMetadata = (code) => {
    if (!code) {
        return { code: "", ...formatReasonFallback("") };
    }

    const normalized = String(code).toUpperCase();
    return {
        code: normalized,
        ...(REPORT_REASON_METADATA[normalized] || formatReasonFallback(normalized)),
    };
};