/* ============================================================
   Mehrsprachigkeit
   Die Schweiz hat vier Sprachregionen — eine Plattform, die nur
   Deutsch kann, ist im Tessin und in der Romandie kein Angebot.
   Der Umschalter im Kopf war bisher Dekoration; hier ist die
   Mechanik dahinter.

   Bewusst ohne Bibliothek: Ein flaches Wörterbuch, ein Store und
   ein t() reichen für diesen Umfang. i18next käme mit 40 kB und
   Funktionen, die hier niemand braucht.

   STAND DER ÜBERSETZUNG
   Vollständig sind Navigation, Fusszeile, Altersschranke,
   Inseratekarten, Suche und Filter, Merkliste und Fehlerseite —
   also die Oberfläche, die auf jeder Seite mitläuft. Die langen
   redaktionellen Texte (Startseite, Inserieren, Kasse, Sicherheit,
   Recht) sind weiterhin Deutsch und tragen in den anderen Sprachen
   einen sichtbaren Hinweis. Diese Texte gehören zu einer
   Fachübersetzerin, nicht in eine maschinelle Ersetzung: Bei AGB
   und Sicherheitshinweisen einer Erotikplattform ist eine schiefe
   Formulierung ein Haftungsrisiko.
   ============================================================ */

import { useSyncExternalStore } from "react";

export const LOCALES = ["de", "fr", "it", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  en: "English",
};

const KEY = "noira.locale.v1";

/* ------------------------------------------------------------------
   Store
   ------------------------------------------------------------------ */

function initial(): Locale {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored && (LOCALES as readonly string[]).includes(stored)) return stored as Locale;
  } catch {
    /* Privater Modus */
  }

  // Bewusst Deutsch als Vorgabe statt der Browsersprache: Solange die
  // langen Texte nur auf Deutsch vorliegen, bekäme ein englischer
  // Browser eine englische Hülle um deutschen Inhalt — schlechter als
  // eine durchgehend deutsche Seite mit sichtbarem Umschalter.
  // Sobald die Fliesstexte übersetzt sind, gehört hier die
  // Browsersprache hin (navigator.language, auf LOCALES gefiltert).
  return "de";
}

let current: Locale = initial();
const listeners = new Set<() => void>();

function syncDocument() {
  if (typeof document !== "undefined") document.documentElement.lang = `${current}-CH`;
}
syncDocument();

export function setLocale(next: Locale) {
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* Privater Modus: gilt dann nur für diese Sitzung */
  }
  syncDocument();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLocale() {
  return current;
}

/* ------------------------------------------------------------------
   Wörterbuch
   ------------------------------------------------------------------ */

type Dict = Record<string, string>;

