export const ROUTES = {
  HOME: "home",
  CREDITS: "credits",
  SETTINGS: "settings",
  CREATE: "create",
  OPTIONS: "options",
  RESULT: "result",
  GALLERY: "gallery",
  MORE: "more",
  SITE_GUIDE: "site-guide",
  CONCIERGE: "concierge",
  STUDIO: "studio",
  ASSISTANT: "assistant",
  SUGGESTIONS: "suggestions",
};

const VALID_ROUTES = new Set(Object.values(ROUTES));

export const PREVIOUS_ROUTE = {
  home: ROUTES.HOME,
  create: ROUTES.HOME,
  credits: ROUTES.HOME,
  settings: ROUTES.HOME,
  options: ROUTES.CREATE,
  result: ROUTES.OPTIONS,
  gallery: ROUTES.HOME,
  more: ROUTES.HOME,
  "site-guide": ROUTES.MORE,
  concierge: ROUTES.MORE,
  studio: ROUTES.MORE,
  assistant: ROUTES.MORE,
  suggestions: ROUTES.MORE,
};

export function getRouteFromHash() {
  const route = window.location.hash.replace(/^#\/?/, "");
  return VALID_ROUTES.has(route) ? route : ROUTES.HOME;
}

export function navigate(route) {
  if (!VALID_ROUTES.has(route)) {
    return;
  }

  window.location.hash = `#/${route}`;
}

export function initRouter(onChange) {
  const handleHashChange = () => {
    onChange(getRouteFromHash());
  };

  window.addEventListener("hashchange", handleHashChange);

  if (!window.location.hash) {
    navigate(ROUTES.HOME);
    return;
  }

  handleHashChange();
}
