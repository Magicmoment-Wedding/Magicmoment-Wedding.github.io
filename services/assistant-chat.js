export const ASSISTANT_CHAT_URL = "http://pf.kakao.com/_xeNSts/chat";

export function openAssistantChat() {
  if (typeof window === "undefined") {
    return;
  }

  const chatWindow = window.open(ASSISTANT_CHAT_URL, "_blank");

  if (chatWindow) {
    chatWindow.opener = null;
    return;
  }

  window.location.assign(ASSISTANT_CHAT_URL);
}