const de: Dict = {
  "nav.categories": "Kategorien",
  "nav.listings": "Inserate",
  "nav.clubs": "Clubs & Studios",
  "nav.advertise": "Inserieren",
  "nav.safety": "Sicherheit",
  "nav.login": "Anmelden",
  "nav.postAd": "Inserat aufgeben",
  "nav.search": "Suchen …",
  "nav.searchLong": "Name, Stadt, Service …",
  "nav.searchAria": "Inserate durchsuchen",
  "nav.language": "Sprache wählen",
  "nav.menuOpen": "Menü öffnen",
  "nav.menuClose": "Menü schliessen",
  "nav.navigation": "Navigation",
  "nav.home": "NOIRA Startseite",
  "nav.saved": "Merkliste",
  "nav.savedAria": "Merkliste, {n} Einträge",

  "footer.tagline":
    "NOIRA ist eine Schweizer Inserateplattform für erotische Dienstleistungen. Wir vermitteln nicht, wir stellen die Bühne: Anbietende inserieren selbstständig, bestimmen ihre Preise selbst und behalten die volle Kontrolle über ihr Profil.",
  "footer.discover": "Entdecken",
  "footer.allListings": "Alle Inserate",
  "footer.regions": "Regionen",
  "footer.platform": "Plattform",
  "footer.prices": "Preise",
  "footer.safetyLong": "Sicherheit & Meldestelle",
  "footer.terms": "AGB",
  "footer.privacy": "Datenschutz",
  "footer.imprint": "Impressum",
  "footer.reportTitle": "Verdacht auf Zwang, Menschenhandel oder Minderjährige?",
  "footer.reportText":
    "Melden Sie es sofort — anonym und rund um die Uhr. Notruf Polizei 117, Beratung für Betroffene bei der Fachstelle ACT212 unter 0840 212 212.",
  "footer.reportCta": "Meldung erfassen",
  "footer.copyright": "© {year} NOIRA — Ein Angebot der Noira Media GmbH, Zürich.",
  "footer.adultsOnly": "Inhalte nur für Erwachsene · RTA-gekennzeichnet",

  "age.eyebrow": "Zutritt ab 18 Jahren",
  "age.title": "Diese Seite enthält Inhalte für",
  "age.titleAccent": "Erwachsene",
  "age.body":
    "NOIRA ist eine Inserateplattform für erotische Dienstleistungen in der Schweiz. Mit dem Betreten bestätigen Sie, dass Sie mindestens 18 Jahre alt sind, dass solche Inhalte an Ihrem Aufenthaltsort erlaubt sind und dass Sie sie freiwillig aufrufen.",
  "age.enter": "Ich bin 18 oder älter — eintreten",
  "age.leave": "Ich bin jünger — verlassen",
  "age.note":
    "Wir setzen nur technisch notwendige Cookies. Details in der {privacy}. Hinweise auf Zwang, Ausbeutung oder Minderjährige melden Sie bitte sofort über {safety}.",
  "age.privacyLink": "Datenschutzerklärung",
  "age.safetyLink": "Sicherheit & Meldestelle",

  "card.from": "ab",
  "card.perHour": " / Std.",
  "card.per30": " / 30 Min.",
  "card.premium": "Premium",
  "card.new": "Neu",
  "card.video": "Video",
  "card.online": "Jetzt erreichbar",
  "card.verified": "Verifiziert",
  "card.topPlacement": "Top-Platzierung",
  "card.save": "{name} merken",
  "card.unsave": "{name} nicht mehr merken",

  "list.eyebrow": "Inserate",
  "list.results": "Treffer",
  "list.filter": "Filter",
  "list.sort": "Sortierung",
  "list.sort.relevanz": "Empfohlen",
  "list.sort.neu": "Neueste zuerst",
  "list.sort.preisAuf": "Preis aufsteigend",
  "list.sort.preisAb": "Preis absteigend",
  "list.sort.premium": "Nur Premium",
  "list.region": "Region",
  "list.allSwitzerland": "Ganze Schweiz",
  "list.category": "Kategorie",
  "list.allCategories": "Alle Kategorien",
  "list.price": "Preis pro Stunde",
  "list.priceMaxAria": "Höchstpreis pro Stunde",
  "list.priceUpTo": "bis",
  "list.priceAny": "beliebig",
  "list.features": "Merkmale",
  "list.verifiedOnly": "Nur verifiziert",
  "list.onlineNow": "Jetzt erreichbar",
  "list.withVideo": "Mit Video",
  "list.incall": "Empfang in eigenen Räumen",
  "list.outcall": "Besucht mich",
  "list.incallShort": "Empfang",
  "list.services": "Services",
  "list.languages": "Sprachen",
  "list.resetAll": "alle zurücksetzen",
  "list.reset": "Filter zurücksetzen",
  "list.emptyTitle": "Keine Treffer",
  "list.emptyText":
    "Mit dieser Kombination finden wir gerade nichts. Weniger Filter, mehr Auswahl — oder eine Suche in einer Nachbarregion.",
  "list.showResults": "{n} Treffer anzeigen",
  "list.closeFilter": "Filter schliessen",
  "list.disclaimer":
    "Alle Inserate werden von den Anbietenden selbst erstellt. NOIRA vermittelt keine Dienstleistungen und ist an Absprachen nicht beteiligt.",

  "saved.eyebrow": "Merkliste",
  "saved.count": "gemerkt",
  "saved.clear": "Liste leeren",
  "saved.cleared": "Merkliste geleert",
  "saved.emptyHeading": "Noch nichts gemerkt",
  "saved.emptyTitle": "Ihre Auswahl bleibt hier",
  "saved.emptyText":
    "Tippen Sie auf einer Karte oder einem Profil auf das Herz. Die Liste bleibt in diesem Browser — ohne Konto, ohne dass wir sie sehen.",
  "saved.browse": "Inserate durchsuchen",
  "saved.gone": "{n} gemerkte Inserate sind nicht mehr verfügbar — sie sind abgelaufen oder wurden entfernt.",
  "saved.note":
    "Die Merkliste wird ausschliesslich in diesem Browser gespeichert. Sie geht verloren, wenn Sie den Verlauf löschen oder das Gerät wechseln — dafür erfährt niemand, wen Sie sich angesehen haben.",
  "saved.added": "Zur Merkliste hinzugefügt",
  "saved.removed": "Aus Merkliste entfernt",

  "404.eyebrow": "Fehler 404",
  "404.title": "Hier ist",
  "404.titleAccent": "niemand.",
  "404.body":
    "Diese Seite gibt es nicht mehr — vielleicht ist das Inserat abgelaufen oder wurde entfernt. Die Suche hilft weiter.",
  "404.toSearch": "Zur Suche",
  "404.home": "Startseite",

  "untranslated.title": "Diese Seite liegt noch nicht auf {language} vor.",
  "untranslated.body":
    "Oberfläche, Suche und Inserate sind übersetzt. Die längeren Texte dieser Seite werden derzeit fachlich übersetzt und erscheinen bis dahin auf Deutsch.",

  "cat.begleitung.label": "Begleitung & Escort",
  "cat.begleitung.short": "Begleitung",
  "cat.begleitung.desc": "Zeit zu zweit, Dinner-Dates, Reisebegleitung.",
  "cat.massage.label": "Massage & Wellness",
  "cat.massage.short": "Massage",
  "cat.massage.desc": "Tantra, Körper-zu-Körper, Entspannung.",
  "cat.dominanz.label": "Dominanz & Fetisch",
  "cat.dominanz.short": "Dominanz",
  "cat.dominanz.desc": "BDSM, Rollenspiele, Fetisch-Sessions.",
  "cat.trans.label": "Trans & Non-Binär",
  "cat.trans.short": "Trans",
  "cat.trans.desc": "Trans*, non-binäre und queere Anbietende.",
  "cat.paare.label": "Paare",
  "cat.paare.short": "Paare",
  "cat.paare.desc": "Gemeinsame Begegnungen zu dritt oder viert.",
  "cat.herren.label": "Herren",
  "cat.herren.short": "Herren",
  "cat.herren.desc": "Männliche Begleitung für alle Geschlechter.",
  "cat.club.label": "Clubs & Sauna",
  "cat.club.short": "Clubs",
  "cat.club.desc": "Häuser, Sauna-Clubs und Events.",
  "cat.studio.label": "Studios & Apartments",
  "cat.studio.short": "Studios",
  "cat.studio.desc": "Feste Adressen mit mehreren Anbietenden.",
  "cat.digital.label": "Digital & Cam",
  "cat.digital.short": "Digital",
  "cat.digital.desc": "Video-Dates, Chat, digitale Inhalte.",
};

