/* ============================================================
   NoteVerse AI — Main JavaScript
   ============================================================ */

/* ── State ── */
const state = {
  level:   null,
  domain:  null,
  topic:   '',
  depth:   null,
  notes:   '',
  chatHistory: [],
};

/* ── DOM References ── */
const $ = id => document.getElementById(id);

const levelPills    = document.querySelectorAll('.pill-level');
const domainCards   = document.querySelectorAll('.domain-card');
const depthPills    = document.querySelectorAll('.pill-depth');
const topicInput    = $('topicInput');
const recentChips   = $('recentChips');
const generateBtn   = $('generateBtn');
const skeletonArea  = $('skeletonArea');
const outputArea    = $('outputArea');
const outputTopic   = $('outputTopic');
const outputLevel   = $('outputLevelBadge');
const outputDomain  = $('outputDomainBadge');
const outputTime    = $('outputTimeBadge');
const notesContent  = $('notesContent');
const tocList       = $('tocList');
const followupSec   = $('followupSection');
const chatHistory   = $('chatHistory');
const followupInput = $('followupInput');
const sendBtn       = $('sendBtn');
const toastContainer= $('toastContainer');
const themeToggle   = $('themeToggle');
const copyAllBtn    = $('copyAllBtn');
const printBtn      = $('printBtn');
const pdfBtn        = $('pdfBtn');
const voiceBtn      = $('voiceBtn');

/* ── Domain config ── */
const domainAccents = {
  technology:   '#3b82f6',
  cs:           '#2563eb',
  mathematics:  '#7c3aed',
  physics:      '#8b5cf6',
  chemistry:    '#f97316',
  biology:      '#10b981',
  mechanical:   '#6b7280',
  electrical:   '#eab308',
  science:      '#06b6d4',
  humanities:   '#ec4899',
  economics:    '#84cc16',
  history:      '#a16207',
  medicine:     '#ef4444',
  law:          '#64748b',
  environment:  '#22c55e',
  psychology:   '#a78bfa',
  philosophy:   '#c084fc',
  architecture: '#fb923c',
};

/* ── Theme Toggle ── */
const savedTheme = localStorage.getItem('nv-theme');
if (savedTheme === 'soft') { document.body.classList.add('theme-soft'); themeToggle.textContent = '☀️'; }

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('theme-soft');
  const isSoft = document.body.classList.contains('theme-soft');
  localStorage.setItem('nv-theme', isSoft ? 'soft' : 'dark');
  themeToggle.textContent = isSoft ? '☀️' : '🌙';
});

/* ── Pill / Card selection helpers ── */
function setActive(els, target) {
  els.forEach(el => el.classList.remove('active'));
  target.classList.add('active');
}

levelPills.forEach(pill => {
  pill.addEventListener('click', () => {
    setActive(levelPills, pill);
    state.level = pill.dataset.value;
    clearValidation('levelValidation');
  });
  pill.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pill.click(); } });
});

domainCards.forEach(card => {
  card.addEventListener('click', () => {
    setActive(domainCards, card);
    state.domain = card.dataset.value;
    const accent = domainAccents[state.domain] || 'var(--accent-primary)';
    domainCards.forEach(c => c.style.removeProperty('--domain-accent'));
    card.style.setProperty('--domain-accent', accent);
    clearValidation('domainValidation');
  });
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });
});

depthPills.forEach(pill => {
  pill.addEventListener('click', () => {
    setActive(depthPills, pill);
    state.depth = pill.dataset.value;
    clearValidation('depthValidation');
  });
  pill.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pill.click(); } });
});

topicInput.addEventListener('input', () => {
  state.topic = topicInput.value.trim();
  if (state.topic) clearValidation('topicValidation');
});

/* ── Recent Topics ── */
function getRecentTopics() {
  try { return JSON.parse(localStorage.getItem('nv-recent') || '[]'); } catch { return []; }
}
function saveRecentTopic(topic) {
  let recent = getRecentTopics().filter(t => t !== topic);
  recent.unshift(topic);
  recent = recent.slice(0, 5);
  localStorage.setItem('nv-recent', JSON.stringify(recent));
}
function renderRecentChips() {
  const topics = getRecentTopics();
  recentChips.innerHTML = '';
  if (!topics.length) return;
  const label = document.createElement('span');
  label.style.cssText = 'font-size:0.72rem;color:var(--text-muted);align-self:center;';
  label.textContent = 'Recent:';
  recentChips.appendChild(label);
  topics.forEach(t => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.type = 'button';
    chip.textContent = t;
    chip.addEventListener('click', () => {
      topicInput.value = t;
      state.topic = t;
      clearValidation('topicValidation');
    });
    recentChips.appendChild(chip);
  });
}
renderRecentChips();

