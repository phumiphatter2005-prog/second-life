# Second Life — Design System

ดัดแปลงจากระบบ "Genesis": สีหลักม่วง #7E2A8C, พื้นสว่างเท่านั้น, ฟอนต์ Prompt + IBM Plex Sans Thai

## Overview
An editorial precision interface for a university second-hand marketplace. The aesthetic is quietly confident — bold display typography, generous spacing, and gallery-frame card surfaces. Professional and modern without being sterile. High information density balanced by breathing room.

## Colors
- **Primary** (#7E2A8C): CTAs, active states, links, focus rings, interactive highlights — purple
- **Primary Hover** (#65216F): Darker purple for hover states on primary elements
- **Brand Green** (#1F7A4D): End stop of the headline gradient; also tints the leaf icon in the hero badge
- **Headline Gradient** (`linear-gradient(90deg, #7E2A8C, #1F7A4D)`): Used only on the highlighted words of the homepage headline ("ชีวิตที่สอง"), applied as text fill (`background-clip: text`) with ~0.12em vertical padding so Thai tone marks above the line are not clipped. Replaces the old flat green #20970B
- **Neutral** (#9C9C9C): Muted text, placeholders, timestamps, disabled states
- **Background** (#FAFAFA): Page background, light warm gray
- **Surface** (#FFFFFF): Cards, panels, modals, nav backdrop
- **Text Primary** (#0A0A0A): Headings, body text, primary labels — near-black
- **Ink Deep** (#2A1540): Dark purple surface for the "About" panel; the footer uses the darker **Ink Deeper** (#1C1027). Text on it is #FAFAFA; secondary text is #FAFAFA at 80% opacity (never lower) so everything stays readable
- **Step colors** (How-it-works): post = Primary #7E2A8C on #F6ECF8, meet-up = Amber #B45309 on #FEF3C7, passed-on = Brand Green #1F7A4D on #E3F2EA
- **SDG colors**: SDG 12 #BF8B2E, SDG 11 #FD9D24 (official). Used only as the tag part of SDG badges, with near-black text #1A1206 — white on these oranges fails contrast
- **Text Secondary** (#6B6B6B): Descriptions, metadata, secondary labels
- **On Primary** (#FAFAFA): Text on filled primary buttons (never pure white)
- **Border** (#E8E8EC): Card borders, dividers, input borders — subtle and recessive
- **Listing type colors** (CSS `--type-*`, one set used everywhere a type appears: image-corner tag, badge, price line, search-filter dot — home shelves, conveyor belt, search, favorites, product detail, chat, admin):

  | Type | Tag / badge | Price line |
  |---|---|---|
  | ขาย | Primary #7E2A8C fill, On Primary text (`--type-sell`, `--type-sell-on`) | "฿…" in #1C1426 (`--type-sell-price`), bold — not purple |
  | แลกเปลี่ยน | #E8F0FA fill, #2563A6 text (`--type-swap-bg`, `--type-swap`) | "แลกเปลี่ยน" in #2563A6, bold |
  | แจกฟรี | #E8F5EE fill, #1F7A4D text (`--type-free-bg`, `--type-free`) | "ฟรี" in #1F7A4D, bold |

  Never use amber/orange for แลกเปลี่ยน. "ส่งต่อแล้ว" is a status, not a type: white capsule, Success ink
- **Success** (#10B981): Passed-on status, confirmations, positive indicators
- **Warning** (#F59E0B): Pending states, caution banners, reported listings
- **Error** (#EF4444): Destructive actions, validation errors, banned status


### Dark mode

Two choices: สว่าง / มืด. Until the user picks one, the site follows `prefers-color-scheme`. Stored in localStorage `sl-theme`; a tiny script in every <head> sets `<html data-theme>` before paint (no white flash). The toggle is a sun/moon button on the top bar (desktop) and a 2-way capsule in the drawer and the profile menu (phones). Every color is a CSS variable in `:root`; dark mode only swaps the variables. Product photos are never filtered or dimmed.

| Token | Light | Dark |
|---|---|---|
| Background / Surface / Alt | #FAFAFA / #FFFFFF / #F4F4F5 | #120E18 / #1A1422 / #221A2C |
| Border / Strong | #E8E8EC / #C9C9D1 | #2E2538 / #4A3D57 |
| Text / Secondary / Neutral | #0A0A0A / #6B6B6B / #707070 | #F4F1F7 / #B4AABF / #948A9F |
| Primary fill (white text) | #7E2A8C | #9B44AA |
| Primary text & links (--primary-ink) | #7E2A8C | #D49BE0 |
| Primary soft | #F6ECF8 | #2D1B36 |
| ขาย tag / price | #7E2A8C bg / #1C1426 | #7E2A8C bg / #F4F1F7 |
| แลกเปลี่ยน text / tag bg | #2563A6 / #E8F0FA | #8DBEF5 / #16253A |
| แจกฟรี text / tag bg | #1F7A4D / #E8F5EE | #5FD49A / #13291E |
| Bottom tab bar | #2A1540 | #1A1422, border #2E2538 |

All text meets 4.5:1 (3:1 for large text) in both modes.

## Typography
- **Display Font**: Prompt — Google Fonts (headings, prices, numbers)
- **Body Font**: IBM Plex Sans Thai — Google Fonts (body and UI text)
- **Code Font**: JetBrains Mono — Google Fonts (student IDs, codes)

Two weights only: 400 (regular) and 600 (semibold — headings, buttons, labels). Headings use tight letter spacing (-0.02em to -0.03em; Thai glyphs need slightly looser tracking than Latin).

Type scale: Display 72px, Headline 60px, Section heading 32px, Subhead 24px, Body 15px, Small 13px, Caption 12px, Overline 11px uppercase.

## Elevation
Minimal shadows. Cards rest flat with a 1px border and gain a subtle shadow on hover (0 8px 30px rgba(0,0,0,0.08)) with a -2px lift. Primary buttons gain a tinted glow on hover (0 4px 12px rgba(126,42,140,0.35)). The nav uses backdrop-blur rather than a shadow. Dropdowns and the mobile drawer use shadow-lg. Focus states use a 3px purple ring (0 0 0 3px rgba(126,42,140,0.12)).

## Components
- **Buttons**: Primary = purple fill, 6px radius. Secondary = transparent + 1px border. Ghost = text only. Destructive = red text + red border. All shift up 1px on hover. Sizes 32 / 38 / 44px.
- **Cards**: White surface, 1px border, 12px radius. Hover lifts 2px. 200ms transitions.
- **Listing cards**: No border and no surface — a 1:1 image with 14px radius sits straight on the page background; hover zooms the image slightly (scale 1.04), no lift. On the image: type pill top-left (colored per **Listing type colors**; ส่งต่อแล้ว = white capsule, green ink) and the heart button top-right. Below: name (one line, ellipsis) / for แลกเปลี่ยน only, "อยากแลก: …" (12px, Text Secondary) when given / pickup point · condition (12px, Text Secondary) / price line in the type color + seller ★ rating if any. No seller row.
- **Home shelves**: "ประกาศล่าสุด", "แจกฟรี", "แลกเปลี่ยน" as horizontal rows (up to 15 items, empty rows hidden). Head: title left; "ดูทั้งหมด →" plus 32px round ‹ › buttons right (buttons hidden when the row doesn't overflow, disabled at each end). 5 cards per row on desktop, 4 at ≤ 1024px, 2½ on phones with swipe + scroll snap. Search and favorites keep the grid.
- **Avatars**: Circle with the initial letter; the profile photo (256×256) is layered on top, so the letter shows while loading or if the image fails. Sizes 20 / 32 / 44 / 128px. Profile page: 128px avatar with a 44px purple camera button bottom-right; square crop dialog with a circular guide.
- **Inputs**: 1px border, 6px radius, 10px × 14px padding, 14px text (16px on phones to stop iOS zoom). Focus: purple border + 3px ring. Error: red border.
- **Chips**: Pill, gray-100 background, gray-600 text, 4px × 12px padding, 12px text. Active = purple fill. Status chips use the same shape with semantic colors.
- **Category pills** (home + search, one shared component): a single row of 40px capsules — 1px Border, Surface fill, 14px text, 16px line icon (Text Secondary) before the name. Selected = Primary fill, On Primary text and icon, no border (hover Primary Hover). Hover = Border Strong (#C9C9D1) + gray fill (#F4F4F5). No item counts; categories with no listings are hidden (except "ทั้งหมด" and the selected one). Overflow scrolls sideways with the scrollbar hidden; a 48px fade on the right edge shows while more pills sit off-screen. Phones: the row bleeds to the screen edges. On both pages the pills filter in place without reloading or scrolling. Home: they filter all shelves (ล่าสุด / แจกฟรี / แลกเปลี่ยน) with a ~180ms fade out/in, hide shelves left empty, and show "ยังไม่มีสินค้าในหมวดนี้" + a "ลงประกาศ" button (dashed 12px-radius box) if every shelf is empty; each shelf's "ดูทั้งหมด →" carries the chosen category (search.html?type=free&cat=book). Search: the pills replace the old underline tabs.
- **Hero badge**: Pill above the headline with a leaf icon, 14px text, surface background and 1px border.
- **How-it-works steps**: 12px-radius cards with a 48px icon in a 76px tinted circle (step color), a large faint step number (01/02/03, 10% opacity) as a watermark top-right, and dashed arrow connectors between cards (horizontal on desktop, vertical on the left on phones). Hover lifts 4px and the border turns the step color.
- **About panel**: Ink Deep, 24px radius, 48px padding. Stats sit in translucent cards (white 8% fill, 16% border) with a round icon, a 44px number that counts up on scroll, and a label.
- **Footer**: Ink Deeper (#1C1027 — slightly darker than the About panel so the two separate clearly), white text. One row: logo + tagline on the left, a small plain "ตอบโจทย์ SDG 12.5 และ SDG 11.6" note on the right (no colored badges — those live in the About panel); a thin divider, then "Second Life for a Better Tomorrow". On phones everything stacks, centered.
- **Lists**: Stacked rows, 1px dividers, 12px × 16px padding, hover background.
- **Checkboxes**: 20px, rounded-full, purple when checked.
- **Tooltips**: Native `title` attributes only.
- **Navigation** (≥ 768px): a floating sticky capsule (radius 999px, 16px from the top, as wide as the container content, white / dark #1A1422, shadow 0 6px 24px rgba(28,20,38,.07), no bottom border). Left: logo. Center: หน้าแรก / หมวดหมู่ / ข้อความ / รายการโปรด capsules — current page #1C1426 fill + white text (dark: #F3EEF7 + dark text) with aria-current="page", others #5F566B text, hover #F2EFF5; icons only below 1280px (names in tooltip/aria-label). Right: theme toggle, a 220px #F2EFF5 search capsule (Enter → search.html?q=…; a round search button below 1100px), "+ ลงประกาศ" outline #E9E4EE capsule, and the #7E2A8C "เข้าสู่ระบบ" capsule (avatar when signed in). Phones (< 768px): 44px rounded ☰ button top-left opens a left drawer (80% width, max 320px; logo + ×, user box, icon links with the current page in light purple, logout at the bottom; dimmed + blurred backdrop; closes with ×, backdrop or Esc; focus moves in and returns to ☰). A floating bottom tab bar (72px tall, 12px from the bottom and sides, plus the iPhone safe area): white capsule, no border, shadow 0 8px 28px rgba(28,20,38,.10) (dark: #1A1422, border #2E2538, text #B8AEC4). Five exactly equal grid columns (repeat(5, 1fr)), every button centred both ways: หน้าแรก / หมวดหมู่ / centre "ลงประกาศ" / ข้อความ / รายการโปรด (หลังบ้าน lives in the account menu). Each slot = 22px line icon, 4px gap, 12px Thai label in #5F566B, all on one level; the current page gets a #F5ECF7 tile (~64×56px, never wider than its column), radius 16px, #7E2A8C bold (dark: #2E2538 / #C487D2) and aria-current="page". The centre button is a 64px #7E2A8C circle centred in column 3 with a 28px white + (2.5px strokes), poking only 8px above the bar, shadow 0 8px 20px rgba(126,42,140,.35), aria-label="ลงประกาศ". Pressing scales to .95 in 150ms (off with prefers-reduced-motion). Content gets bottom padding `--tabbar-space` (bar + 24px + the 8px the circle pokes up + safe area) so the bar never covers it.
- **AI listing helper** (post.html, top of step 1): 8px-radius panel on the Background color with 88px photo thumbnails (× to remove) and a dashed "เพิ่มรูป" tile, up to 3. A Warning-soft notice about Google Gemini sits directly above the full-width secondary "ให้ AI ช่วยกรอก" button (secondary, because "ถัดไป" is the section's one primary button). While waiting: spinner + "AI กำลังวิเคราะห์...". Result = white box with an amber "ผลจาก AI โปรดตรวจสอบ" tag, the filled values, and a confidence meter (≥ 80% Success, 60–79% Warning, < 60% Error). Not a product or blurry = Warning-soft box, nothing filled. Suggested price sits under the price field with a secondary "ใช้ราคานี้" button. AI-filled fields show a small amber "AI" tag beside the label until the user edits that field.
- **Search**: Global search on ⌘K / Ctrl K. Rounded-xl bar with magnifier icon; no shortcut badge (the shortcut shows only in the tooltip).
- **Search filters** (search.html): Desktop = 300px sticky left panel (scrolls inside if taller than the screen). Head "ตัวกรอง" + a text link "ล้าง (n)" top-right, shown only when panel filters are set. Group titles 14px semibold, no letter spacing. Type = 4 equal segments in one row (ทั้งหมด / ขาย / แลก / แจกฟรี), each with a 6px dot (neutral / then the three type colors #7E2A8C / #2563A6 / #1F7A4D); the selected one gets a white fill, purple border and purple text. Condition = checkbox rows with a short description under each, multi-select. Price = min – max number inputs side by side. Category lives only in the category pills above the results. Above results: full-width 44px search field with magnifier, then category pills, then "สินค้าที่พบ N รายการ" left + sort select (ล่าสุด / ราคาต่ำ-สูง / ราคาสูง-ต่ำ) right, then removable chips (×) for every active filter. No results → message + "ล้างตัวกรองทั้งหมด". Phones (≤ 860px): the panel becomes a bottom sheet (16px top radius, dimmed backdrop, closes with ×, backdrop or Esc) opened by a "ตัวกรอง" button next to the search field (purple count badge); the sheet footer has a full-width "ดูผล N รายการ" button.

## Spacing
- Base unit 4px; scale 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
- Section spacing: 32px mobile, 48px tablet, 64px desktop
- Container max 1280px with 24px side padding (16px on phones)
- Card grid gap 20–24px

## Border Radius
- 4px: tags, badges, inline code
- 6px: buttons, inputs, selects
- 8px: metadata cards, dropdowns, panels
- 12px: cards, search bar, featured sections
- 14px: listing card images
- 9999px: avatars, status dots, pill chips

## Do's and Don'ts
- Do use purple only for interactive elements — never for decoration or static text
- Do keep the 4px spacing grid
- Do use Prompt for headings and IBM Plex Sans Thai for body — never swap them
- Do keep cards at 12px radius (listing images 14px) and buttons/inputs at 6px
- Do test at 360px and 1280px
- Don't use pure black (#000000) or pure white (#FFFFFF) for text
- Don't add decorative gradients or illustrations — exceptions: the interactive dot grid, the headline gradient text, and the faint leaf pattern (≤ 7% opacity) in the corner of the dark About panel
- Don't use shadows on static elements
- Don't use more than two font weights on a screen
- Don't place more than one filled primary button in the same section