const fr: Dict = {
  "nav.categories": "Catégories",
  "nav.listings": "Annonces",
  "nav.clubs": "Clubs & studios",
  "nav.advertise": "Publier",
  "nav.safety": "Sécurité",
  "nav.login": "Se connecter",
  "nav.postAd": "Publier une annonce",
  "nav.search": "Rechercher …",
  "nav.searchLong": "Nom, ville, prestation …",
  "nav.searchAria": "Rechercher dans les annonces",
  "nav.language": "Choisir la langue",
  "nav.menuOpen": "Ouvrir le menu",
  "nav.menuClose": "Fermer le menu",
  "nav.navigation": "Navigation",
  "nav.home": "NOIRA page d’accueil",
  "nav.saved": "Favoris",
  "nav.savedAria": "Favoris, {n} entrées",

  "footer.tagline":
    "NOIRA est une plateforme suisse d’annonces pour services érotiques. Nous ne servons pas d’intermédiaire, nous mettons la scène à disposition : les personnes qui publient le font de manière indépendante, fixent elles-mêmes leurs tarifs et gardent le contrôle total de leur profil.",
  "footer.discover": "Découvrir",
  "footer.allListings": "Toutes les annonces",
  "footer.regions": "Régions",
  "footer.platform": "Plateforme",
  "footer.prices": "Tarifs",
  "footer.safetyLong": "Sécurité & signalement",
  "footer.terms": "CGV",
  "footer.privacy": "Protection des données",
  "footer.imprint": "Mentions légales",
  "footer.reportTitle": "Soupçon de contrainte, de traite d’êtres humains ou de mineurs ?",
  "footer.reportText":
    "Signalez-le immédiatement — anonymement et 24 h/24. Police 117, conseil aux personnes concernées auprès du service ACT212 au 0840 212 212.",
  "footer.reportCta": "Faire un signalement",
  "footer.copyright": "© {year} NOIRA — Une offre de Noira Media GmbH, Zurich.",
  "footer.adultsOnly": "Contenu réservé aux adultes · signalé RTA",

  "age.eyebrow": "Accès dès 18 ans",
  "age.title": "Ce site contient du contenu pour",
  "age.titleAccent": "adultes",
  "age.body":
    "NOIRA est une plateforme d’annonces pour services érotiques en Suisse. En entrant, vous confirmez avoir au moins 18 ans, que ce type de contenu est autorisé là où vous vous trouvez et que vous y accédez librement.",
  "age.enter": "J’ai 18 ans ou plus — entrer",
  "age.leave": "Je suis plus jeune — quitter",
  "age.note":
    "Nous n’utilisons que des cookies techniquement nécessaires. Détails dans la {privacy}. Signalez immédiatement tout indice de contrainte, d’exploitation ou de mineurs via {safety}.",
  "age.privacyLink": "politique de confidentialité",
  "age.safetyLink": "Sécurité & signalement",

  "card.from": "dès",
  "card.perHour": " / h",
  "card.per30": " / 30 min",
  "card.premium": "Premium",
  "card.new": "Nouveau",
  "card.video": "Vidéo",
  "card.online": "Joignable maintenant",
  "card.verified": "Vérifié",
  "card.topPlacement": "Mise en avant",
  "card.save": "Ajouter {name} aux favoris",
  "card.unsave": "Retirer {name} des favoris",

  "list.eyebrow": "Annonces",
  "list.results": "résultats",
  "list.filter": "Filtres",
  "list.sort": "Tri",
  "list.sort.relevanz": "Recommandé",
  "list.sort.neu": "Plus récentes",
  "list.sort.preisAuf": "Prix croissant",
  "list.sort.preisAb": "Prix décroissant",
  "list.sort.premium": "Premium uniquement",
  "list.region": "Région",
  "list.allSwitzerland": "Toute la Suisse",
  "list.category": "Catégorie",
  "list.allCategories": "Toutes les catégories",
  "list.price": "Prix par heure",
  "list.priceMaxAria": "Prix maximum par heure",
  "list.priceUpTo": "jusqu’à",
  "list.priceAny": "sans limite",
  "list.features": "Caractéristiques",
  "list.verifiedOnly": "Vérifiés uniquement",
  "list.onlineNow": "Joignable maintenant",
  "list.withVideo": "Avec vidéo",
  "list.incall": "Reçoit chez elle ou lui",
  "list.outcall": "Se déplace",
  "list.incallShort": "Reçoit",
  "list.services": "Prestations",
  "list.languages": "Langues",
  "list.resetAll": "tout réinitialiser",
  "list.reset": "Réinitialiser les filtres",
  "list.emptyTitle": "Aucun résultat",
  "list.emptyText":
    "Cette combinaison ne donne rien pour l’instant. Moins de filtres, plus de choix — ou une recherche dans une région voisine.",
  "list.showResults": "Afficher {n} résultats",
  "list.closeFilter": "Fermer les filtres",
  "list.disclaimer":
    "Toutes les annonces sont rédigées par les personnes qui les publient. NOIRA ne fournit aucune prestation et n’intervient pas dans les arrangements.",

  "saved.eyebrow": "Favoris",
  "saved.count": "en favoris",
  "saved.clear": "Vider la liste",
  "saved.cleared": "Liste vidée",
  "saved.emptyHeading": "Aucun favori",
  "saved.emptyTitle": "Votre sélection reste ici",
  "saved.emptyText":
    "Touchez le cœur sur une carte ou un profil. La liste reste dans ce navigateur — sans compte, et sans que nous la voyions.",
  "saved.browse": "Parcourir les annonces",
  "saved.gone": "{n} annonces enregistrées ne sont plus disponibles — elles ont expiré ou ont été retirées.",
  "saved.note":
    "Les favoris sont enregistrés uniquement dans ce navigateur. Vous les perdez en effaçant l’historique ou en changeant d’appareil — en échange, personne ne sait qui vous avez consulté.",
  "saved.added": "Ajouté aux favoris",
  "saved.removed": "Retiré des favoris",

  "404.eyebrow": "Erreur 404",
  "404.title": "Il n’y a",
  "404.titleAccent": "personne ici.",
  "404.body":
    "Cette page n’existe plus — l’annonce a peut-être expiré ou été retirée. La recherche vous aidera.",
  "404.toSearch": "Vers la recherche",
  "404.home": "Accueil",

  "untranslated.title": "Cette page n’est pas encore disponible en {language}.",
  "untranslated.body":
    "L’interface, la recherche et les annonces sont traduites. Les textes plus longs de cette page sont en cours de traduction professionnelle et restent en allemand d’ici là.",

  "cat.begleitung.label": "Accompagnement & escorte",
  "cat.begleitung.short": "Accompagnement",
  "cat.begleitung.desc": "Du temps à deux, dîners, voyages.",
  "cat.massage.label": "Massage & bien-être",
  "cat.massage.short": "Massage",
  "cat.massage.desc": "Tantra, corps à corps, détente.",
  "cat.dominanz.label": "Domination & fétichisme",
  "cat.dominanz.short": "Domination",
  "cat.dominanz.desc": "BDSM, jeux de rôle, séances fétichistes.",
  "cat.trans.label": "Trans & non-binaire",
  "cat.trans.short": "Trans",
  "cat.trans.desc": "Personnes trans, non binaires et queer.",
  "cat.paare.label": "Couples",
  "cat.paare.short": "Couples",
  "cat.paare.desc": "Rencontres à trois ou à quatre.",
  "cat.herren.label": "Messieurs",
  "cat.herren.short": "Messieurs",
  "cat.herren.desc": "Accompagnement masculin pour tous les genres.",
  "cat.club.label": "Clubs & sauna",
  "cat.club.short": "Clubs",
  "cat.club.desc": "Maisons, clubs sauna et soirées.",
  "cat.studio.label": "Studios & appartements",
  "cat.studio.short": "Studios",
  "cat.studio.desc": "Adresses fixes avec plusieurs personnes.",
  "cat.digital.label": "Numérique & cam",
  "cat.digital.short": "Numérique",
  "cat.digital.desc": "Rendez-vous vidéo, chat, contenus numériques.",
};

