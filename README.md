# ainotes
AI interactive notes maker strictly follow this prompt for creating this project

App Name: NoteVerse AI
Purpose: An intelligent, interactive notes generation web app that teaches any topic from absolute scratch to advanced level. Users choose their education level, pick a domain, enter a topic, and receive deeply structured, beautifully formatted, AI-generated notes tailored to their learning context.
Tech Stack: HTML + Vanilla CSS + Vanilla JavaScript for frontend. Python with Flask for backend. Groq API as the AI engine.

EDUCATION LEVELS
The app must support four distinct learning profiles, each affecting the tone, depth, vocabulary, and example style of generated notes:
School — Simple language, relatable real-world analogies, no jargon, visual descriptions, friendly tone. Concepts explained as if to a curious 12–16 year old.
College — Moderate depth, introduction of formal terminology, some mathematical or theoretical grounding, practical examples alongside theory.
University — Advanced and rigorous. Formal definitions, proofs where applicable, research-level insights, domain-specific conventions and notation.
Self-Learn — Practical and project-oriented. Skip unnecessary theory, focus on how things work in the real world, with actionable steps and use cases.

DOMAINS SUPPORTED
The app must support at minimum the following domains, each with its own icon/emoji and color accent:
Technology, Computer Science, Mathematics, Physics, Chemistry, Biology, Mechanical Engineering, Electrical Engineering, Science (General), Academic & Humanities, Economics, History, Medicine & Health, Law & Civics, Environmental Science, Psychology, Philosophy, and Architecture.
Each domain influences the style of notes — for example, Computer Science notes include code snippets, Mathematics notes include formulas and proofs, Biology notes include diagrams described in text, History notes include timelines and events.

DEPTH LEVELS
Users must also choose how deep they want the notes to go:
Quick Overview — 500 to 800 words. Core idea, key terms, one or two examples. Fast to read.
Standard — 1200 to 2000 words. Full explanation with examples, step-by-step breakdown, common questions answered.
Deep Dive — 3000 or more words. Everything from prerequisites to advanced theory. All sub-topics covered thoroughly. Includes edge cases, advanced applications, and open problems.

FRONTEND — PAGES & SECTIONS
The app is a single-page application. No routing needed. All sections exist on one HTML page and are shown or hidden dynamically.
Navbar
Sticky at top. Shows the app logo and a short tagline. Clean, minimal, glassmorphism style with a subtle bottom border glow.
Hero Section
Large, centered heading that communicates the app's purpose. An animated subtitle. A badge or pill that says something like "AI-Powered Learning." This section sets the tone — it should feel premium and intelligent.
Control Panel
This is the heart of the app. It is a large card containing four sequential steps:
Step 1 — Education Level Selector
Four pill-shaped buttons: School, College, University, Self-Learn. Only one can be active at a time. The active pill gets a glowing accent color fill.
Step 2 — Domain Selector
A grid of domain cards. Each card has an emoji icon and a label. Clicking one selects it, giving it a highlighted border and background. Only one domain active at a time.
Step 3 — Topic Input
A full-width text input where the user types their topic. Examples shown as placeholder text. Below the input, show the last 5 recently searched topics as clickable chips stored in localStorage.
Step 4 — Depth Selector
Three pill buttons: Quick Overview, Standard, Deep Dive. One active at a time.
Generate Button
Full-width, gradient background, with a shimmer animation on hover. Shows a spinner while loading.
Output Area
Hidden by default. Appears after notes are generated. Contains:
A header bar with the topic name, a level badge, a domain icon, and an estimated reading time.
A sticky Table of Contents sidebar on desktop. This TOC is built automatically from the headings in the generated notes and highlights the current section as the user scrolls using IntersectionObserver.
The main notes content rendered from Markdown. This includes headings, paragraphs, bullet points, numbered lists, code blocks with copy buttons, formula blocks, and callout boxes.
Three types of styled callout boxes must be visually distinct — Key Insights in green/teal, Common Mistakes in amber/orange, and Tips or Notes in blue/purple.
A Practice Questions section rendered as an accordion — questions are visible but answers are hidden until the user clicks to expand them.
A Copy All and Print button in the output header.
Follow-up Chat Strip
Below the notes output, a minimal input bar where users can ask follow-up questions about the topic. The chat preserves context from the current session. Each Q&A pair is appended below the notes in a styled conversation bubble format.
Footer
Simple one-line footer with app name and a brief credit line.

FRONTEND — DESIGN SYSTEM
Aesthetic Direction
Dark, editorial luxury. Think of a sophisticated knowledge terminal. The interface should feel intelligent, calm, and premium — not playful or childish. Every element should feel intentional.
Color Palette
Use CSS variables for all colors. Near-black background, dark surface cards, electric violet as the primary accent, teal as the secondary accent, light gray for primary text, muted purple-gray for secondary text, and a subtle dark border color.
Typography
Use Google Fonts exclusively. A geometric display font like Syne for all headings and the logo. A clean readable font like DM Sans for body text and UI labels. A monospace font like JetBrains Mono for all code blocks and technical content. Never use system fonts, Arial, Inter, or Roboto.
Layout
CSS Grid for the domain card grid and the two-column output layout (TOC + content). Flexbox for navbars, pill groups, and inline elements. The layout must be fully responsive — single column on mobile, two column on desktop for the output area. Use clamp() for fluid font sizing.
Animations
All animations defined as CSS keyframes. Implement fadeInUp for content reveals, shimmer for the loading skeleton and button hover, pulseGlow for the active selection states, and a spin animation for the loading spinner. Stagger the animation delays so sections appear sequentially, not all at once.
Interactive States
Every clickable element must have a visible hover state, an active/pressed state, and a focus state for keyboard accessibility. Active selections (level, domain, depth) must be clearly distinguished from inactive ones using color, border, and shadow.
Custom Scrollbar
Styled with a thin accent-colored thumb on a dark track. Applied globally.
Skeleton Loader
While the API is loading, show placeholder shimmer blocks where the notes content will appear. These are animated gray bars of varying widths that pulse to indicate loading activity.