/* ── Progress Tracking ── */
function getExploredDomains() {
  try { return JSON.parse(localStorage.getItem('nv-domains') || '[]'); } catch { return []; }
}
function saveExploredDomain(domain) {
  let domains = getExploredDomains();
  if (!domains.includes(domain)) {
    domains.push(domain);
    localStorage.setItem('nv-domains', JSON.stringify(domains));
  }
}

/* ── Validation ── */
function showValidation(id, msg) {
  const el = $(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}
function clearValidation(id) {
  const el = $(id);
  if (el) el.classList.remove('show');
}
function validateInputs() {
  let valid = true;
  if (!state.level)  { showValidation('levelValidation',  'Please select an education level.'); valid = false; }
  if (!state.domain) { showValidation('domainValidation', 'Please select a domain.'); valid = false; }
  if (!state.topic)  { showValidation('topicValidation',  'Please enter a topic.'); valid = false; }
  if (!state.depth)  { showValidation('depthValidation',  'Please select a depth level.'); valid = false; }
  return valid;
}

/* ── Toast ── */
function showToast(msg, type = 'info', duration = 4000) {
  const icons = { error: '❌', success: '✅', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  toast.addEventListener('click', () => toast.remove());
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* ── Reading Time ── */
function calcReadingTime(text) {
  const words = text.trim().split(/\s+/).length;
  const mins  = Math.ceil(words / 200);
  return `${mins} min read`;
}

/* ── Marked.js config ── */
marked.use({ breaks: true, gfm: true });

/* ── Render notes ── */
function renderNotes(markdown) {
  const html = marked.parse(markdown);
  notesContent.innerHTML = html;

  // Style callouts
  notesContent.querySelectorAll('blockquote').forEach(bq => {
    const text = bq.textContent;
    if (text.includes('💡') || text.toLowerCase().includes('key insight')) bq.classList.add('callout-insight');
    else if (text.includes('⚠️') || text.toLowerCase().includes('common mistake')) bq.classList.add('callout-mistake');
    else if (text.includes('🔵') || text.toLowerCase().includes('tip')) bq.classList.add('callout-tip');
  });

  // Wrap details content
  notesContent.querySelectorAll('details').forEach(details => {
    const nodes = Array.from(details.childNodes).filter(n => n.nodeName !== 'SUMMARY');
    const wrapper = document.createElement('div');
    wrapper.className = 'details-content';
    nodes.forEach(n => wrapper.appendChild(n));
    details.appendChild(wrapper);
  });

  // Add copy buttons to code blocks
  notesContent.querySelectorAll('pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = 'copy-code-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code');
      navigator.clipboard.writeText(code ? code.textContent : pre.textContent).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
      });
    });
    pre.appendChild(btn);
  });

  buildTOC();
}

