/* ============================================================
   LANGUAGE TOGGLE
============================================================ */
const langToggle = document.getElementById('langToggle');
const sealFace   = document.getElementById('sealFace');
const html       = document.documentElement;

function setLang(lang){
  html.setAttribute('data-lang', lang);
  html.setAttribute('lang', lang);
  document.querySelectorAll('[data-fr]').forEach(el => { el.hidden = lang !== 'fr'; });
  document.querySelectorAll('[data-en]').forEach(el => { el.hidden = lang !== 'en'; });
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

const savedLang = localStorage.getItem('site-lang');
if(savedLang){ setLang(savedLang); }

/* ============================================================
   MOBILE MENU
============================================================ */
const burger   = document.getElementById('burger');
const navLinks = document.querySelector('.nav-links');

burger?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', isOpen);
  burger.classList.toggle('is-open', isOpen);
});

navLinks?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', false);
  });
});

/* ============================================================
   FORM VALIDATION ENGINE
   Covers: FR · EN · AR · Tunisian (Arabizi) · ES · DE · IT
           TR · RU (latin) · PT
   Also catches: HTML/SQL injections, keyboard spam,
                 evasion tricks (f u c k, sh!t, m*rde),
                 disposable emails, invalid phone numbers.
============================================================ */

/* ── Profanity patterns (regex-based, multilingual) ─────── */
const PROFANITY_PATTERNS = [
  // English
  /\b(fuck|fucking|fucker|fucked|fucks|motherfuck(?:er|ing)?|shit(?:ty|ter)?|bullshit|bitch(?:es)?|bastard|cunt|dick(?:head)?|cock(?:sucker)?|piss(?:ing|ed)?|fag(?:got)?|slut|whore|crap|ass(?:hole|holes)?|dumbass|jackass|damn(?:ed)?|goddamn|screw you|idiot|moron|retard(?:ed)?|twat|wanker|prick|jerk|douchebag|dipshit|horseshit|dumbfuck|clusterfuck|fucktard|kys|kill yourself|nigger|nigga|chink|spic|wetback|kike|rape|rapist|pedophile|pedo)\b/i,
  // English catch-all evasion variants
  /\bf+u+c+k+\b/i,
  /\bs+h+i+t+\b/i,
  /\bb+i+t+c+h+\b/i,
  /\bc+u+n+t+\b/i,
  /\ba+s+s+h+o+l+e+\b/i,
  // French
  /\b(merde|bordel|putain|connard|conn(?:e|ards?)|salop(?:e|ard|ards)?|enc[uù]l[eé](?:r|s)?|foutre|nique(?:r|ta|sa)?|p\.d|pute|ntm|fdp|tg|enfoiré|ordure|salaud|ducon|abruti|imbécile|crétin|couille|bite|chier|chieur|baiser|pédé|tapette|bat[aâ]rd|tocard|branleur|branler|couillon|va[\s-]te[\s-]faire|mange(?:r)?\s*merde|ta\s*gueule|racaille|bougnoule|youpin|bicot|va mourir|va crever|crève|je te tue)\b/i,
  /\bm+e+r+d+e+\b/i,
  /\bp+u+t+a+i+n+\b/i,
  // Tunisian Arabizi
  /\b(kes+|kess|nayek|qahba|nayak|zeb|9ahba|kalb|zebbi|zbi|zebb|oumok|omok|ommok|bouzar|7mar|9ahba|kahba|sharmouta|sharmout[ae]|3arssa|3ars|zamel|zaamel|7aywan|bahima|b[ae]heyma|nik(?:ek|ha|ik|ak)?|nik\s*omok|9ess|bok|el\s*zemel|weld\s*el\s*9a7ba|ibn\s*el\s*9a7ba|ibn\s*el\s*sharmouta|sormak|tbawwel|7ashuma|ya\s*kalb|ya\s*7mar|ya\s*9a7ba|a9ra9|nakth|yel3en|yil3an|3leek|bel7a9)\b/i,
  /\b(nik|nk|n1k)\s*(omok|ommok|oumok|ta|sa|ek|ik|ak|lek)\b/i,
  /\b(weld|ibn|iben|bnt|bint)\s*(el|al)?\s*(9ahba|kahba|qahba|7arb|sharmouta|kalb)\b/i,
  /\b(ya|ya3)\s*(7mar|9erd|kalb|bahima|zamel|3arssa|9ahba|kahba)\b/i,
  /\b(zebbi|zbi|zebb|zebi)\b/i,
  /\b(kes|kess)(ik|ek|et|tek|ommok|omok|oumok)?\b/i,
  /\b(9ahba|kahba|qahba|9a7ba)\b/i,
  /\b(sharmouta|shar9outa|sharmout[ae]?)\b/i,
  /\b(zamel|zaamel|zmel)\b/i,
  /\b(7mar|7mara)\b/i,
  /\b(manyak|mnayak|mnayek|manyek)\b/i,
  /\b(bouzar|bwzar)\b/i,
  /\b(tnayyik|tnayyek|tbawwel)\b/i,
  /\b(yel3en|yil3an|al3en)\b/i,
  /\b(3arssa|3ars)\b/i,
  // Arabic unicode
  /\b(كس|زب|قحبة|شرموطة|عرصة|زمل|يلعن|بن\s*الكلب|ابن\s*القحبة|يا\s*حيوان|ابن\s*الشرموطة)\b/u,
  // Spanish
  /\b(puta|puto|coño|joder|mierda|cabrón|cabron|hijo\s*de\s*puta|pendejo|chingad[ao]|chingar|gilipollas|follar|maricón|maricon|hdp)\b/i,
  // German
  /\b(schei(?:ß|ss)e?|ficken|hurensohn|wichser|arschloch|fotze|kacke|verdammt|schlampe)\b/i,
  // Italian
  /\b(cazzo|minchia|vaffanculo|fanculo|puttana|stronzo|merda|figlio\s*di\s*puttana|coglione|troia)\b/i,
  // Turkish
  /\b(orospu|siktir|g[oö]t|amk|bok|pi[cç]|salak|kahpe|am[iı]na|bok\s*yemek)\b/i,
  // Russian (transliterated)
  /\b(blyad|blyat|pizd[au]|khuy|yebat|suka|pizdec|eblan|nahuy|idi\s*nahuy)\b/i,
  // Portuguese
  /\b(porra|caralho|foda(?:se)?|buceta|viado|cuz[aã]o|filho\s*da\s*puta|cu\b)\b/i,
  // Threats (multilingual)
  /\b(je\s*vais\s*te\s*(tuer|frapper|trou)|i\s*(will|'ll)\s*(kill|hurt|destroy|find)\s*you|naktouk|nkhaleek|n9telk|n3mel\s*fik)\b/i,
  // Spam / all symbols
  /^[\s!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~]{5,}$/,
];

/* ── Injection patterns ──────────────────────────────────── */
const INJECTION_PATTERNS = [
  /<[^>]+>/,                                                          // HTML tags
  /javascript\s*:/i,                                                  // JS protocol
  /on\w+\s*=/i,                                                       // event attributes
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|UNION|EXEC(?:UTE)?|SCRIPT)\b/i, // SQL
  /(['";`][\s]*[-–—][\s]*[-–—]|\/\*[\s\S]*?\*\/)/,                  // SQL comment patterns
  /(eval|alert|prompt|confirm|document\.|window\.)\s*\(/i,           // JS functions
  /(\.\.\/|\.\.\\|%2e%2e%2f)/i,                                      // path traversal
];

/* ── Disposable email domains blocklist ─────────────────── */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','10minutemail.com','tempmail.com',
  'throwaway.email','yopmail.com','sharklasers.com','grr.la',
  'guerrillamail.info','spam4.me','trashmail.com','trashmail.me',
  'dispostable.com','mailnull.com','spamgourmet.com','maildrop.cc',
  'fakeinbox.com','jetable.fr.nf','nomail.xl.cx','nospam.ze.tc',
  'discard.email','filzmail.com','spamfree24.org','spam.la','binkmail.com',
  'mailcatch.com','throwam.com','burnermail.io','tempr.email','getnada.com',
  'mohmal.com','spamgoblin.com','getairmail.com','mailexpire.com',
  'spambox.us','trashmail.at','trashmail.io','temp-mail.org','guerrillamail.org',
  'temp-mail.io','tmpmail.org','fakeinbox.com','fakemailgenerator.com','fakemail.fr',
  'yopmail.fr','yopmail.info','guerrillamail.de','guerrillamail.biz',
  'mailnesia.com','mailmetrash.com','spamevader.com','tempinbox.com',
  'spam.biz.st','spamgourmet.net','spamgourmet.org',
]);

/* ── Helpers ─────────────────────────────────────────────── */
function hasProfanity(text){
  const t = text.toLowerCase()
    .replace(/\*/g, 'u')
    .replace(/!/g, 'i')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a')
    .replace(/\+/g, 't');
  const tNoSpaces = t.replace(/\s+/g, '');
  const tCollapsed = t.replace(/\b([a-z9873]) (?=[a-z9873] |\b)/gi, '$1');
  return PROFANITY_PATTERNS.some(p => p.test(t) || p.test(tNoSpaces) || p.test(tCollapsed));
}
function hasInjection(text){
  return INJECTION_PATTERNS.some(p => p.test(text));
}
function isKeyboardSpam(text){
  const t = text.replace(/\s/g,'').toLowerCase();
  if(t.length < 5) return false;
  const runs = ['qwertyuiop','asdfghjkl','zxcvbnm','azerty','azertyuiop','qwerty'];
  if(runs.some(r => t.includes(r) && t.length < 18)) return true;
  if(t.length > 6 && new Set(t).size < 3) return true;
  const meaningful = (t.match(/[a-zA-ZÀ-ÿ\u0600-\u06FF0-9]/g) || []).length;
  if(t.length > 8 && meaningful / t.length < 0.4) return true;
  return false;
}

/* ── Per-field validators ─────────────────────────────────
   Each returns { valid: true } or { valid: false, error: string }
─────────────────────────────────────────────────────────── */
function validateName(v){
  v = v.trim();
  if(!v)           return { valid:false, error:'Le nom complet est requis.' };
  if(v.length < 2) return { valid:false, error:'Le nom doit contenir au moins 2 caractères.' };
  if(v.length > 60) return { valid:false, error:'Le nom ne peut pas dépasser 60 caractères.' };
  if(/\d/.test(v)) return { valid:false, error:'Le nom ne doit pas contenir de chiffres.' };
  if(hasInjection(v)) return { valid:false, error:'Caractères non autorisés détectés dans le nom.' };
  if(hasProfanity(v)) return { valid:false, error:'Ce nom contient un langage inapproprié.' };
  if(isKeyboardSpam(v)) return { valid:false, error:'Veuillez saisir un nom valide.' };
  // Only letters (Latin + accented + Arabic script), spaces, hyphens, apostrophes
  if(!/^[a-zA-ZÀ-ÖØ-öø-ÿÂÊÎÔÛàâêîôûäëïöüÿçÆæŒœ\u0600-\u06FF\s'\-]+$/.test(v))
    return { valid:false, error:"Le nom ne doit contenir que des lettres, espaces ou traits d'union." };
  return { valid:true };
}

function validateEmail(v){
  v = v.trim().toLowerCase();
  if(!v) return { valid:false, error:"L'adresse email est requise." };
  const re = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  if(!re.test(v)) return { valid:false, error:'Adresse email invalide. Vérifiez le format (ex : nom@domaine.com).' };
  const [local, domain] = v.split('@');
  if(!domain || !domain.includes('.'))
    return { valid:false, error:'Le domaine email est invalide.' };
  if(DISPOSABLE_DOMAINS.has(domain))
    return { valid:false, error:'Les adresses email temporaires ne sont pas acceptées.' };
  if(/^(test|fake|temp|noreply|no-reply|dummy|example|asdf|qwerty|aaa|zzz|abc|user|admin|info|support)$/i.test(local))
    return { valid:false, error:'Veuillez utiliser votre véritable adresse email.' };
  if(hasProfanity(v))
    return { valid:false, error:"L'adresse email contient des termes non autorisés." };
  return { valid:true };
}

function validatePhone(v){
  if(!v || !v.trim()) return { valid:true }; // optional field
  const stripped = v.trim().replace(/[\s\-\(\)\.]/g,'');
  if(!/^\+?\d{8,15}$/.test(stripped))
    return { valid:false, error:'Numéro de téléphone invalide. Format : +216 XX XXX XXX' };
  // Tunisian-specific check when +216 prefix
  if(/^\+?216/.test(stripped)){
    const local8 = stripped.replace(/^\+?216/,'');
    if(!/^[2345789]\d{7}$/.test(local8))
      return { valid:false, error:'Numéro tunisien invalide — vérifiez votre numéro.' };
  }
  return { valid:true };
}

function validateMessage(v){
  v = v.trim();
  if(!v)            return { valid:false, error:'Veuillez décrire votre situation.' };
  if(v.length < 20) return { valid:false, error:'Message trop court (minimum 20 caractères). Décrivez brièvement votre situation juridique.' };
  if(v.length > 3000) return { valid:false, error:'Message trop long (maximum 3 000 caractères).' };
  if(hasInjection(v)) return { valid:false, error:'Votre message contient des caractères non autorisés. Merci de reformuler.' };
  if(hasProfanity(v)) return { valid:false, error:'Votre message contient un langage inapproprié. Merci de reformuler votre demande de manière professionnelle.' };
  if(isKeyboardSpam(v)) return { valid:false, error:'Votre message ne semble pas lisible. Merci de décrire clairement votre situation juridique.' };
  if(/https?:\/\/|www\.\S+/i.test(v)) return { valid:false, error:'Les liens ne sont pas autorisés dans le message.' };
  if(/^[\s\p{Emoji}\p{S}\p{P}0-9]+$/u.test(v)) return { valid:false, error:'Votre message doit contenir du texte lisible.' };
  return { valid:true };
}

/* ── UI helpers ──────────────────────────────────────────── */
function getFieldWrapper(input){
  let el = input.parentElement;
  while(el && !el.classList.contains('field')) el = el.parentElement;
  return el;
}

function showFieldError(input, message){
  const wrapper = getFieldWrapper(input);
  if(!wrapper) return;
  wrapper.classList.add('field--invalid');
  wrapper.classList.remove('field--valid');
  const old = wrapper.querySelector('.field-error-msg');
  if(old) old.remove();
  const span = document.createElement('span');
  span.className = 'field-error-msg';
  span.setAttribute('role','alert');
  span.textContent = message;
  /* Inline styles guarantee visibility even if stylesheet hasn't loaded */
  Object.assign(span.style, {
    display:    'block',
    color:      '#B92C2C',
    fontSize:   '0.76rem',
    fontWeight: '500',
    marginTop:  '5px',
    lineHeight: '1.4',
  });
  wrapper.appendChild(span);
}

function clearFieldError(input){
  const wrapper = getFieldWrapper(input);
  if(!wrapper) return;
  wrapper.classList.remove('field--invalid');
  const old = wrapper.querySelector('.field-error-msg');
  if(old) old.remove();
}

function markFieldValid(input){
  const wrapper = getFieldWrapper(input);
  if(!wrapper) return;
  clearFieldError(input);
  wrapper.classList.add('field--valid');
}

function clearDenyBanner(form){
  const old = form.querySelector('.form-deny-banner');
  if(old) old.remove();
}

function showDenyBanner(form, message){
  clearDenyBanner(form);
  const banner = document.createElement('div');
  banner.className = 'form-deny-banner';
  banner.setAttribute('role','alert');
  banner.textContent = message;
  const submitBtn = form.querySelector('[type="submit"]');
  form.insertBefore(banner, submitBtn);
  banner.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

/* ── Live validation on blur (when user leaves a field) ─── */
function attachBlurValidation(){
  const fname  = document.getElementById('fname');
  const femail = document.getElementById('femail');
  const fphone = document.getElementById('fphone');
  const fmsg   = document.getElementById('fmsg');

  const fields = [
    { el: fname,  fn: validateName    },
    { el: femail, fn: validateEmail   },
    { el: fphone, fn: validatePhone   },
    { el: fmsg,   fn: validateMessage },
  ];

  fields.forEach(({ el, fn }) => {
    if(!el) return;
    el.addEventListener('blur', () => {
      const result = fn(el.value);
      if(!result.valid) showFieldError(el, result.error);
      else if(el.value.trim()) markFieldValid(el);
    });
    el.addEventListener('input', () => {
      clearFieldError(el);
      const wrapper = getFieldWrapper(el);
      if(wrapper) wrapper.classList.remove('field--valid');
    });
  });
}

/* ============================================================
   APPOINTMENT FORM — submit with full validation
============================================================ */
const appointmentForm = document.getElementById('appointmentForm');
const formConfirm     = document.getElementById('formConfirm');

attachBlurValidation();

appointmentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearDenyBanner(appointmentForm);
  formConfirm.hidden = true;

  const fname  = document.getElementById('fname');
  const femail = document.getElementById('femail');
  const fphone = document.getElementById('fphone');
  const fmsg   = document.getElementById('fmsg');

  // Run all validators
  const checks = [
    { el: fname,  result: validateName(fname.value)       },
    { el: femail, result: validateEmail(femail.value)     },
    { el: fphone, result: validatePhone(fphone.value)     },
    { el: fmsg,   result: validateMessage(fmsg.value)     },
  ];

  let firstError = null;
  let allValid   = true;

  checks.forEach(({ el, result }) => {
    if(!result.valid){
      allValid = false;
      showFieldError(el, result.error);
      if(!firstError) firstError = el;
    } else {
      markFieldValid(el);
    }
  });

  /* ── BLOCKED: show denied banner, DO NOT send ─────────── */
  if(!allValid){
    showDenyBanner(
      appointmentForm,
      'Votre demande n\'a pas pu être envoyée. Veuillez corriger les champs indiqués en rouge ci-dessus.'
    );
    firstError?.scrollIntoView({ behavior:'smooth', block:'center' });
    firstError?.focus();
    return; /* ← form NEVER submits */
  }

  /* ── ALL VALID: send the request ─────────────────────── */
  const submitBtn = appointmentForm.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.65';

  const formData = new FormData(appointmentForm);
  const data = {
    "Nom complet / Full Name":         formData.get("fname"),
    "Email":                           formData.get("femail"),
    "Téléphone / Phone":               formData.get("fphone") || "Non renseigné",
    "Date souhaitée / Preferred Date": formData.get("fdate")  || "Non renseigné",
    "Domaine juridique / Legal Area":  formData.get("farea"),
    "Situation / Details":             formData.get("fmsg"),
    "_subject":  "Nouveau rendez-vous client - Ahmed Badi",
    "_captcha":  "false",
    "_template": "box"
  };

  try {
    const response = await fetch('https://formsubmit.co/ajax/Maitre.badiahmed@avocat.org.tn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    let result = {};
    try { result = await response.json(); } catch(_) {}

    if(response.ok){
      formConfirm.hidden = false;
      appointmentForm.reset();
      appointmentForm.querySelectorAll('.field--valid,.field--invalid').forEach(el => {
        el.classList.remove('field--valid','field--invalid');
      });
    } else {
      const msg = (result.message || '').toLowerCase();
      if(msg.includes('activate') || msg.includes('confirm') || msg.includes('verify')){
        showDenyBanner(appointmentForm, "Un e-mail d'activation a été envoyé à l'adresse du cabinet. Veuillez cliquer sur le lien d'activation puis soumettre à nouveau.");
      } else {
        showDenyBanner(appointmentForm, 'Une erreur est survenue. Veuillez réessayer dans quelques instants.');
      }
    }
  } catch(_){
    showDenyBanner(appointmentForm, 'Impossible d\'envoyer la demande. Vérifiez votre connexion et réessayez.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '';
  }
});


/* ============================================================
   PREMIUM AUDIO ENGINE  (Web Audio API — zero external files)
============================================================ */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let _audioCtx  = null;

function getAudioCtx(){
  if(!_audioCtx) _audioCtx = new AudioCtx();
  if(_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function scheduleNote(ctx, freq, startTime, duration, peak = 0.15, type = 'sine'){
  const osc   = ctx.createOscillator();
  const gain  = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peak, startTime + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

function playSendSound(){
  const ctx = getAudioCtx();
  const t   = ctx.currentTime;

  const swoosh = ctx.createOscillator();
  const swGain = ctx.createGain();
  swoosh.type = 'sine';
  swoosh.frequency.setValueAtTime(680, t);
  swoosh.frequency.exponentialRampToValueAtTime(2200, t + 0.09);
  swGain.gain.setValueAtTime(0, t);
  swGain.gain.linearRampToValueAtTime(0.18, t + 0.005);
  swGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
  swoosh.connect(swGain);
  swGain.connect(ctx.destination);
  swoosh.start(t);
  swoosh.stop(t + 0.18);

  const bufLen = ctx.sampleRate * 0.04;
  const noiseBuffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for(let i = 0; i < bufLen; i++) noiseData[i] = (Math.random() * 2 - 1);
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 2000;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.06, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t);

  scheduleNote(ctx, 1760, t + 0.07, 0.18, 0.04, 'sine');
}

function playReceiveSound(){
  const ctx = getAudioCtx();
  const t   = ctx.currentTime;

  scheduleNote(ctx, 146.8, t,        2.4,  0.14, 'sine');
  scheduleNote(ctx, 385.0, t + 0.01, 2.0,  0.09, 'sine');
  scheduleNote(ctx, 820.0, t + 0.02, 1.6,  0.06, 'sine');
  scheduleNote(ctx, 1480,  t + 0.03, 1.2,  0.04, 'sine');
  scheduleNote(ctx, 2960,  t + 0.04, 0.8,  0.02, 'sine');

  const atk = ctx.createOscillator();
  const atkGain = ctx.createGain();
  atk.type = 'triangle';
  atk.frequency.setValueAtTime(440, t);
  atk.frequency.exponentialRampToValueAtTime(200, t + 0.03);
  atkGain.gain.setValueAtTime(0.10, t);
  atkGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  atk.connect(atkGain);
  atkGain.connect(ctx.destination);
  atk.start(t);
  atk.stop(t + 0.06);
}

function playWelcomeSound(){
  const ctx = getAudioCtx();
  const t   = ctx.currentTime;

  const glissNotes = [261.6, 329.6, 392.0, 523.3, 659.3, 784.0];
  glissNotes.forEach((freq, i) => {
    scheduleNote(ctx, freq, t + i * 0.07, 0.6 - i * 0.04, 0.07 - i * 0.005, 'sine');
  });

  const chordStart = t + 0.52;
  scheduleNote(ctx, 261.6, chordStart,        1.4, 0.11, 'sine');
  scheduleNote(ctx, 392.0, chordStart + 0.05, 1.3, 0.09, 'sine');
  scheduleNote(ctx, 659.3, chordStart + 0.10, 1.2, 0.07, 'sine');
  scheduleNote(ctx, 1046.5,chordStart + 0.15, 1.0, 0.05, 'sine');
  scheduleNote(ctx, 130.8, chordStart, 1.5, 0.08, 'sine');
}

let _welcomePlayed = false;
function tryPlayWelcome(){
  if(_welcomePlayed) return;
  _welcomePlayed = true;
  playWelcomeSound();
}
['click', 'keydown', 'touchstart'].forEach(ev =>
  document.addEventListener(ev, tryPlayWelcome, { once: true })
);

/* ============================================================
   CONTENT MODERATION FOR CHATBOT
   Block inappropriate, offensive, or off-topic messages before
   they reach the AI. Returns an object: { blocked, reason }
============================================================ */
const BLOCKED_PATTERNS = [
  // Curse words / insults (English & French, common variants)
  /\b(fuck|shit|bitch|ass(?:hole)?|bastard|cunt|dick|cock|piss|fag|slut|whore|damn|crap|motherfuck)\b/i,
  /\b(merde|putain|connard|con(?:ne)?|salop(?:e)?|enc[uù]l[eé]|foutre|bordel|nique(?:ta|sa)?|pd|pute|ntm|fdp|tg|va te faire|salopard|batard|bâtard|enfoiré|ordure|salaud|ducon|abruti|idiot|imbécile|crétin)\b/i,
  // Tunisian Arabizi (chatbot moderation)
  /\b(kes+|kess|9ahba|kahba|zebbi|zbi|zebb|kalb|7mar|sharmouta|3arssa|zamel|nik(?:ek|ik|ak)?|oumok|omok|ommok|bouzar|bahima|manyak|mnayak|9erd|7aywan)\b/i,
  // Harassment or threats
  /\b(je vais te|i(?:'ll| will) (kill|hurt|destroy|find you)|menace|threat|tuer)\b/i,
  // Explicit sexual content
  /\b(sex(?:e|ual)?|porn|nude|naked|xxx|erotic|sexi)\b/i,
  // Spam / test noise
  /^(test|aaa+|zzz+|123+|lol+|haha+|😂{3,})\s*$/i,
  // Clearly off-topic
  /\b(casino|poker|drug|narcoti|weed|cocaine|crack)\b/i,
];

function moderateMessage(text){
  const trimmed = text.trim();
  if(trimmed.length < 2){
    return { blocked: true, fr: "Veuillez saisir un message.", en: "Please enter a message." };
  }
  for(const pattern of BLOCKED_PATTERNS){
    if(pattern.test(trimmed)){
      return {
        blocked: true,
        fr: "Je suis un assistant juridique professionnel. Merci de formuler votre demande dans un langage approprié et respectueux.",
        en: "I am a professional legal assistant. Please communicate in appropriate and respectful language."
      };
    }
  }
  return { blocked: false };
}

/* ============================================================
   CHATBOT
============================================================ */
const chatbot         = document.getElementById('chatbot');
const chatbotToggle   = document.getElementById('chatbotToggle');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotForm     = document.getElementById('chatbotForm');
const chatbotInput    = document.getElementById('chatbotInput');
const chatbotQuick    = document.getElementById('chatbotQuick');

/* Auto-open chatbot after 4 s */
let _chatAutoOpened = false;
setTimeout(() => {
  if(_chatAutoOpened) return;
  _chatAutoOpened = true;
  chatbot.classList.add('open');
  playWelcomeSound();
  _welcomePlayed = true;
  setTimeout(() => playReceiveSound(), 700);
}, 4000);

chatbotToggle.addEventListener('click', () => {
  tryPlayWelcome();
  chatbot.classList.toggle('open');
  const isOpen = chatbot.classList.contains('open');
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

/* ============================================================
   AI CHATBOT — calls /api/chat (Vercel serverless function)
   The Groq API key lives only in Vercel environment variables.
============================================================ */

/* Conversation history for multi-turn memory (user/assistant turns only) */
const conversationHistory = [];

async function getGroqReply(userText){
  // Send message + prior history to the serverless proxy
  const CHAT_API = window.location.hostname.includes('vercel.app') || window.location.hostname === 'localhost'
    ? '/api/chat'
    : 'https://lawyer-website-bay-seven.vercel.app/api/chat';
  const response = await fetch(CHAT_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userText,
      history: conversationHistory
    })
  });

  const data = await response.json().catch(() => ({}));

  if(!response.ok){
    // The API returns a structured { error, code } — log the code, surface the message
    const code    = data.code    || 'api_error';
    const message = data.error   || `Erreur API (${response.status})`;
    console.error('[getGroqReply] API error:', code, response.status, message);
    throw new Error(message);           // caught by getBotReply and shown to user
  }

  const reply = data.reply || '';

  // Keep local history updated for multi-turn context
  conversationHistory.push({ role: 'user',      content: userText });
  conversationHistory.push({ role: 'assistant', content: reply });
  return reply;
}

/* --- Local fallback (if Groq is unavailable) --- */
const FALLBACK = {
  fr: {
    domaines: "Le Cabinet Badi Avocat intervient en droit des affaires, droit civil, droit de la famille et droit du travail. Consultez la section « Domaines » pour plus de détails.",
    rdv:      "Pour prendre rendez-vous, veuillez utiliser le formulaire dans la section « Rendez-vous » ou contacter le cabinet directement au +216 92 744 070.",
    tarifs:   "Pour toute question relative aux honoraires, nous vous invitons à contacter directement le cabinet au +216 92 744 070 ou par e-mail à Maitre.badiahmed@avocat.org.tn.",
    default:  "Merci pour votre message. Pour une réponse adaptée à votre situation, nous vous invitons à prendre contact avec le cabinet au +216 92 744 070."
  },
  en: {
    domaines: "Badi Avocat handles business law, civil law, family law and labour law. Please see the Practice Areas section for full details.",
    rdv:      "To book a consultation, please use the form in the Book Now section or contact the office directly at +216 92 744 070.",
    tarifs:   "For enquiries regarding fees, please contact the office directly at +216 92 744 070 or at Maitre.badiahmed@avocat.org.tn.",
    default:  "Thank you for your message. For advice specific to your situation, please contact the office at +216 92 744 070."
  }
};

function fallbackReply(userText){
  const lang = currentLang();
  const t    = userText.toLowerCase();
  const bank = FALLBACK[lang];
  if(t.match(/domain|area|practice|droit|sp[eé]cialit/)) return bank.domaines;
  if(t.match(/rendez|book|appointment|consult|contact/))  return bank.rdv;
  if(t.match(/tarif|prix|honor|fee|cost|price/))          return bank.tarifs;
  return bank.default;
}

async function getBotReply(userText){
  try {
    return await getGroqReply(userText);
  } catch(err){
    // err.message is already the user-friendly text coming from the API
    console.warn('[getBotReply] Groq unavailable, using fallback. Reason:', err.message);
    await new Promise(r => setTimeout(r, 350));

    // If the API returned a user-friendly error message (not a network failure),
    // prefer showing it directly over the generic fallback text.
    const isApiMessage = err.message && !err.message.startsWith('Failed to fetch') &&
                         !err.message.startsWith('NetworkError') &&
                         !err.message.startsWith('Load failed');
    if(isApiMessage) return err.message;

    return fallbackReply(userText);
  }
}

/* Main message handler with moderation gate */
async function handleUserMessage(text){
  const trimmed = text.trim();
  if(!trimmed) return;

  // ── 1. Moderation check BEFORE sending to AI ──
  const modResult = moderateMessage(trimmed);
  if(modResult.blocked){
    addMessage(trimmed, 'user');
    playSendSound();
    chatbotInput.value = '';
    const lang = currentLang();
    await new Promise(r => setTimeout(r, 600));
    addMessage(lang === 'fr' ? modResult.fr : modResult.en, 'bot');
    playReceiveSound();
    return;
  }

  // ── 2. Normal AI flow ──
  addMessage(trimmed, 'user');
  playSendSound();
  chatbotInput.value    = '';
  chatbotInput.disabled = true;

  const typing = addTyping();
  const reply  = await getBotReply(trimmed);
  typing.remove();

  addMessage(reply, 'bot');
  playReceiveSound();
  chatbotInput.disabled = false;
  chatbotInput.focus();
}

chatbotForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleUserMessage(chatbotInput.value);
});

chatbotQuick.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if(!chip) return;
  const lang     = currentLang();
  const question = lang === 'fr' ? chip.dataset.qFr : chip.dataset.qEn;
  handleUserMessage(question);
});

/* ============================================================
   NAV BACKGROUND ON SCROLL
============================================================ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 20 ? '0 1px 0 rgba(16,22,31,.08)' : 'none';
});
