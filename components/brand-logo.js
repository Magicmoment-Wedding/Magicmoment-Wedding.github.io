export const BRAND_LOGO_HORIZONTAL_SRC = "public/branding/magic-touch-ai-logo.svg";
export const BRAND_LOGO_VERTICAL_SRC = "public/branding/magic-touch-ai-logo-vertical.svg";

const LOGO_VARIANTS = {
  horizontal: BRAND_LOGO_HORIZONTAL_SRC,
  vertical: BRAND_LOGO_VERTICAL_SRC,
};

const LOGO_SIZE_CLASSES = {
  sm: "h-7",
  md: "h-10",
  lg: "h-14 md:h-[72px]",
};

export function renderBrandLogo({
  variant = "horizontal",
  size = "md",
  className = "",
  alt = "Magic Touch AI",
} = {}) {
  const logoSrc = LOGO_VARIANTS[variant] || LOGO_VARIANTS.horizontal;
  const sizeClass = LOGO_SIZE_CLASSES[size] || LOGO_SIZE_CLASSES.md;
  const safeAlt = String(alt || "Magic Touch AI").replace(/"/g, "&quot;");

  return `
    <span class="inline-flex max-w-full items-center justify-center ${className}">
      <img
        src="${logoSrc}"
        alt="${safeAlt}"
        class="${sizeClass} max-w-full object-contain"
        decoding="async"
      />
    </span>
  `;
}
