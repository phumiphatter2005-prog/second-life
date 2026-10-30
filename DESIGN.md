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
- **Success** (#10B981): Passed-on status, confirmations, positive indicators
- **Warning** (#F59E0B): Pending states, caution banners, reported listings
- **Error** (#EF4444): Destructive actions, validation errors, banned status

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
- **Listing cards**: No border and no surface — a 1:1 image with 14px radius sits straight on the page background; hover zooms the image slightly (scale 1.04), no lift. On the image: type pill top-left (white capsule; ขาย near-black, แลกเปลี่ยน amber ink, แจกฟรี / ส่งต่อแล้ว green ink) and the heart button top-right. Below, three lines: name (one line, ellipsis) / pickup point · condition (12px, Text Secondary) / bold price + seller ★ rating if any. No seller row.
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
- **Navigation**: Sticky, 56px, backdrop-blur, 1px bottom border. Logo left, links centered, avatar dropdown right (> 1100px with labels; 821–1100px icons only with tooltips). Phones (≤ 820px): 44px rounded ☰ button top-left opens a left drawer (80% width, max 320px; logo + ×, user box, icon links with the current page in light purple, logout at the bottom; dimmed + blurred backdrop; closes with ×, backdrop or Esc; focus moves in and returns to ☰). A bottom tab bar keeps 4 buttons: หน้าแรก, ค้นหา, ลงประกาศ, ข้อความ.
- **Search**: Global search on ⌘K / Ctrl K. Rounded-xl bar with magnifier icon; no shortcut badge (the shortcut shows only in the tooltip).
- **Search filters** (search.html): Desktop = 300px sticky left panel (scrolls inside if taller than the screen). Head "ตัวกรอง" + a text link "ล้าง (n)" top-right, shown only when panel filters are set. Group titles 14px semibold, no letter spacing. Type = 4 equal segments in one row (ทั้งหมด / ขาย / แลก / แจกฟรี), each with a 6px dot (neutral / near-black / Warning / Success); the selected one gets a white fill, purple border and purple text. Condition = checkbox rows with a short description under each, multi-select. Price = min – max number inputs side by side. Category lives only in the category pills above the results. Above results: full-width 44px search field with magnifier, then category pills, then "สินค้าที่พบ N รายการ" left + sort select (ล่าสุด / ราคาต่ำ-สูง / ราคาสูง-ต่ำ) right, then removable chips (×) for every active filter. No results → message + "ล้างตัวกรองทั้งหมด". Phones (≤ 860px): the panel becomes a bottom sheet (16px top radius, dimmed backdrop, closes with ×, backdrop or Esc) opened by a "ตัวกรอง" button next to the search field (purple count badge); the sheet footer has a full-width "ดูผล N รายการ" button.

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
