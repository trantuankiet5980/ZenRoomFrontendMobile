export const SYSTEM_ADMIN_CONVERSATION_FALLBACK_ID = "__system_admin__";
export const SYSTEM_ADMIN_DISPLAY_NAME = "Quản trị hệ thống";
export const SYSTEM_ADMIN_AVATAR = require("../../assets/images/chat.jpg");

const SYSTEM_KEYWORDS = new Set([
  "ADMIN",
  "SYSTEM_ADMIN",
  "ADMIN_SUPPORT",
  "SUPPORT",
  "SYSTEM",
  "STAFF",
]);

const TITLE_KEYWORDS = [
  "quản trị hệ thống",
  "quan tri he thong",
  "admin",
  "hỗ trợ",
  "ho tro",
];

const normalize = (value) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
};

const normalizeUpper = (value) => normalize(value).toUpperCase();

export function isSystemAdminConversation(conversation) {
  if (!conversation) return false;

  if (conversation.isSystemAdmin || conversation.systemAdmin === true) return true;

  const typeCandidates = [
    conversation.conversationType,
    conversation.type,
    conversation.groupType,
    conversation.systemConversation,
    conversation.systemConversationType,
    conversation.targetRole,
    conversation.targetType,
    conversation.audience,
  ];

  for (const candidate of typeCandidates) {
    const normalized = normalizeUpper(candidate);
    if (normalized && SYSTEM_KEYWORDS.has(normalized)) return true;
  }

  if (Array.isArray(conversation.tags)) {
    for (const tag of conversation.tags) {
      const normalized = normalizeUpper(tag);
      if (normalized && SYSTEM_KEYWORDS.has(normalized)) return true;
    }
  }

  const titleCandidates = [conversation.title, conversation.name, conversation.groupName, conversation.displayName];
  for (const title of titleCandidates) {
    const normalized = normalize(title).toLowerCase();
    if (!normalized) continue;
    if (TITLE_KEYWORDS.some((keyword) => normalized.includes(keyword))) return true;
  }

  return false;
}

export function findSystemAdminConversation(conversations = []) {
  return conversations.find((conv) => isSystemAdminConversation(conv)) || null;
}