const it: Dict = {
  "nav.categories": "Categorie",
  "nav.listings": "Annunci",
  "nav.clubs": "Club e studi",
  "nav.advertise": "Pubblica",
  "nav.safety": "Sicurezza",
  "nav.login": "Accedi",
  "nav.postAd": "Pubblica un annuncio",
  "nav.search": "Cerca …",
  "nav.searchLong": "Nome, città, servizio …",
  "nav.searchAria": "Cerca negli annunci",
  "nav.language": "Scegli la lingua",
  "nav.menuOpen": "Apri il menu",
  "nav.menuClose": "Chiudi il menu",
  "nav.navigation": "Navigazione",
  "nav.home": "NOIRA pagina iniziale",
  "nav.saved": "Preferiti",
  "nav.savedAria": "Preferiti, {n} voci",

  "footer.tagline":
    "NOIRA è una piattaforma svizzera di annunci per servizi erotici. Non facciamo da intermediari, mettiamo a disposizione il palcoscenico: chi pubblica lo fa in modo autonomo, stabilisce da sé i propri prezzi e mantiene il pieno controllo del proprio profilo.",
  "footer.discover": "Scopri",
  "footer.allListings": "Tutti gli annunci",
  "footer.regions": "Regioni",
  "footer.platform": "Piattaforma",
  "footer.prices": "Prezzi",
  "footer.safetyLong": "Sicurezza e segnalazioni",
  "footer.terms": "CG",
  "footer.privacy": "Protezione dei dati",
  "footer.imprint": "Impressum",
  "footer.reportTitle": "Sospetti di coercizione, tratta di esseri umani o minorenni?",
  "footer.reportText":
    "Segnalalo subito — in forma anonima e 24 ore su 24. Polizia 117, consulenza per le persone coinvolte presso il servizio ACT212 allo 0840 212 212.",
  "footer.reportCta": "Invia una segnalazione",
  "footer.copyright": "© {year} NOIRA — Un’offerta di Noira Media GmbH, Zurigo.",
  "footer.adultsOnly": "Contenuti solo per adulti · contrassegnati RTA",

  "age.eyebrow": "Accesso dai 18 anni",
  "age.title": "Questo sito contiene contenuti per",
  "age.titleAccent": "adulti",
  "age.body":
    "NOIRA è una piattaforma di annunci per servizi erotici in Svizzera. Entrando confermi di avere almeno 18 anni, che questi contenuti sono ammessi dove ti trovi e che vi accedi liberamente.",
  "age.enter": "Ho 18 anni o più — entra",
  "age.leave": "Sono più giovane — esci",
  "age.note":
    "Usiamo solo cookie tecnicamente necessari. Dettagli nell’{privacy}. Segnala subito ogni indizio di coercizione, sfruttamento o minorenni tramite {safety}.",
  "age.privacyLink": "informativa sulla privacy",
  "age.safetyLink": "Sicurezza e segnalazioni",

  "card.from": "da",
  "card.perHour": " / ora",
  "card.per30": " / 30 min",
  "card.premium": "Premium",
  "card.new": "Nuovo",
  "card.video": "Video",
  "card.online": "Raggiungibile ora",
  "card.verified": "Verificato",
  "card.topPlacement": "In evidenza",
  "card.save": "Aggiungi {name} ai preferiti",
  "card.unsave": "Rimuovi {name} dai preferiti",

  "list.eyebrow": "Annunci",
  "list.results": "risultati",
  "list.filter": "Filtri",
  "list.sort": "Ordinamento",
  "list.sort.relevanz": "Consigliati",
  "list.sort.neu": "Più recenti",
  "list.sort.preisAuf": "Prezzo crescente",
  "list.sort.preisAb": "Prezzo decrescente",
  "list.sort.premium": "Solo Premium",
  "list.region": "Regione",
  "list.allSwitzerland": "Tutta la Svizzera",
  "list.category": "Categoria",
  "list.allCategories": "Tutte le categorie",
  "list.price": "Prezzo all’ora",
  "list.priceMaxAria": "Prezzo massimo all’ora",
  "list.priceUpTo": "fino a",
  "list.priceAny": "senza limite",
  "list.features": "Caratteristiche",
  "list.verifiedOnly": "Solo verificati",
  "list.onlineNow": "Raggiungibile ora",
  "list.withVideo": "Con video",
  "list.incall": "Riceve nei propri spazi",
  "list.outcall": "Si sposta",
  "list.incallShort": "Riceve",
  "list.services": "Servizi",
  "list.languages": "Lingue",
  "list.resetAll": "azzera tutto",
  "list.reset": "Azzera i filtri",
  "list.emptyTitle": "Nessun risultato",
  "list.emptyText":
    "Con questa combinazione non troviamo nulla. Meno filtri, più scelta — oppure una ricerca in una regione vicina.",
  "list.showResults": "Mostra {n} risultati",
  "list.closeFilter": "Chiudi i filtri",
  "list.disclaimer":
    "Tutti gli annunci sono redatti da chi li pubblica. NOIRA non fornisce prestazioni e non interviene negli accordi.",

  "saved.eyebrow": "Preferiti",
  "saved.count": "salvati",
  "saved.clear": "Svuota la lista",
  "saved.cleared": "Lista svuotata",
  "saved.emptyHeading": "Nessun preferito",
  "saved.emptyTitle": "La tua selezione resta qui",
  "saved.emptyText":
    "Tocca il cuore su una scheda o su un profilo. La lista resta in questo browser — senza account e senza che noi la vediamo.",
  "saved.browse": "Sfoglia gli annunci",
  "saved.gone": "{n} annunci salvati non sono più disponibili — sono scaduti o sono stati rimossi.",
  "saved.note":
    "I preferiti sono salvati esclusivamente in questo browser. Vanno persi se cancelli la cronologia o cambi dispositivo — in cambio nessuno sa chi hai guardato.",
  "saved.added": "Aggiunto ai preferiti",
  "saved.removed": "Rimosso dai preferiti",

  "404.eyebrow": "Errore 404",
  "404.title": "Qui non c’è",
  "404.titleAccent": "nessuno.",
  "404.body":
    "Questa pagina non esiste più — forse l’annuncio è scaduto o è stato rimosso. La ricerca ti aiuta.",
  "404.toSearch": "Vai alla ricerca",
  "404.home": "Pagina iniziale",

  "untranslated.title": "Questa pagina non è ancora disponibile in {language}.",
  "untranslated.body":
    "Interfaccia, ricerca e annunci sono tradotti. I testi più lunghi di questa pagina sono in traduzione professionale e fino ad allora restano in tedesco.",

  "cat.begleitung.label": "Accompagnamento & escort",
  "cat.begleitung.short": "Accompagnamento",
  "cat.begleitung.desc": "Tempo in due, cene, viaggi.",
  "cat.massage.label": "Massaggi & benessere",
  "cat.massage.short": "Massaggi",
  "cat.massage.desc": "Tantra, corpo a corpo, relax.",
  "cat.dominanz.label": "Dominazione & feticismo",
  "cat.dominanz.short": "Dominazione",
  "cat.dominanz.desc": "BDSM, giochi di ruolo, sessioni feticiste.",
  "cat.trans.label": "Trans & non binari",
  "cat.trans.short": "Trans",
  "cat.trans.desc": "Persone trans, non binarie e queer.",
  "cat.paare.label": "Coppie",
  "cat.paare.short": "Coppie",
  "cat.paare.desc": "Incontri in tre o in quattro.",
  "cat.herren.label": "Uomini",
  "cat.herren.short": "Uomini",
  "cat.herren.desc": "Accompagnamento maschile per tutti i generi.",
  "cat.club.label": "Club & sauna",
  "cat.club.short": "Club",
  "cat.club.desc": "Case, sauna club ed eventi.",
  "cat.studio.label": "Studi & appartamenti",
  "cat.studio.short": "Studi",
  "cat.studio.desc": "Indirizzi fissi con più persone.",
  "cat.digital.label": "Digitale & cam",
  "cat.digital.short": "Digitale",
  "cat.digital.desc": "Video-appuntamenti, chat, contenuti digitali.",
};

