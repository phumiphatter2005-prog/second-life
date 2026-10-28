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
- **Cards**: White surface, 1px border, 12px radius. Listing cards have a 200px image area on top, then name, seller avatar and stats. Hover lifts 2px. 200ms transitions.
- **Inputs**: 1px border, 6px radius, 10px × 14px padding, 14px text (16px on phones to stop iOS zoom). Focus: purple border + 3px ring. Error: red border.
- **Chips**: Pill, gray-100 background, gray-600 text, 4px × 12px padding, 12px text. Active = purple fill. Status chips use the same shape with semantic colors.
- **Category cards**: Compact row cards (icon + name + item count), equal height, 8px radius. Each category has its own pastel icon tile: all #EEF2FF, books #E0F2FE (blue), clothes #FCE7F3 (pink), stationery #FEF9C3 (yellow), electronics #F3E8FF (purple), dorm #DCFCE7 (green), other #F3F4F6 (gray). Hover lifts 2px; selected card gets a purple border + focus ring. On phones they form one horizontally scrolling row.
- **Hero badge**: Pill above the headline with a leaf icon, 14px text, surface background and 1px border.
- **How-it-works steps**: 12px-radius cards with a 48px icon in a 76px tinted circle (step color), a large faint step number (01/02/03, 10% opacity) as a watermark top-right, and dashed arrow connectors between cards (horizontal on desktop, vertical on the left on phones). Hover lifts 4px and the border turns the step color.
- **About panel**: Ink Deep, 24px radius, 48px padding. Stats sit in translucent cards (white 8% fill, 16% border) with a round icon, a 44px number that counts up on scroll, and a label.
- **Footer**: Ink Deeper (#1C1027 — slightly darker than the About panel so the two separate clearly), white text. One row: logo + tagline on the left, a small plain "ตอบโจทย์ SDG 12.5 และ SDG 11.6" note on the right (no colored badges — those live in the About panel); a thin divider, then "Second Life for a Better Tomorrow". On phones everything stacks, centered.
- **Lists**: Stacked rows, 1px dividers, 12px × 16px padding, hover background.
- **Checkboxes**: 20px, rounded-full, purple when checked.
- **Tooltips**: Native `title` attributes only.
- **Navigation**: Sticky, 56px, backdrop-blur, 1px bottom border. Logo left, links centered (desktop) or hamburger drawer (mobile), avatar dropdown right.
- **Search**: Global search on ⌘K / Ctrl K. Rounded-xl bar with magnifier icon and shortcut badge.

## Spacing
- Base unit 4px; scale 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
- Section spacing: 32px mobile, 48px tablet, 64px desktop
- Container max 1280px with 24px side padding (16px on phones)
- Card grid gap 20–24px

## Border Radius
- 4px: tags, badges, inline code
- 6px: buttons, inputs, selects
- 8px: metadata cards, dropdowns, panels
- 12px: listing cards, search bar, featured sections
- 9999px: avatars, status dots, pill chips

## Do's and Don'ts
- Do use purple only for interactive elements — never for decoration or static text
- Do keep the 4px spacing grid
- Do use Prompt for headings and IBM Plex Sans Thai for body — never swap them
- Do keep cards at 12px radius and buttons/inputs at 6px
- Do test at 360px and 1280px
- Don't use pure black (#000000) or pure white (#FFFFFF) for text
- Don't add decorative gradients or illustrations — exceptions: the interactive dot grid, the headline gradient text, and the faint leaf pattern (≤ 7% opacity) in the corner of the dark About panel
- Don't use shadows on static elements
- Don't use more than two font weights on a screen
- Don't place more than one filled primary button in the same section
