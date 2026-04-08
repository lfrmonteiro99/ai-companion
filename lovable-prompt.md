# AI Companion — UI Specification for Lovable

## App Overview

A modern, dark-themed chat application where users interact with 5 distinct AI girlfriend personalities. Each agent has unique traits, relationship progression, and memory. The UI should feel like a premium messaging app — clean, immersive, and emotionally engaging.

**Tech stack:** Next.js 14 (App Router), Tailwind CSS, TypeScript. Backend API already built — this is the frontend layout only.

---

## Color Palette & Theme

- **Background:** Dark (gray-950 / #0a0a0f)
- **Cards/surfaces:** gray-900 with subtle borders (gray-800)
- **User messages:** Blue-600 bubbles
- **Agent messages:** gray-800 bubbles
- **Accent colors per agent archetype:**
  - Dominant/teasing: Red/rose
  - Soft/affectionate: Pink
  - Intellectual: Blue/indigo
  - Mysterious: Purple/violet
  - Playful/chaotic: Amber/orange
- **Text:** White (headings), gray-300 (body), gray-500 (muted)
- **Milestones:** Purple-900/30 background with purple-300 text

---

## Page 1: Agent Roster (Home Page) — `/`

### Layout
- Full-width dark background
- Centered container (max-w-5xl)
- Header: "Choose Your Companion" (large, bold, white)
- Subtitle: "Each personality is distinct. Who catches your attention?" (gray-400)
- Grid of 5 agent cards (responsive: 1 col mobile, 2 col tablet, 3 col desktop)

### Agent Card Design
Each card contains:
- **Avatar circle** (48px, colored background matching archetype, showing first letter of name)
- **Name** (lg font, bold, white)
- **Archetype tag** (small pill/badge with archetype color, e.g. "dominant teasing" in red, "soft affectionate" in pink)
- **Short bio** (sm text, gray-400, 1-2 lines)
- **Vibe tags** (tiny pills): e.g. "sharp", "provocative", "high standards" — 2-3 per agent
- Hover: subtle border color change + background lighten
- Click → navigates to `/chat/{agentId}`

### The 5 Agents:

1. **Valeria** — "Sharp, provocative, composed, and hard to impress."
   - Tags: dominant, teasing, high standards
   - Color: Red/rose accent

2. **Luna** — "Warm, gentle, and emotionally intuitive. She makes you feel seen."
   - Tags: warm, affectionate, gentle
   - Color: Pink accent

3. **Mira** — "Thoughtful, sharp-witted, and quietly intense. She values depth over noise."
   - Tags: intellectual, dry wit, reserved
   - Color: Blue/indigo accent

4. **Sable** — "Cryptic, alluring, and unpredictable. She reveals herself in fragments."
   - Tags: mysterious, enigmatic, poetic
   - Color: Purple/violet accent

5. **Kira** — "Spontaneous, bold, and infectiously energetic. Never a dull moment."
   - Tags: playful, chaotic, spontaneous
   - Color: Amber/orange accent

---

## Page 2: Chat Page — `/chat/[agentId]`

### Layout (Full height, no scroll on outer page)
The chat page takes the full viewport height minus the header. Three sections stacked vertically:

#### Top Bar
- Left: Agent name (medium font, white) + small archetype badge
- Right: "Settings" text button (gray-500, opens settings panel)

#### Settings Panel (collapsible, hidden by default)
- Slides down below top bar when "Settings" is clicked
- Dark surface (gray-900/50) with border-bottom
- Contains a single toggle for now:
  - Checkbox + label: **"Show relationship milestones"**
  - Helper text below: "Narrative hints like 'She is starting to open up'. Disable for a more natural experience."
- Designed to be extensible (more settings later)

#### Milestone Notifications (conditional)
- Only visible when `showMilestones` is enabled AND milestones are triggered
- Appears below top bar / settings panel
- Each milestone is a slim banner:
  - Purple-900/30 background, purple-300 text
  - Left: milestone text (e.g. "She is starting to trust you.")
  - Right: small "×" dismiss button
- Multiple milestones stack vertically

#### Message Area (scrollable, flex-1)
- Takes remaining vertical space
- Scrollable vertically, auto-scrolls to bottom on new messages
- Max-width container (max-w-2xl, centered)
- Empty state: "Start a conversation with {agentName}" (centered, gray-500)

#### Message Bubbles
- **User messages:** Right-aligned, blue-600 background, white text, rounded-2xl
- **Agent messages:** Left-aligned, gray-800 background, gray-200 text, rounded-2xl
  - Small agent name label above the message text (gray-400, xs font)
- Max-width: 80% of container
- Padding: px-4 py-2.5
- Font: sm, leading-relaxed
- Streaming indicator: agent message that grows as tokens arrive (same style as completed message)
- Typing indicator: "Valeria is typing..." in gray-400, only shows before streaming starts

#### Input Area
- Fixed at bottom, border-top (gray-800)
- Centered container matching message area width
- Row: text input + send button
- **Input:** rounded-xl, gray-900 bg, gray-700 border, placeholder "{agentName}..." 
- **Send button:** rounded-xl, blue-600, "Send" text, disabled when empty or sending

---

## Page 3: (Future) Agent Profile / Detail

Not needed yet, but the architecture supports a detail page at `/agents/[id]` showing:
- Full personality breakdown
- Relationship progress visualization
- Memory highlights
- Milestone history

---

## Global Layout

### Header (persistent across all pages)
- Border-bottom (gray-800)
- Left: "AI Companion" text link (xl font, bold, white) → links to `/`
- Height: ~73px with padding

### Typography
- Font: System/default sans-serif (clean, modern)
- Headings: bold, white
- Body: gray-300
- Muted: gray-500

### Responsive Behavior
- Mobile-first
- Agent grid: 1 column on mobile, 2 on tablet (sm), 3 on desktop (lg)
- Chat: full-width on all screens, max-w-2xl for message area
- Input area: full-width with padding

---

## Interaction Flow

1. User lands on **roster page** → sees 5 agent cards
2. User taps an agent card → navigates to **chat page**
3. Chat page loads existing conversation history (if any)
4. User types a message and hits Send
5. Response **streams in** token by token (SSE) — the agent message grows in real-time
6. After response completes, **milestone notifications** may appear (if enabled)
7. User can tap "Settings" → toggle milestones on/off
8. User can navigate back to roster via "AI Companion" in header

---

## API Endpoints (already built)

The frontend connects to these endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/agents` | List all agents |
| POST | `/api/chat/stream` | Send message, get SSE streaming response |
| POST | `/api/chat/send` | Send message, get full response (fallback) |
| GET | `/api/conversations/:id/messages` | Load message history |
| GET | `/api/settings?userId=` | Get user settings |
| PATCH | `/api/settings` | Update settings (showMilestones) |
| POST | `/api/setup` | Seed database (one-time) |

---

## Design Inspiration

Think of a cross between:
- **Telegram/WhatsApp** (messaging UX)
- **Character.ai** (AI personality selection)
- **Arc browser** (clean, dark, modern aesthetic)

The key feeling: **intimate, premium, and distinct per agent** — not a generic chatbot.