const en: Dict = {
  "nav.categories": "Categories",
  "nav.listings": "Listings",
  "nav.clubs": "Clubs & studios",
  "nav.advertise": "Advertise",
  "nav.safety": "Safety",
  "nav.login": "Sign in",
  "nav.postAd": "Post a listing",
  "nav.search": "Search …",
  "nav.searchLong": "Name, city, service …",
  "nav.searchAria": "Search listings",
  "nav.language": "Choose language",
  "nav.menuOpen": "Open menu",
  "nav.menuClose": "Close menu",
  "nav.navigation": "Navigation",
  "nav.home": "NOIRA home",
  "nav.saved": "Saved",
  "nav.savedAria": "Saved list, {n} entries",

  "footer.tagline":
    "NOIRA is a Swiss listings platform for erotic services. We don’t broker anything — we provide the stage: everyone advertises independently, sets their own rates and keeps full control of their profile.",
  "footer.discover": "Discover",
  "footer.allListings": "All listings",
  "footer.regions": "Regions",
  "footer.platform": "Platform",
  "footer.prices": "Pricing",
  "footer.safetyLong": "Safety & reporting",
  "footer.terms": "Terms",
  "footer.privacy": "Privacy",
  "footer.imprint": "Legal notice",
  "footer.reportTitle": "Suspect coercion, trafficking or a minor?",
  "footer.reportText":
    "Report it immediately — anonymously, around the clock. Police 117, support for those affected at ACT212 on 0840 212 212.",
  "footer.reportCta": "File a report",
  "footer.copyright": "© {year} NOIRA — A service of Noira Media GmbH, Zurich.",
  "footer.adultsOnly": "Adults only · RTA labelled",

  "age.eyebrow": "18 and over only",
  "age.title": "This site contains content for",
  "age.titleAccent": "adults",
  "age.body":
    "NOIRA is a listings platform for erotic services in Switzerland. By entering you confirm that you are at least 18 years old, that such content is permitted where you are, and that you are accessing it of your own accord.",
  "age.enter": "I am 18 or older — enter",
  "age.leave": "I am younger — leave",
  "age.note":
    "We only use strictly necessary cookies. Details in our {privacy}. Report any sign of coercion, exploitation or minors immediately via {safety}.",
  "age.privacyLink": "privacy policy",
  "age.safetyLink": "Safety & reporting",

  "card.from": "from",
  "card.perHour": " / hr",
  "card.per30": " / 30 min",
  "card.premium": "Premium",
  "card.new": "New",
  "card.video": "Video",
  "card.online": "Available now",
  "card.verified": "Verified",
  "card.topPlacement": "Top placement",
  "card.save": "Save {name}",
  "card.unsave": "Remove {name} from saved",

  "list.eyebrow": "Listings",
  "list.results": "results",
  "list.filter": "Filters",
  "list.sort": "Sort",
  "list.sort.relevanz": "Recommended",
  "list.sort.neu": "Newest first",
  "list.sort.preisAuf": "Price, low to high",
  "list.sort.preisAb": "Price, high to low",
  "list.sort.premium": "Premium only",
  "list.region": "Region",
  "list.allSwitzerland": "All of Switzerland",
  "list.category": "Category",
  "list.allCategories": "All categories",
  "list.price": "Price per hour",
  "list.priceMaxAria": "Maximum price per hour",
  "list.priceUpTo": "up to",
  "list.priceAny": "any",
  "list.features": "Features",
  "list.verifiedOnly": "Verified only",
  "list.onlineNow": "Available now",
  "list.withVideo": "With video",
  "list.incall": "Hosts at their place",
  "list.outcall": "Travels to you",
  "list.incallShort": "Hosts",
  "list.services": "Services",
  "list.languages": "Languages",
  "list.resetAll": "reset all",
  "list.reset": "Reset filters",
  "list.emptyTitle": "No results",
  "list.emptyText":
    "Nothing matches this combination right now. Fewer filters mean more choice — or try a neighbouring region.",
  "list.showResults": "Show {n} results",
  "list.closeFilter": "Close filters",
  "list.disclaimer":
    "All listings are written by the people who place them. NOIRA provides no services and takes no part in any arrangement.",

  "saved.eyebrow": "Saved",
  "saved.count": "saved",
  "saved.clear": "Clear list",
  "saved.cleared": "List cleared",
  "saved.emptyHeading": "Nothing saved yet",
  "saved.emptyTitle": "Your picks stay here",
  "saved.emptyText":
    "Tap the heart on a card or a profile. The list stays in this browser — no account, and we never see it.",
  "saved.browse": "Browse listings",
  "saved.gone": "{n} saved listings are no longer available — they expired or were removed.",
  "saved.note":
    "The saved list lives only in this browser. It disappears if you clear your history or switch devices — in exchange, nobody learns who you looked at.",
  "saved.added": "Added to saved",
  "saved.removed": "Removed from saved",

  "404.eyebrow": "Error 404",
  "404.title": "There is",
  "404.titleAccent": "nobody here.",
  "404.body":
    "This page is gone — the listing may have expired or been removed. Search will get you further.",
  "404.toSearch": "Go to search",
  "404.home": "Home",

  "untranslated.title": "This page is not available in {language} yet.",
  "untranslated.body":
    "The interface, search and listings are translated. The longer texts on this page are with a professional translator and stay in German until then.",

  "cat.begleitung.label": "Companionship & escort",
  "cat.begleitung.short": "Companionship",
  "cat.begleitung.desc": "Time together, dinner dates, travel.",
  "cat.massage.label": "Massage & wellness",
  "cat.massage.short": "Massage",
  "cat.massage.desc": "Tantra, body to body, relaxation.",
  "cat.dominanz.label": "Domination & fetish",
  "cat.dominanz.short": "Domination",
  "cat.dominanz.desc": "BDSM, role play, fetish sessions.",
  "cat.trans.label": "Trans & non-binary",
  "cat.trans.short": "Trans",
  "cat.trans.desc": "Trans, non-binary and queer providers.",
  "cat.paare.label": "Couples",
  "cat.paare.short": "Couples",
  "cat.paare.desc": "Meeting as three or four.",
  "cat.herren.label": "Men",
  "cat.herren.short": "Men",
  "cat.herren.desc": "Male companionship for all genders.",
  "cat.club.label": "Clubs & sauna",
  "cat.club.short": "Clubs",
  "cat.club.desc": "Houses, sauna clubs and events.",
  "cat.studio.label": "Studios & apartments",
  "cat.studio.short": "Studios",
  "cat.studio.desc": "Fixed addresses with several providers.",
  "cat.digital.label": "Digital & cam",
  "cat.digital.short": "Digital",
  "cat.digital.desc": "Video dates, chat, digital content.",
};