/* ── Table of Contents ── */
function buildTOC() {
  const headings = notesContent.querySelectorAll('h2, h3');
  tocList.innerHTML = '';
  if (!headings.length) { $('tocSidebar').style.display = 'none'; return; }
  $('tocSidebar').style.display = '';

  headings.forEach((h, i) => {
    const id = `heading-${i}-${h.textContent.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '').toLowerCase()}`;
    h.id = id;
    const li = document.createElement('li');
    li.className = h.tagName === 'H3' ? 'toc-h3' : '';
    const a = document.createElement('a');
    a.href = `#${id}`;
    a.textContent = h.textContent;
    a.addEventListener('click', e => {
      e.preventDefault();
      h.scrollIntoView({ behavior: 'smooth' });
    });
    li.appendChild(a);
    tocList.appendChild(li);
  });

  // Scrollspy
  const tocLinks = tocList.querySelectorAll('a');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        tocLinks.forEach(a => a.classList.remove('active'));
        const link = tocList.querySelector(`a[href="#${entry.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });

  headings.forEach(h => observer.observe(h));
}

/* ── Generate Notes ── */
generateBtn.addEventListener('click', async () => {
  state.topic = topicInput.value.trim();
  if (!validateInputs()) return;

  // UI: loading
  generateBtn.classList.add('loading');
  generateBtn.disabled = true;
  skeletonArea.classList.add('show');
  outputArea.classList.remove('show');
  followupSec.classList.remove('show');

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: state.level, domain: state.domain, topic: state.topic, depth: state.depth }),
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      showToast(data.error || 'Failed to generate notes. Please try again.', 'error');
      return;
    }

    state.notes = data.notes;
    state.chatHistory = [];

    // Update output header
    outputTopic.textContent = state.topic;
    outputLevel.textContent = state.level;
    outputDomain.textContent = state.domain;
    outputTime.textContent = calcReadingTime(state.notes);

    renderNotes(state.notes);

    skeletonArea.classList.remove('show');
    outputArea.classList.add('show');
    followupSec.classList.add('show');
    chatHistory.innerHTML = '';

    saveRecentTopic(state.topic);
    saveExploredDomain(state.domain);
    renderRecentChips();

    // Smooth scroll to output
    outputArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Notes generated successfully!', 'success', 2500);

  } catch (err) {
    showToast('Network error. Please check your connection.', 'error');
  } finally {
    generateBtn.classList.remove('loading');
    generateBtn.disabled = false;
    skeletonArea.classList.remove('show');
  }
});

/* ── Follow-up Chat ── */
async function sendFollowup() {
  const question = followupInput.value.trim();
  if (!question) return;

  followupInput.value = '';
  sendBtn.disabled = true;

  // Append user bubble
  appendBubble('user', question);
  state.chatHistory.push({ role: 'user', content: question });

  // Typing indicator
  const typingId = appendTyping();

  try {
    const res = await fetch('/api/followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        topic:   state.topic,
        level:   state.level,
        domain:  state.domain,
        history: state.chatHistory,
      }),
    });
    const data = await res.json();
    removeTyping(typingId);

    if (!res.ok || data.error) {
      showToast(data.error || 'Failed to get a response.', 'error');
      return;
    }

    const answer = data.answer;
    state.chatHistory.push({ role: 'assistant', content: answer });
    appendBubble('ai', answer);

  } catch (err) {
    removeTyping(typingId);
    showToast('Network error. Please try again.', 'error');
  } finally {
    sendBtn.disabled = false;
    followupInput.focus();
  }
}

function appendBubble(role, content) {
  const wrap = document.createElement('div');
  wrap.className = `chat-bubble ${role}`;
  const label = document.createElement('div');
  label.className = 'bubble-label';
  label.textContent = role === 'user' ? 'You' : 'NoteVerse AI';
  const body = document.createElement('div');
  body.innerHTML = role === 'ai' ? marked.parse(content) : escapeHTML(content);
  wrap.appendChild(label);
  wrap.appendChild(body);
  chatHistory.appendChild(wrap);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function appendTyping() {
  const id = `typing-${Date.now()}`;
  const wrap = document.createElement('div');
  wrap.id = id;
  wrap.className = 'chat-bubble ai';
  wrap.innerHTML = '<div class="bubble-label">NoteVerse AI</div><div style="letter-spacing:0.2em;color:var(--text-muted)">● ● ●</div>';
  chatHistory.appendChild(wrap);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  return id;
}
function removeTyping(id) {
  const el = $(id);
  if (el) el.remove();
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

sendBtn.addEventListener('click', sendFollowup);
followupInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFollowup(); }
});

/* ── Copy All Notes ── */
copyAllBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(state.notes).then(() => {
    showToast('Notes copied to clipboard!', 'success', 2500);
  }).catch(() => {
    showToast('Failed to copy. Please try manually.', 'error');
  });
});

/* ── Print ── */
printBtn.addEventListener('click', () => { window.print(); });

/* ── Export PDF ── */
pdfBtn.addEventListener('click', () => {
  if (typeof html2pdf === 'undefined') {
    showToast('PDF export not available.', 'error');
    return;
  }
  const element = notesContent;
  const opt = {
    margin:      [0.5, 0.5, 0.5, 0.5],
    filename:    `${state.topic || 'notes'}.pdf`,
    image:       { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF:       { unit: 'in', format: 'letter', orientation: 'portrait' },
  };
  html2pdf().set(opt).from(element).save().catch(() => {
    showToast('Failed to export PDF.', 'error');
  });
});

/* ── Voice Explanation ── */
let speechInstance = null;
voiceBtn.addEventListener('click', () => {
  if (!('speechSynthesis' in window)) {
    showToast('Voice not supported in this browser.', 'error');
    return;
  }
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
    voiceBtn.textContent = '🔊';
    voiceBtn.title = 'Read aloud';
    return;
  }
  if (!state.notes) { showToast('Generate notes first.', 'info'); return; }

  // Convert rendered HTML to plain text via DOMParser for reliable TTS input
  const tempDoc = new DOMParser().parseFromString(marked.parse(state.notes), 'text/html');
  const plainText = tempDoc.body.textContent || tempDoc.body.innerText || '';

  speechInstance = new SpeechSynthesisUtterance(plainText);
  speechInstance.rate = 0.95;
  speechInstance.pitch = 1;
  speechInstance.onend = () => {
    voiceBtn.textContent = '🔊';
    voiceBtn.title = 'Read aloud';
  };
  speechSynthesis.speak(speechInstance);
  voiceBtn.textContent = '⏹';
  voiceBtn.title = 'Stop reading';
});
