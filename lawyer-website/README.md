# Badi Avocat — Site Web

Site vitrine bilingue (FR/EN) pour cabinet d'avocat : page d'accueil, présentation
de l'avocat, domaines d'intervention, témoignages, prise de rendez-vous, et un
chatbot prêt à être connecté à un LLM.

## 1. Ouvrir le projet dans VS Code

1. Décompressez le dossier `lawyer-website`.
2. Ouvrez-le dans VS Code (`File > Open Folder…`).
3. Installez l'extension **Live Server** (par Ritwick Dey).
4. Clic droit sur `index.html` → **Open with Live Server**.

Aucune installation, aucun build : c'est du HTML/CSS/JS pur.

## 2. Structure des fichiers

```
lawyer-website/
├── index.html      → structure de la page (toutes les sections)
├── style.css        → design (couleurs, typographie, mise en page)
├── script.js         → interactions (langue, formulaire, chatbot)
└── README.md
```

## 3. Personnaliser le contenu

- **Nom de l'avocat, bio, diplômes** : cherchez `Ahmed Badi` dans `index.html`
  et remplacez par les vraies informations.
- **Photo** : remplacez le `.portrait-placeholder` (bloc SVG) dans la section
  `#about` par une vraie balise `<img src="photo.jpg" alt="...">`. Ajoutez votre
  photo dans le dossier du projet.
- **Coordonnées** : téléphone, email et adresse sont dans la section
  `#appointment` et dans le `<footer>`.
- **Couleurs / police** : tout est centralisé en haut de `style.css` dans le
  bloc `:root { --ink: ...; --brass: ...; }`. Changez ces valeurs pour ajuster
  toute la palette d'un coup.
- **Texte FR/EN** : chaque bloc de texte a deux versions dans le HTML —
  `<span data-fr>…</span>` et `<span data-en hidden>…</span>`. Le script
  affiche l'un ou l'autre selon la langue choisie (le petit sceau en haut à
  droite bascule entre les deux).

## 4. Le formulaire de rendez-vous

Actuellement, le formulaire affiche juste une confirmation côté client
(`script.js`, fonction sur `appointmentForm`). Pour qu'il envoie réellement les
demandes quelque part, deux options simples :

- **Sans backend** : utilisez un service comme [Formspree](https://formspree.io)
  ou [Basin](https://usebasin.com) — changez juste l'attribut `action` du
  `<form>` et leur `fetch`.
- **Avec backend** : remplacez le `TODO` dans `script.js` par un vrai
  `fetch('/api/appointments', { method: 'POST', ... })` vers votre serveur, qui
  enregistre en base de données et/ou envoie un email de notification.

## 5. Connecter le chatbot à un vrai LLM

Le chatbot fonctionne déjà en mode démo (réponses locales simples, dans
`FALLBACK_ANSWERS` dans `script.js`). Pour le brancher à un vrai modèle de
langage (Claude, GPT, etc.), il faut un petit serveur backend — **ne mettez
jamais votre clé API directement dans le JavaScript du site**, elle serait
visible par n'importe quel visiteur.

### Exemple de backend minimal (Node + Express + Claude)

Créez un dossier `server/` à côté de ce projet :

```bash
mkdir server && cd server
npm init -y
npm install express cors @anthropic-ai/sdk dotenv
```

`server/index.js` :

```js
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es l'assistant virtuel du cabinet d'avocats Badi Avocat
à Tunis (droit des affaires, civil, famille, travail). Réponds de façon brève,
professionnelle et rassurante, dans la langue du message reçu (français ou
anglais). Tu ne donnes jamais de conseil juridique définitif : pour toute
question précise, oriente vers une prise de rendez-vous via le formulaire du
site. Ne réponds qu'aux questions liées au cabinet, à ses services, à ses
horaires ou à la prise de rendez-vous.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message }],
    });
    const reply = response.content.find(b => b.type === 'text')?.text
      ?? "Désolé, je n'ai pas pu générer de réponse.";
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Une erreur est survenue, veuillez réessayer." });
  }
});

app.listen(3001, () => console.log('Chat backend running on http://localhost:3001'));
```

`server/.env` :

```
ANTHROPIC_API_KEY=your-key-here
```

Run it:

```bash
node server/index.js
```

Then in `script.js`, replace the body of `getBotReply()` with:

```js
async function getBotReply(userText){
  const res = await fetch('http://localhost:3001/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userText, lang: currentLang() })
  });
  const data = await res.json();
  return data.reply;
}
```

For production, deploy the `server/` folder (Render, Railway, Fly.io, a small
VPS…) and point the `fetch` URL to that deployed address instead of
`localhost`.

## 6. Déploiement du site

Le site étant statique, vous pouvez l'héberger gratuitement sur **Netlify**,
**Vercel** ou **GitHub Pages** en quelques clics (glisser-déposer le dossier
sur Netlify, par exemple). Le backend du chatbot (s'il est utilisé) doit être
déployé séparément, comme indiqué ci-dessus.

## 7. Prochaines étapes suggérées

- Remplacer les textes et coordonnées d'exemple par les vraies informations.
- Ajouter une vraie photo de l'avocat.
- Ajouter Google Maps dans le footer (`<iframe>` d'intégration Google Maps).
- Ajouter Google Analytics ou Plausible pour suivre les visites.
- Connecter le chatbot à un vrai backend LLM (section 5).
