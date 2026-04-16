# UI UX Pro Max Skill
# Design intelligence for APEX Command Center
# Stack: React + Vite + Tailwind-inspired custom CSS

## Active Design System
- Style: Dark tactical dashboard (military/fintech aesthetic)
- Primary: #f0a30a (amber/gold)
- Background: #030308 (near black)
- Panel: #0a0a18 (dark blue-black)
- Success: #18c93a (green)
- Danger: #e03010 (red)
- Warning: #e8b820 (yellow)
- Font: Orbitron (headers) + Share Tech Mono (data)

## UI Patterns
- All panels use Panel component with label prop
- Buttons use className="btn" or "btn bsm" (small)
- Inputs use className="inp"
- Spinners use <Spinner label="..."/>
- All colors via CA, CB, CC, CD, CG, CR, CY, CA constants
- No bare string concat in JSX label props — always use {"string"+var}

## Component Rules
- Never use React form elements
- Always use onClick/onChange handlers
- Data panels: dark background BD, border #1a1520
- Active/selected: gold border CA+"55"
- fontFamily Orbitron for all metric numbers and labels
