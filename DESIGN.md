---
name: Bloom Cinematic
colors:
  surface: '#fff8f7'
  surface-dim: '#e2d8d8'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf1f2'
  surface-container: '#f6ebec'
  surface-container-high: '#f0e6e6'
  surface-container-highest: '#eae0e1'
  on-surface: '#1f1a1b'
  on-surface-variant: '#514346'
  inverse-surface: '#352f30'
  inverse-on-surface: '#f9eeef'
  outline: '#837376'
  outline-variant: '#d5c2c4'
  surface-tint: '#81505c'
  primary: '#81505c'
  on-primary: '#ffffff'
  primary-container: '#c48b97'
  on-primary-container: '#4f2630'
  inverse-primary: '#f4b6c3'
  secondary: '#6c5a5d'
  on-secondary: '#ffffff'
  secondary-container: '#f2dadd'
  on-secondary-container: '#705e61'
  tertiary: '#446649'
  on-tertiary: '#ffffff'
  tertiary-container: '#7fa382'
  on-tertiary-container: '#183920'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9e0'
  primary-fixed-dim: '#f4b6c3'
  on-primary-fixed: '#330f1a'
  on-primary-fixed-variant: '#663944'
  secondary-fixed: '#f5dde0'
  secondary-fixed-dim: '#d8c1c4'
  on-secondary-fixed: '#25181a'
  on-secondary-fixed-variant: '#534345'
  tertiary-fixed: '#c6ecc7'
  tertiary-fixed-dim: '#aad0ac'
  on-tertiary-fixed: '#01210b'
  on-tertiary-fixed-variant: '#2d4e33'
  background: '#fff8f7'
  on-background: '#1f1a1b'
  surface-variant: '#eae0e1'
typography:
  display:
    fontFamily: Cormorant Garamond
    fontSize: 40px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  body-large:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  button:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.0'
  label-caps:
    fontFamily: Outfit
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  container-padding: 1.5rem
  stack-gap-lg: 1.5rem
  stack-gap-sm: 0.5rem
  section-margin: 2.5rem
---

## Brand & Style

Bloom Cinematic is defined by a romantic, ethereal, and sophisticated personality. It targets a lifestyle-oriented audience that values memories, aesthetics, and high-quality storytelling. 

The design style is a refined **Glassmorphism** mixed with **Soft Minimalism**. It utilizes heavy backdrop blurs, semi-transparent layers, and vibrant but soft ambient gradients to create a sense of depth and lightness. The emotional response should be one of calm, "prestige," and artistic inspiration. The UI does not feel like a utility; it feels like an invitation to create something beautiful.

## Colors

The palette is a curated selection of "dusty rose" and "warm cream" tones. 
- **Primary (#C48B97):** A muted pink used for key actions and iconography to signify romance and warmth.
- **Secondary (#F9E0E3):** A softer pink used for decorative elements and subtle backgrounds.
- **Neutral/Background (#FCFBF9):** A warm off-white that prevents the screen from feeling clinical or cold.
- **Surfaces:** Utilize white with varying degrees of transparency (40-60%) combined with a 20px+ backdrop blur to maintain legibility over the ambient background.

## Typography

The typography strategy relies on a high-contrast serif/sans-serif pairing. 
- **Headlines:** Use *Cormorant Garamond* (mapped to Newsreader for standard system availability) for an editorial, literary feel. It should be used for emotional hooks.
- **Body & Actions:** Use *Outfit* (mapped to Manrope for its clean, modern geometric profile) for all functional text, ensuring high legibility and a contemporary edge. 
- **Hierarchy:** Maintain clear distinction through weight and letter spacing rather than just size; use uppercase tracking for sub-labels to create a premium "labeling" effect.

## Layout & Spacing

The layout follows a **Fixed-Width Centered** approach for mobile-first content, utilizing generous vertical margins to let the core messaging breathe.
- **Safe Zones:** A standard 24px (1.5rem) horizontal margin is maintained for all interactive elements.
- **Vertical Rhythm:** Elements are stacked with logical groupings (Icon + Title + Description) using a 24px gap, while distinct functional areas (Main Content vs. Footer) are separated by flexible "spacer" areas or large percentages of the viewport height (e.g., 10vh negative margins to pull content into the optical center).

## Elevation & Depth

Depth is created through **Atmospheric Layering** rather than traditional drop shadows.
- **Ambient Glows:** Use large, diffused shadows tinted with the primary color (`rgba(196, 139, 151, 0.15)`) to create a "glow" effect around cards and buttons.
- **Glass Surfaces:** Foreground elements use `backdrop-filter: blur(20px)` and semi-transparent white backgrounds.
- **Soft Borders:** Elements should be defined by high-contrast white borders (60% opacity) which mimic the specular highlight on the edge of a piece of glass.

## Shapes

The shape language is organic and highly rounded.
- **Primary Containers:** Use a "Card" radius of 32px for larger surfaces.
- **Interactive Elements:** Buttons and chips use a "Pill" radius (100px) to maximize the soft, approachable aesthetic.
- **Decorative:** Use perfect circles for iconography backdrops and background decorative blobs to maintain a consistent geometric theme.

## Components

- **Buttons:** Large height (56px), pill-shaped, with a glass effect (40% white opacity). They should include a subtle transition and icon movement (e.g., arrow sliding) on hover or interaction.
- **Icon Containers:** Circular backdrop with 1px border and significant backdrop blur. Icons should use the primary brand color to draw the eye.
- **Progress Indicators / Labels:** Small, uppercase text with wide tracking (5%) to serve as secondary metadata or instructional text.
- **Cards:** Large 32px radius surfaces with minimal content, focusing on one primary message or action per view.