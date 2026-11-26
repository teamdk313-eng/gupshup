---
name: Gupshup Conversational UI
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464555'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#6df5e1'
  on-secondary-container: '#006f64'
  tertiary: '#005523'
  on-tertiary: '#ffffff'
  tertiary-container: '#007030'
  on-tertiary-container: '#63f889'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#6bff8f'
  tertiary-fixed-dim: '#4ae176'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005321'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  caption:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  caption-xs:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a refined, tactile, and highly legible mobile-first conversational experience. Drawing direct inspiration from modern Material 3 and contemporary conversational utilities, the aesthetic pairs utilitarian clarity with friendly, approachable micro-interactions.

The experience is centered around one-to-one intimacy, instantaneous visual feedback, and reliable performance across PWA and native Android wrappers. Interfaces prioritize generous whitespace, distinct message hierarchy, and unadorned, high-clarity typography. High contrast between sent and received bubbles prevents visual fatigue, while precise color tokens designate status and interactive triggers with minimal friction.

## Colors

The palette is engineered exclusively for a crisp, high-clarity light theme.

- **Primary (`#4F46E5`):** Serves as the anchor for key actions, navigation active states, sent message bubbles, and primary interactive elements. Pressed/active states deepen to `#4338CA`.
- **Secondary / Accent (`#14B8A6`):** Dedicated to contextual highlights, media playback progress (voice notes), and secondary action badges.
- **Tertiary / Success (`#22C55E`):** Reserved for live status indicators (online badges, read receipts, and successful uploads).
- **Destructive / Danger (`#EF4444`):** Employed for irreversible actions, recording cancellations, call drops, and destructive alerts.
- **Neutrals & Surfaces:**
  - Background: `#F8FAFC` provides a clean canvas distinct from active surfaces.
  - Surface: `#FFFFFF` for floating sheets, cards, app bars, and elevated dialogs.
  - Border / Dividers: `#E2E8F0` for subtle element segregation.
  - Text Primary: `#0F172A` delivers optimal legibility for message strings and headlines.
  - Text Secondary: `#64748B` anchors timestamps, metadata, read states, and placeholders.
  - Received Bubble: `#EEF2F7` houses received dialogue with `#0F172A` text.

## Typography

The design system relies entirely on **Inter** to ensure maximum typographic neutrality, precision, and legibility on mobile screens. 

- **Display & Section Headers:** `headline-lg` (`28px/700`) anchors top-level views such as the Conversations index and User Profile. `headline-md` (`20px/600`) governs conversation app bars, bottom sheet headers, and modal titles.
- **Message & Conversational Flow:** Primary message content in both sent and received bubbles renders in `body-lg` (`16px/400`). Density-sensitive list summaries utilize `body-md` (`14px/400`).
- **Metadata & Indicators:** Timestamps within bubbles, voice note durations, input counters, and system state messages use `caption` (`13px/400`). Compact status tags and badge counters employ `caption-xs` (`11px/500`).
- **Controls:** All form labels, buttons, and segmented pills reference `label-md` (`14px/600`) for structural clarity.

## Layout & Spacing

The layout model is optimized around mobile screen boundaries, thumb interaction zones, and Android navigation bars.

- **Canvas & Gutters:** Base mobile views operate on a fluid 4-column layout with `1rem` (16px) margins and `1rem` gutters. Tablet and foldables scale to an 8-column layout capped at a maximum message thread container width of `640px`.
- **Rhythm & Bubble Separation:**
  - Bubbles from different senders are separated by `space-md` (`16px`).
  - Consecutive bubbles from the same sender cluster tightly with `space-xs` (`4px`) vertical clearance.
  - Interactive touch targets maintain a minimum dimension of 48px to prevent miss-taps.
