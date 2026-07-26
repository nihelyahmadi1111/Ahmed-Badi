/* ============================================================
   LANGUAGE TOGGLE (the "seal" is the signature interaction)
============================================================ */
const langToggle = document.getElementById('langToggle');
const sealFace = document.getElementById('sealFace');
const html = document.documentElement;

function setLang(lang){
  html.setAttribute('data-lang', lang);
  html.setAttribute('lang', lang);
  document.querySelectorAll('[data-fr]').forEach(el => {
    el.hidden = lang !== 'fr';
  });
  document.querySelectorAll('[data-en]').forEach(el => {
    el.hidden = lang !== 'en';
  });
  sealFace.textContent = lang === 'fr' ? 'FR' : 'EN';
  localStorage.setItem('site-lang', lang);
}

langToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-lang');
  const next = current === 'fr' ? 'en' : 'fr';
  langToggle.classList.add('stamping');
  setTimeout(() => langToggle.classList.remove('stamping'), 400);
  setLang(next);
});

// restore saved language preference
const savedLang = localStorage.getItem('site-lang');
if(savedLang){ setLang(savedLang); }

/* ============================================================
   MOBILE MENU
============================================================ */
const burger = document.getElementById('burger');
const navLinks = document.querySelector('.nav-links');
burger?.addEventListener('click', () => {
  navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
});

/* ============================================================
   APPOINTMENT FORM
   Currently shows a client-side confirmation. Wire this up to
   your backend (email service, CRM, DB) by replacing the
   fetch() call below with your real endpoint.
============================================================ */
const appointmentForm = document.getElementById('appointmentForm');
const formConfirm = document.getElementById('formConfirm');

appointmentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(appointmentForm);
  const data = {
    "Nom complet / Full Name": formData.get("fname"),
    "Email": formData.get("femail"),
    "Téléphone / Phone": formData.get("fphone") || "Non renseigné",
    "Date souhaitée / Preferred Date": formData.get("fdate") || "Non renseigné",
    "Domaine juridique / Legal Area": formData.get("farea"),
    "Situation / Details": formData.get("fmsg"),
    "_subject": "Nouveau rendez-vous client - Ahmed Badi",
    "_captcha": "false",
    "_template": "box"
  };

  try {
    const response = await fetch('https://formsubmit.co/ajax/Maitre.badiahmed@avocat.org.tn', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    let result = {};
    try {
      result = await response.json();
    } catch(e) {}
    
    if (response.ok) {
      formConfirm.hidden = false;
      appointmentForm.reset();
    } else {
      if (result.message && (result.message.toLowerCase().includes('activate') || result.message.toLowerCase().includes('confirm') || result.message.toLowerCase().includes('verify') || result.message.toLowerCase().includes('active'))) {
        alert("Un e-mail d'activation a été envoyé à Maitre.badiahmed@avocat.org.tn. Veuillez ouvrir cet e-mail, cliquer sur le bouton d'activation pour valider votre boîte de réception, puis soumettre à nouveau le formulaire.");
      } else {
        alert("Une erreur est survenue lors de l'envoi : " + (result.message || "Veuillez réessayer."));
      }
    }
  } catch(err) {
    console.error('Error submitting form:', err);
    alert("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
  }
});

/* ============================================================
   CHATBOT
   Ready to plug into a real LLM backend. See README.md for a
   sample Node/Express server that proxies to the Anthropic API
   (keeping your API key off the client).
============================================================ */
const chatbot = document.getElementById('chatbot');
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotPanel = document.getElementById('chatbotPanel');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotForm = document.getElementById('chatbotForm');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotQuick = document.getElementById('chatbotQuick');
const iconOpen = document.getElementById('chatIconOpen');
const iconClose = document.getElementById('chatIconClose');

chatbotToggle.addEventListener('click', () => {
  chatbot.classList.toggle('open');
  const isOpen = chatbot.classList.contains('open');
  iconOpen.hidden = isOpen;
  iconClose.hidden = !isOpen;
  if(isOpen) chatbotInput.focus();
});

function currentLang(){ return html.getAttribute('data-lang') || 'fr'; }

function addMessage(text, who){
  const div = document.createElement('div');
  div.className = `msg msg-${who}`;
  div.textContent = text;
  chatbotMessages.appendChild(div);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  return div;
}

function addTyping(){
  const div = document.createElement('div');
  div.className = 'msg msg-bot msg-typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  chatbotMessages.appendChild(div);
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  return div;
}

// --- Local fallback answers (used until a real LLM backend is connected) ---
const FALLBACK_ANSWERS = {
  fr: {
    domaines: "Le cabinet intervient en droit des affaires, droit civil, droit de la famille et droit du travail. Vous pouvez voir le détail dans la section « Domaines » plus haut sur la page.",
    rdv: "Pour prendre rendez-vous, remplissez le formulaire dans la section « Rendez-vous » : indiquez votre nom, email et une brève description de votre situation. Nous vous recontactons sous 24h ouvrées.",
    tarifs: "La première consultation est offerte. Les honoraires ensuite dépendent de la nature et de la complexité du dossier — ils vous sont communiqués clairement avant tout engagement.",
    default: "Merci pour votre message. Pour une réponse précise sur votre situation, le mieux est de prendre rendez-vous via le formulaire ci-dessus — un avocat vous répondra personnellement."
  },
  en: {
    domaines: "The practice covers business law, civil law, family law and labour law. You'll find details in the Practice Areas section above.",
    rdv: "To book a consultation, fill in the form in the Book Now section: your name, email, and a short description of your situation. We'll reply within 24 business hours.",
    tarifs: "The first consultation is free. Fees after that depend on the nature and complexity of your case — always communicated clearly before any commitment.",
    default: "Thanks for your message. For an answer specific to your situation, the best step is to book a consultation using the form above — a lawyer will respond personally."
  }
};

function fallbackReply(userText){
  const lang = currentLang();
  const t = userText.toLowerCase();
  const bank = FALLBACK_ANSWERS[lang];
  if(t.includes('domain') || t.includes('area') || t.includes('practice') || t.includes('droit')) return bank.domaines;
  if(t.includes('rendez') || t.includes('book') || t.includes('appointment') || t.includes('consult')) return bank.rdv;
  if(t.includes('tarif') || t.includes('prix') || t.includes('gratuit') || t.includes('price') || t.includes('free') || t.includes('cost')) return bank.tarifs;
  return bank.default;
}

/*
  To connect a real LLM (e.g. Claude via the Anthropic API), replace
  fallbackReply() calls below with a call to your backend, for example:

  async function getBotReply(userText){
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText, lang: currentLang() })
    });
    const data = await res.json();
    return data.reply;
  }

  Never call the Anthropic API directly from this front-end file —
  that would expose your API key. Route it through a small backend
  (see README.md for a ready-to-use Express example).
*/
async function getBotReply(userText){
  await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
  return fallbackReply(userText);
}

async function handleUserMessage(text){
  if(!text.trim()) return;
  addMessage(text, 'user');
  chatbotInput.value = '';
  const typing = addTyping();
  const reply = await getBotReply(text);
  typing.remove();
  addMessage(reply, 'bot');
}

chatbotForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleUserMessage(chatbotInput.value);
});

chatbotQuick.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if(!chip) return;
  const lang = currentLang();
  const question = lang === 'fr' ? chip.dataset.qFr : chip.dataset.qEn;
  handleUserMessage(question);
});

/* ============================================================
   NAV BACKGROUND ON SCROLL (subtle)
============================================================ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 20 ? '0 1px 0 rgba(16,22,31,.08)' : 'none';
});