const DICTS: Record<Locale, Dict> = { de, fr, it, en };

/* Kantone: Wo eine Sprache einen eigenen Namen hat, steht er hier.
   Alles Übrige bleibt in der amtlichen Schreibweise. */
const CANTON_NAMES: Partial<Record<Locale, Record<string, string>>> = {
  fr: {
    ZH: "Zurich", BE: "Berne", LU: "Lucerne", BS: "Bâle-Ville", BL: "Bâle-Campagne",
    AG: "Argovie", SG: "Saint-Gall", GE: "Genève", VD: "Vaud", TI: "Tessin",
    ZG: "Zoug", SO: "Soleure", SZ: "Schwytz", TG: "Thurgovie", GR: "Grisons",
    VS: "Valais", FR: "Fribourg", NE: "Neuchâtel", SH: "Schaffhouse",
    AR: "Appenzell Rh.-Ext.", GL: "Glaris", JU: "Jura", NW: "Nidwald",
    OW: "Obwald", UR: "Uri",
  },
  it: {
    ZH: "Zurigo", BE: "Berna", LU: "Lucerna", BS: "Basilea Città", BL: "Basilea Campagna",
    AG: "Argovia", SG: "San Gallo", GE: "Ginevra", VD: "Vaud", TI: "Ticino",
    ZG: "Zugo", SO: "Soletta", SZ: "Svitto", TG: "Turgovia", GR: "Grigioni",
    VS: "Vallese", FR: "Friburgo", NE: "Neuchâtel", SH: "Sciaffusa",
    AR: "Appenzello Esterno", GL: "Glarona", JU: "Giura", NW: "Nidvaldo",
    OW: "Obvaldo", UR: "Uri",
  },
  en: {
    ZH: "Zurich", BE: "Bern", LU: "Lucerne", BS: "Basel-City", BL: "Basel-Country",
    AG: "Aargau", SG: "St. Gallen", GE: "Geneva", VD: "Vaud", TI: "Ticino",
    ZG: "Zug", SO: "Solothurn", SZ: "Schwyz", TG: "Thurgau", GR: "Grisons",
    VS: "Valais", FR: "Fribourg", NE: "Neuchâtel", SH: "Schaffhausen",
    AR: "Appenzell Outer Rhodes", GL: "Glarus", JU: "Jura", NW: "Nidwalden",
    OW: "Obwalden", UR: "Uri",
  },
};

/* ------------------------------------------------------------------
   Zugriff
   ------------------------------------------------------------------ */

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

function translate(locale: Locale, key: string, vars?: Record<string, string | number>) {
  // Fehlt eine Übersetzung, gilt Deutsch — nie ein roher Schlüssel.
  const raw = DICTS[locale][key] ?? DICTS.de[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name) =>
    name in vars ? String(vars[name]) : m,
  );
}

export function useI18n() {
  const locale = useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );

  const t: Translate = (key, vars) => translate(locale, key, vars);

  return {
    locale,
    t,
    /** Kantonsname in der aktiven Sprache; sonst die amtliche Form. */
    canton: (code: string, fallback: string) => CANTON_NAMES[locale]?.[code] ?? fallback,
    isGerman: locale === "de",
    localeName: LOCALE_NAMES[locale],
  };
}
