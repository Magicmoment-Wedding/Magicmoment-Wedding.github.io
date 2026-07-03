(() => {
  const VISITOR_ANALYTICS_ID_STORAGE_KEY = "mas_anonymous_id";
  const ANONYMOUS_ID_STORAGE_KEY = "magic_ai_anonymous_id";
  const EVENT_DEDUP_MS = 3000;
  const dedupMap = new Map();

  function createVisitorAnalyticsId() {
    if (window.crypto?.randomUUID) {
      return `anon_${window.crypto.randomUUID()}`;
    }
    const randomString = Math.random().toString(36).slice(2, 12);
    return `anon_${Date.now()}_${randomString}`;
  }

  function getVisitorAnalyticsId() {
    try {
      const storedId = window.localStorage.getItem(VISITOR_ANALYTICS_ID_STORAGE_KEY);
      if (storedId) return storedId;

      const fallbackId = window.localStorage.getItem(ANONYMOUS_ID_STORAGE_KEY);
      if (fallbackId) {
        window.localStorage.setItem(VISITOR_ANALYTICS_ID_STORAGE_KEY, fallbackId);
        return fallbackId;
      }

      const nextId = createVisitorAnalyticsId();
      window.localStorage.setItem(VISITOR_ANALYTICS_ID_STORAGE_KEY, nextId);
      return nextId;
    } catch {
      return createVisitorAnalyticsId();
    }
  }

  function getAnalyticsDeviceType() {
    const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches === true;
    const narrowViewport = window.matchMedia?.("(max-width: 768px)")?.matches === true;
    return coarsePointer || narrowViewport ? "mobile" : "desktop";
  }

  function getAnalyticsBrowserName() {
    const userAgent = String(navigator.userAgent || "");
    if (/SamsungBrowser/i.test(userAgent)) return "samsung";
    if (/Whale/i.test(userAgent)) return "whale";
    if (/NAVER/i.test(userAgent)) return "naver";
    if (/KAKAOTALK/i.test(userAgent)) return "kakao";
    if (/Instagram/i.test(userAgent)) return "instagram";
    if (/Edg/i.test(userAgent)) return "edge";
    if (/Firefox/i.test(userAgent)) return "firefox";
    if (/Chrome|CriOS/i.test(userAgent) && !/Edg/i.test(userAgent)) return "chrome";
    if (/Safari/i.test(userAgent) && !/Chrome|CriOS|Chromium|Edg/i.test(userAgent)) return "safari";
    return "unknown";
  }

  function sanitizeErrorMessage(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300);
  }

  function getApiBaseUrl() {
    return String(window.API_BASE_URL || window.MAGIC_AI_STUDIO_CONFIG?.API_BASE_URL || "").replace(/\/+$/, "");
  }

  function trackEvent(eventName, properties = {}) {
    try {
      const normalizedEventName = String(eventName || "").trim();
      if (!normalizedEventName) return;

      const pagePath = String(properties.pagePath || window.location.pathname || "/").trim() || "/";
      const dedupKey = `${normalizedEventName}:${pagePath}:${properties.styleCategory || ""}:${properties.provider || ""}`;
      const now = Date.now();
      const lastSentAt = dedupMap.get(dedupKey) || 0;
      if (now - lastSentAt < EVENT_DEDUP_MS) return;
      dedupMap.set(dedupKey, now);

      const payload = {
        eventName: normalizedEventName,
        anonymousId: getVisitorAnalyticsId(),
        pagePath,
        referrer: String(properties.referrer || document.referrer || "").trim(),
        deviceType: String(properties.deviceType || getAnalyticsDeviceType()).trim(),
        browserName: String(properties.browserName || getAnalyticsBrowserName()).trim(),
        isLoggedIn: properties.isLoggedIn === true,
        provider: properties.provider ? String(properties.provider).trim().toLowerCase() : null,
        styleCategory: properties.styleCategory ? String(properties.styleCategory).trim() : null,
        errorMessage: properties.errorMessage ? sanitizeErrorMessage(properties.errorMessage) : null,
      };

      const endpoint = `${getApiBaseUrl()}/api/analytics/event`;
      const body = JSON.stringify(payload);

      if (typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon(endpoint, blob)) {
          return;
        }
      }

      window.fetch(endpoint, {
        method: "POST",
        keepalive: true,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }).catch(() => {});
    } catch {
      // Analytics must never block user flows.
    }
  }

  window.trackEvent = trackEvent;
  window.getVisitorAnalyticsId = window.getVisitorAnalyticsId || getVisitorAnalyticsId;
})();
