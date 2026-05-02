---
name: Warm Heart AI
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#574144'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#8a7173'
  outline-variant: '#ddbfc2'
  surface-tint: '#a8334e'
  primary: '#a8334e'
  on-primary: '#ffffff'
  primary-container: '#ff758f'
  on-primary-container: '#74052a'
  inverse-primary: '#ffb2bc'
  secondary: '#665c5e'
  on-secondary: '#ffffff'
  secondary-container: '#ebdcdf'
  on-secondary-container: '#6a6063'
  tertiary: '#5d5f5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#a1a2a2'
  on-tertiary-container: '#373939'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9dd'
  primary-fixed-dim: '#ffb2bc'
  on-primary-fixed: '#400013'
  on-primary-fixed-variant: '#881938'
  secondary-fixed: '#eddfe2'
  secondary-fixed-dim: '#d1c3c6'
  on-secondary-fixed: '#211a1c'
  on-secondary-fixed-variant: '#4e4447'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 800px
---

## Brand & Style

The design system is defined by a "Digital Tenderness" aesthetic—a sophisticated blend of high-tech efficiency and emotional warmth. It is designed specifically for students and parents, ensuring that the AI-driven process of letter writing feels personal rather than automated.

The style leverages **Minimalism** to reduce cognitive load during the writing process, combined with **Tactile** elements that mimic the physical sensation of stationery. The emotional response is one of safety, gratitude, and clarity. By using soft colors and generous spacing, the design system removes the "blank page anxiety" often associated with writing, replacing it with a guided, nurturing experience.

## Colors

The palette is anchored in a soft, monochromatic pink spectrum to evoke the traditional carnations of Parents Day. 

- **Primary (#FF758F):** Used exclusively for high-intent actions, progress indicators, and active selection states. It provides the "tech" energy within the warm environment.
- **Surface Palette:** The background utilizes the softest pink (#FFF0F3) to reduce eye strain, while white (#FFFFFF) is reserved for the primary content cards (the "Letter Canvas"). 
- **Neutrals:** A very light gray (#F8F9FA) is used for secondary containers and input fields to provide subtle contrast against the white cards without breaking the soft aesthetic.

## Typography

This design system utilizes **Plus Jakarta Sans** for its modern, geometric clarity and inherently friendly, rounded terminals. 

- **Hierarchy:** Display type is used for emotional milestones (e.g., "Your letter is ready"). Headlines guide the user through the three-step AI generation process.
- **Readability:** Body text is set with a generous line height (1.6) to ensure the generated letters are easy to proofread for both students and elderly parents.
- **Letter Spacing:** Headlines use slight negative letter spacing for a more "designed," editorial look, while labels use increased tracking for legibility on small mobile buttons.

## Layout & Spacing

The design system employs a **Fixed Grid** approach for the core interaction area to simulate the focused nature of a physical letter.

- **The Letter Canvas:** Content is centered in a single-column container with a maximum width of 800px on desktop. This encourages focus and prevents the AI-generated text from stretching too wide, which hinders readability.
- **Rhythm:** An 8px base unit drives all padding and margins. Large `lg` (40px) and `xl` (64px) vertical spacing is used between sections to create a sense of "breath" and calm.
- **Touch Targets:** All interactive elements maintain a minimum height of 56px to ensure accessibility for tablets in a classroom setting and for parents viewing on mobile devices.

## Elevation & Depth

To maintain the "Warm Heart" theme, depth is communicated through **Ambient Shadows** rather than harsh borders.

- **Card Elevation:** The primary letter-writing card uses a very soft, diffused shadow tinted with the primary pink: `0px 10px 30px rgba(255, 117, 143, 0.08)`. This makes the card appear as if it is floating gently above the pastel background.
- **Interactive Depth:** Buttons use a slightly more pronounced shadow that collapses on "active" (click) states to provide tactile feedback, simulating a physical button press.
- **Layering:** AI suggestion chips use a flat, low-contrast outline (1px solid #F8F9FA) rather than shadows to remain secondary to the main content card.

## Shapes

The design system utilizes a **Rounded (Level 2)** shape language to reinforce the friendly and approachable brand personality.

- **Primary Containers:** All cards and main input areas use a 16px (`1rem`) corner radius. 
- **Buttons and Chips:** Use a fully pill-shaped radius (32px+) to signify interactivity and create a distinct visual difference from the content containers.
- **Interactive Components:** Form fields use the standard 16px radius to match the card language, creating a harmonious and unified visual flow.

## Components

- **Primary Action Button:** Large, pill-shaped buttons using the `#FF758F` background with white bold text. These include a "magic" icon (sparkles) when related to AI generation tasks.
- **The Letter Card:** A white, 16px rounded surface with generous internal padding (32px). This acts as the focal point where the AI-generated text appears.
- **Step Indicators:** Soft pink circles with primary pink active states, connected by thin lines to show progress through the "Prompt -> Draft -> Finish" flow.
- **AI Suggestion Chips:** Small, pill-shaped secondary buttons in `#F8F9FA` that allow students to quickly add sentiments (e.g., "Thank you," "Love," "Health") to the AI prompt.
- **Input Fields:** Clean, minimal fields with a 1px border that shifts to Primary Pink on focus. Labels are always positioned above the field for maximum clarity.