FRONTEND — JAVASCRIPT BEHAVIOR
State Object
Maintain a single state object in JS that tracks the selected level, domain, topic, depth, the current notes content, and the follow-up conversation history.
Validation
Before hitting the API, validate that all four inputs are filled. Show clear inline validation messages near the relevant step, not just a generic alert.
API Communication
Use the Fetch API for all backend calls. Handle network errors, API errors, and empty responses gracefully. Show styled toast notifications for errors (bottom-right, auto-dismiss after 4 seconds).
Markdown Rendering
Use the marked.js library loaded from CDN to parse the Markdown response from the AI into HTML. After rendering, post-process the HTML to add copy buttons to code blocks, wrap callout sections in styled boxes, and build the Table of Contents.
Table of Contents + Scrollspy
After rendering, extract all H2 and H3 headings, assign them anchor IDs, and build a TOC list in the sidebar. Use IntersectionObserver to track which section is currently in view and highlight the corresponding TOC item.
Accordion for Practice Questions
Questions section rendered with hidden answers. Clicking a question smoothly expands the answer using a max-height CSS transition.
Recent Topics
Store the last 5 successfully generated topics in localStorage. Display them as clickable chips below the topic input. Clicking a chip pre-fills the topic input.
Copy and Print
Copy All Notes copies the full plain text to clipboard and shows a brief success toast. The Print button triggers window.print() and a dedicated print CSS stylesheet renders the notes cleanly on white background with black text.

BACKEND — FLASK API
File Structure
The backend is a single app.py file. Environment variables are loaded from a .env file using python-dotenv. The Groq client is initialized once at startup using the API key from the environment.
Route — GET /
Serves the main index.html template. No data passed to template.
Route — POST /api/generate
Accepts a JSON body with four fields: level, domain, topic, and depth. Validates that all fields are present and non-empty. Builds a detailed system prompt based on these inputs. Calls the Groq API with the system prompt and a user message containing the topic. Returns the notes as a JSON response with a single key called notes.
Route — POST /api/followup
Accepts a JSON body with the follow-up question, the original topic, level, domain, and the conversation history array. Builds a messages array for the Groq API including a system prompt that keeps context of the topic and level, the last four turns of history, and the new question. Returns the AI answer as JSON with a key called answer.
Error Handling
All routes wrapped in try-except blocks. Any exception returns a JSON error response with an appropriate HTTP status code. Never crash or return an HTML error page to the frontend.
CORS
Enable CORS for all routes to allow frontend-backend communication during local development.

BACKEND — GROQ PROMPT ENGINEERING
The system prompt sent to Groq must be dynamically constructed and must instruct the model to:
Always respond in well-structured Markdown. Never respond in plain prose paragraphs without structure.
Follow a strict output template every time: Introduction, Prerequisites, Core Concepts, Step-by-Step Explanation, Technical or Mathematical Formulation (if applicable), Real-World Examples and Applications, Visual Description or Analogies, Advanced Topics (for deep dives), Key Insights callout, Common Mistakes callout, Summary, Practice Questions with hidden answers using HTML details/summary tags, and Further Reading.
Adjust vocabulary, depth, and example types based on the education level parameter.
Use domain-appropriate conventions — code snippets for CS/Tech, formulas for Math/Physics, biological terminology for Biology, historical dates and events for History, and so on.
For the deep dive depth level, cover the topic exhaustively — from what a complete beginner needs to know all the way to what a researcher or practitioner would find useful.

ADDITIONAL FEATURES
Word Count & Reading Time — Calculate and display estimated reading time in the output header based on word count of the generated notes.
Theme Toggle — A sun/moon icon button in the navbar toggles between dark and a slightly lighter dark-surface theme (not a full white light mode, just a softer dark variant).
Responsive Notes Typography — On mobile, the TOC collapses into a horizontal scrollable strip at the top of the output. Headings resize using clamp(). Padding adjusts for comfortable mobile reading.
Domain-Specific Color Accents — Each domain has a slightly different accent tint applied to its card and to the output section header when that domain is active. For example, Computer Science uses electric blue, Biology uses green, Chemistry uses orange, Mathematics uses violet.
Smooth Scroll to Output — After generation, the page smoothly scrolls down to the output area.
Export to PDF: Use html2pdf.js to let students save their notes.
Progress Tracking: Use localStorage to save which domains the user has explored.
Voice Explanation: Integrate the Web Speech API to read the notes aloud.