- **Safe Insets:** Top app bars and bottom composer bars integrate dynamic environment variables (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`) to account for software home bars and camera cutouts.

## Elevation & Depth

Visual hierarchy leverages a hybrid of clean flat structural borders and soft, diffused ambient drop shadows to signal interaction layers without clutter.

- **Level 0 (Flat Canvas):** App canvas background sits at `#F8FAFC`. Chat bubbles rest flat without drop shadows; separation is established via color contrasts (`#4F46E5` vs `#EEF2F7`).
- **Level 1 (Surface & Cards):** Conversation list rows, cards, and top app bars use `#FFFFFF` with a crisp `1px` stroke in `#E2E8F0`. When detached or floating, Level 1 cards introduce a soft ambient drop shadow: `0 2px 8px rgba(15, 23, 42, 0.04)`.
- **Level 2 (Active Composers & Floating Action Buttons):** Bottom input bars, attachment quick-pickers, and floating action buttons use `0 4px 16px rgba(15, 23, 42, 0.08)`.
- **Level 3 (Modal Sheets & Overlays):** Interactive bottom sheets (media preview, contact info) slide over a semi-transparent scrim (`rgba(15, 23, 42, 0.4)`) with an elevation shadow of `0 -4px 24px rgba(15, 23, 42, 0.12)`.

## Shapes

The design system employs a soft-rounded geometry, striking a balance between Material 3 friendliness and precise utility.

- **Standard Containers:** Interactive cards, message list items, and media preview wrappers feature a radius of `16px`.
- **Form Controls & Actions:** Buttons and input fields carry a dedicated `14px` border radius, creating a unified interactive silhouette.
- **Overlays & Drawers:** Mobile bottom sheets employ an exaggerated `24px` radius applied strictly to top-left and top-right vertices.
- **Message Bubbles:** Standard bubbles use `16px` border radii. Consecutive message stacks feature an asymmetrical inner corner collapsed to `4px` pointing towards the sender's origin.
- **Avatars:** Fully circular (`rounded-full`) at all times.

## Components

### Buttons
- **Dimensions:** Fixed height of `48px` with horizontal padding of `space-lg` (`24px`) and a corner radius of `14px`. Typography: `label-md`.
- **Primary:** Background `#4F46E5`, text `#FFFFFF`. State: pressed `#4338CA`.
- **Secondary (Outlined):** Background transparent, 1px border `#E2E8F0`, text `#0F172A`. Active state applies `#F8FAFC` background.
- **Danger:** Background `#EF4444`, text `#FFFFFF`. Pressed state darkens to `#DC2626`.
- **Icon Button:** `48px × 48px` square target, fully centered, transparent background with active ripple or `#EEF2F7` pressed state.

### Input Fields & Message Composer
- **Input Bar:** Single-line and auto-expanding multi-line text fields are built at a minimum height of `52px` with a `14px` radius.
- **Styling:** Surface `#FFFFFF`, border `1px solid #E2E8F0`, typography `body-lg`. Focus state transitions the border to `#4F46E5` accompanied by a `2px` focus halo (`rgba(79, 70, 229, 0.15)`).
- **Composer Controls:** Left-aligned attachment button (+), central auto-growing input, and right-aligned microphone icon (holding triggers audio recorder, typing converts it to an Indigo send arrow).

### Message Bubbles
- **Sent:** Solid `#4F46E5` background, text `#FFFFFF`, timestamp `caption-xs` in `rgba(255, 255, 255, 0.7)`. Align right.
- **Received:** Solid `#EEF2F7` background, text `#0F172A`, timestamp `caption-xs` in `#64748B`. Align left.
- **Voice Note Bubble:** Contains a circular play/pause toggle button, a mini-waveform track filled with accent `#14B8A6`, and duration text in `caption`.
- **Photo Bubble:** Inset media with `12px` interior radius, enclosed in an outer bubble with overlay timestamps rendered in white on a gradient scrim.

### Avatars & Status Indicators
- **Avatars:** Rendered in `40px` (list) and `48px` (thread header) circular elements. Fallback shows bold single/double initials with dynamic, accessible pastel background fills.
- **Online Indicator:** A `10px` circular dot colored `#22C55E` with a `2px` `#FFFFFF` border, anchored to the bottom-right perimeter of the avatar.

### List Rows & Cards
- **Conversation List Items:** Height of `72px`, radius `16px`. Active touch displays `#F1F5F9`. Unread badge sits right-aligned in `#4F46E5` with bold white `caption-xs`.
- **Bottom Sheets:** `#FFFFFF` background, `24px` top border radius, topped with a centered drag handle (`36px × 4px`, `#CBD5E1`, `2px` radius).