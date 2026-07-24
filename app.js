"use strict";

const ADMIN_USERNAME = "Admin";
const ADMIN_EMAIL = "admin@6-7g2.de";
const ADMIN_PASSWORD = "AdminSafa";
const INTERNAL_EMAIL_DOMAIN = "6-7g2.de";
const QUIZ_LENGTH = 10;
const optionKeys = ["a", "b", "c", "d"];
const $ = (id) => document.getElementById(id);

const DEFAULT_SETTINGS = {
  id: 1,
  site_title: "6–7G2 Quiz",
  site_subtitle: "Mobbing, Medien & Gemeinschaft",
  hero_badge: "Gymnasium-Niveau",
  hero_title: "Wie fair und sicher bist du online?",
  hero_text: "Teste dein Wissen über Mobbing, Cybermobbing, Medien, Hate Speech und eine respektvolle Gemeinschaft.",
  logo_url: "assets/logo-6-7g2-web.png",
  accent_color: "#e6535c"
};

const DEFAULT_QUESTIONS = [
  ["Mobbing", "Wodurch unterscheidet sich Mobbing von einem gewöhnlichen Streit?", "Mobbing findet immer nur im Internet statt.", "Mobbing geschieht wiederholt und richtet sich gezielt gegen eine Person.", "Ein Streit ist grundsätzlich gefährlicher als Mobbing.", "Zwischen Mobbing und Streit gibt es keinen Unterschied.", "b", "Mobbing ist wiederholt, systematisch und häufig mit einem Machtungleichgewicht verbunden."],
  ["Cybermobbing", "Welche Besonderheit macht Cybermobbing besonders belastend?", "Digitale Inhalte erreichen viele Menschen und können lange gespeichert bleiben.", "Cybermobbing findet nur während der Schulzeit statt.", "Täterinnen und Täter sind immer unbekannt.", "Betroffene können alle Inhalte sofort vollständig löschen.", "a", "Digitale Angriffe können rund um die Uhr stattfinden und sich sehr schnell verbreiten."],
  ["Cybermobbing", "Welche Reaktion ist bei Cybermobbing am sinnvollsten?", "Zurückbeleidigen.", "Beweise sichern, blockieren und Hilfe holen.", "Alle Nachrichten weiterleiten.", "Die Situation geheim halten.", "b", "Beweise, Blockieren und Unterstützung sind sichere und wirksame Schritte."],
  ["Hate Speech", "Was beschreibt Hate Speech am besten?", "Jede Kritik.", "Eine sachliche Diskussion.", "Abwertende oder hasserfüllte Äußerungen gegen Personen oder Gruppen.", "Eine unfreundliche Begrüßung.", "c", "Hate Speech greift Menschen oder Gruppen abwertend und hasserfüllt an."],
  ["Medien", "Warum verbreiten sich problematische Inhalte in sozialen Medien oft schnell?", "Weil Beiträge geteilt und algorithmisch verbreitet werden.", "Weil es keine Kommentare gibt.", "Weil alle Inhalte vorher geprüft werden.", "Weil alle Konten anonym sind.", "a", "Teilen, Kommentare und Empfehlungsalgorithmen erhöhen die Reichweite."],
  ["Medienrechte", "Welche Aussage zum Recht am eigenen Bild ist richtig?", "Jedes Bild darf veröffentlicht werden.", "Gruppenbilder dürfen immer geteilt werden.", "Vor einer Veröffentlichung sollte die abgebildete Person zustimmen.", "Nur Erwachsene haben dieses Recht.", "c", "Die Zustimmung der abgebildeten Person schützt ihre Persönlichkeitsrechte."],
  ["Mobbing", "Welche Rolle spielen Zuschauerinnen und Zuschauer bei Mobbing?", "Sie haben keinen Einfluss.", "Schweigen oder Mitmachen kann das Mobbing verstärken.", "Sie sollten die Situation veröffentlichen.", "Sie tragen immer die alleinige Schuld.", "b", "Die Gruppe kann Mobbing verstärken oder durch Hilfe und Widerspruch stoppen."],
  ["Gemeinschaft", "Was stärkt eine respektvolle Gemeinschaft?", "Andere Meinungen verbieten.", "Konflikte mit Drohungen lösen.", "Unterschiedliche Meinungen anhören und sachlich diskutieren.", "Unbeliebte Personen ausschließen.", "c", "Respekt und sachlicher Austausch gehören zu einer guten Gemeinschaft."],
  ["Medienkompetenz", "Wie prüft man eine Nachricht im Internet am besten?", "An der Zahl der Likes.", "Durch den Vergleich mehrerer seriöser Quellen.", "An einer emotionalen Überschrift.", "An der Zahl der Kommentare.", "b", "Quellenvergleich und überprüfbare Belege sind entscheidend."],
  ["Gemeinschaft", "Eine Person wird im Klassenchat regelmäßig beleidigt. Was ist verantwortungsvoll?", "Nichts sagen.", "Nachrichten sichern, die Person unterstützen und eine Vertrauensperson informieren.", "Die Beleidigungen weiterleiten.", "Der Person sagen, sie solle sich nicht anstellen.", "b", "Unterstützung und das Einbeziehen einer Vertrauensperson helfen der betroffenen Person."],
  ["Mobbing", "Welches Merkmal weist besonders auf ein Machtungleichgewicht hin?", "Beide Seiten können den Konflikt gleich gut beenden.", "Eine Person kann sich über längere Zeit kaum allein wehren.", "Es gibt unterschiedliche Meinungen.", "Der Streit dauert fünf Minuten.", "b", "Beim Mobbing ist die betroffene Person häufig dauerhaft unterlegen."],
  ["Mobbing", "Welche mögliche Folge von Mobbing ist realistisch?", "Mehr Selbstvertrauen.", "Angst, Rückzug und sinkende Konzentration.", "Automatisch bessere Noten.", "Stärkere Freundschaften mit allen Beteiligten.", "b", "Mobbing kann die psychische Gesundheit und schulische Leistung stark belasten."],
  ["Cybermobbing", "Warum sollte man beleidigende Nachrichten nicht sofort löschen?", "Damit man sie später weiterverbreiten kann.", "Damit Beweise durch Screenshots gesichert werden können.", "Damit mehr Personen sie lesen.", "Weil Löschen grundsätzlich verboten ist.", "b", "Gesicherte Beweise können bei Meldungen und Gesprächen wichtig sein."],
  ["Cybermobbing", "Was bewirkt das Blockieren eines angreifenden Kontos?", "Alle Inhalte verschwinden aus dem Internet.", "Der direkte Kontakt des Kontos wird eingeschränkt.", "Die Polizei wird automatisch informiert.", "Das eigene Konto wird gelöscht.", "b", "Blockieren stoppt meist den direkten Kontakt, ersetzt aber nicht das Sichern von Beweisen."],
  ["Cybermobbing", "Welche Aussage über anonyme Konten ist richtig?", "Anonymität erlaubt jede Beleidigung.", "Auch anonyme Handlungen können Regeln und Gesetze verletzen.", "Anonyme Konten können nie gefunden werden.", "Anonyme Beiträge sind immer wahr.", "b", "Regeln und Gesetze gelten auch bei anonymen oder pseudonymen Konten."],
  ["Hate Speech", "Welche Aussage ist sachliche Kritik und keine Hate Speech?", "Alle Menschen dieser Gruppe sind wertlos.", "Ich lehne diese Entscheidung ab, weil die Begründung nicht überzeugt.", "Diese Gruppe sollte verschwinden.", "Niemand aus dieser Gruppe gehört hierher.", "b", "Sachliche Kritik begründet eine Meinung, ohne Menschen abzuwerten."],
  ["Hate Speech", "Was kann man gegen Hate Speech tun?", "Den Beitrag liken.", "Melden, widersprechen ohne zu beleidigen und Betroffene unterstützen.", "Den Inhalt in weitere Gruppen schicken.", "Immer allein mit der Person diskutieren.", "b", "Melden, Gegenrede und Unterstützung können die Wirkung von Hassrede begrenzen."],
  ["Hate Speech", "Warum kann das Weiterteilen von Hate Speech schädlich sein, auch wenn man sie ablehnt?", "Weil dadurch die Reichweite steigen kann.", "Weil Teilen im Internet unmöglich ist.", "Weil nur positive Beiträge geteilt werden dürfen.", "Weil der ursprüngliche Beitrag automatisch gelöscht wird.", "a", "Auch kritisches Weiterteilen kann problematischen Inhalten zusätzliche Sichtbarkeit geben."],
  ["Medienkompetenz", "Was ist ein Hinweis auf eine möglicherweise unseriöse Nachricht?", "Sie nennt überprüfbare Quellen.", "Sie verwendet eine extrem emotionale Überschrift ohne Belege.", "Sie nennt Autor und Datum.", "Sie unterscheidet Nachricht und Meinung.", "b", "Starke Emotionalisierung ohne Belege ist ein Warnsignal."],
  ["Medienkompetenz", "Was bedeutet Quellenvergleich?", "Nur die erste gefundene Seite lesen.", "Mehrere unabhängige und seriöse Quellen gegenüberstellen.", "Nur Kommentare lesen.", "Die meistgeteilte Aussage übernehmen.", "b", "Mehrere unabhängige Quellen helfen, Fehler und einseitige Darstellungen zu erkennen."],
  ["Medien", "Was ist ein Algorithmus in sozialen Medien vereinfacht erklärt?", "Eine Person, die alle Beiträge schreibt.", "Ein System, das unter anderem auswählt, welche Inhalte angezeigt werden.", "Ein Gesetz gegen Handys.", "Eine besondere Art von Passwort.", "b", "Algorithmen sortieren und empfehlen Inhalte anhand verschiedener Signale."],
  ["Medien", "Warum sind viele Likes kein sicherer Wahrheitsbeweis?", "Likes können Popularität zeigen, aber nicht die Richtigkeit belegen.", "Likes werden nur von Fachleuten vergeben.", "Jede wahre Nachricht hat gleich viele Likes.", "Unwahre Beiträge können nicht gelikt werden.", "a", "Popularität und Wahrheit sind nicht dasselbe."],
  ["Datenschutz", "Welche Information sollte man nicht öffentlich posten?", "Ein allgemeines Hobby.", "Passwörter oder genaue private Zugangsdaten.", "Eine Lieblingsfarbe.", "Eine Buch-Empfehlung.", "b", "Zugangsdaten und sensible persönliche Informationen müssen geschützt werden."],
  ["Datenschutz", "Warum sollte ein Passwort nicht für mehrere Konten verwendet werden?", "Damit man mehr Passwörter vergisst.", "Weil ein bekannt gewordenes Passwort sonst mehrere Konten gefährdet.", "Weil gleiche Passwörter technisch nicht funktionieren.", "Weil Passwörter täglich veröffentlicht werden müssen.", "b", "Ein Datenleck kann sonst den Zugriff auf mehrere Konten ermöglichen."],
  ["Gemeinschaft", "Was bedeutet Zivilcourage in einer Mobbingsituation?", "Sich selbst in Gefahr bringen.", "Verantwortungsvoll helfen, Unterstützung holen und nicht wegsehen.", "Die Situation filmen.", "Gerüchte verbreiten.", "b", "Zivilcourage bedeutet besonnenes Eingreifen und das Holen geeigneter Hilfe."],
  ["Gemeinschaft", "Wie sollte ein Konflikt in einer Gruppe möglichst gelöst werden?", "Durch persönliche Beleidigungen.", "Durch Zuhören, klare Regeln und eine faire Lösungssuche.", "Durch Ausschluss ohne Gespräch.", "Durch öffentliche Bloßstellung.", "b", "Ein fairer Konfliktprozess trennt Person und Problem und sucht gemeinsam Lösungen."],
  ["Gemeinschaft", "Welche Formulierung ist respektvoll?", "Deine Meinung ist lächerlich.", "Ich sehe das anders und möchte meine Gründe erklären.", "Mit dir rede ich nicht.", "Alle sollen dich ignorieren.", "b", "Respektvolle Sprache ermöglicht Widerspruch ohne Abwertung."],
  ["Medienrechte", "Darf ein privater Chat ohne Weiteres öffentlich gepostet werden?", "Ja, private Chats gehören allen.", "Nein, Privatsphäre und Persönlichkeitsrechte müssen beachtet werden.", "Ja, sobald ein Emoji enthalten ist.", "Nur am Wochenende.", "b", "Private Nachrichten dürfen nicht beliebig veröffentlicht werden."],
  ["Medienkompetenz", "Was ist der Unterschied zwischen Tatsache und Meinung?", "Es gibt keinen Unterschied.", "Eine Tatsache ist überprüfbar, eine Meinung ist eine persönliche Bewertung.", "Meinungen sind immer falsch.", "Tatsachen brauchen keine Belege.", "b", "Tatsachen können anhand von Belegen geprüft werden; Meinungen drücken Bewertungen aus."],
  ["Hate Speech", "Welche Wirkung kann wiederholte Hassrede auf eine Gemeinschaft haben?", "Sie stärkt automatisch das Vertrauen.", "Sie kann Angst, Ausgrenzung und gesellschaftliche Spaltung fördern.", "Sie verbessert jede Diskussion.", "Sie bleibt immer ohne Folgen.", "b", "Hassrede kann Betroffene einschüchtern und das Zusammenleben belasten."]
].map((q, index) => ({
  id: `demo-${index + 1}`, category: q[0], question_text: q[1], option_a: q[2], option_b: q[3], option_c: q[4], option_d: q[5], correct_option: q[6], explanation: q[7], sort_order: index + 1, is_active: true
}));

const config = window.QUIZ_CONFIG || {};
const backendReady = /^https:\/\/[a-z0-9]{20}\.supabase\.co\/?$/i.test(String(config.supabaseUrl || ""))
  && String(config.supabaseAnonKey || "").startsWith("sb_publishable_");
const LOCAL_SCORES_KEY = "quizLocalScoresV2";
let db = null;
let questionBank = [...DEFAULT_QUESTIONS];
let questions = [];
let answers = {};
let currentQuestionIndex = 0;
let currentUser = null;
let currentProfile = null;
let currentPlayerName = "";
let authMode = "login";
let siteSettings = {...DEFAULT_SETTINGS};
let toastTimer = null;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
}
function showToast(message, error = false) {
  const toast = $("toast");
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast${error ? " error" : ""}`;
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 4200);
}
function showView(id) {
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo({top: 0, behavior: "smooth"});
}
function openModal(id) { $(id).classList.remove("hidden"); }
function closeModal(id) { $(id).classList.add("hidden"); }
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function getOption(question, key) { return question[`option_${key}`]; }
function displayedLetter(question, key) {
  const order = question.option_order || optionKeys;
  const index = order.indexOf(key);
  return String.fromCharCode(65 + (index >= 0 ? index : optionKeys.indexOf(key)));
}
function prepareQuizQuestions() {
  return shuffle(questionBank).slice(0, Math.min(QUIZ_LENGTH, questionBank.length)).map((question) => ({...question, option_order: shuffle(optionKeys)}));
}
function normalizeUsername(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 30);
}
function identifierToEmail(identifier) {
  const value = identifier.trim();
  if (value.toLowerCase() === ADMIN_USERNAME.toLowerCase()) return ADMIN_EMAIL;
  if (value.includes("@")) return value.toLowerCase();
  return `${normalizeUsername(value)}@${INTERNAL_EMAIL_DOMAIN}`;
}

function getLocalScores() {
  try { return JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || "[]"); }
  catch { return []; }
}
function setLocalScores(items) {
  localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(items.slice(0, 300)));
}
function saveLocalScore(item) {
  const items = getLocalScores();
  items.unshift({...item, id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`, created_at: new Date().toISOString()});
  setLocalScores(items);
}

function applySettings(settings) {
  siteSettings = {...DEFAULT_SETTINGS, ...(settings || {})};
  document.documentElement.style.setProperty("--primary", siteSettings.accent_color || DEFAULT_SETTINGS.accent_color);
  $("siteTitle").textContent = siteSettings.site_title;
  $("siteSubtitle").textContent = siteSettings.site_subtitle;
  $("heroBadge").textContent = siteSettings.hero_badge;
  $("heroTitle").textContent = siteSettings.hero_title;
  $("heroText").textContent = siteSettings.hero_text;
  const logo = siteSettings.logo_url || DEFAULT_SETTINGS.logo_url;
  $("headerLogo").src = logo;
  $("heroLogo").src = logo;
  $("designLogoPreview").src = logo;
  document.title = siteSettings.site_title;
}

async function initialize() {
  bindEvents();
  applySettings(DEFAULT_SETTINGS);
  const rememberedName = localStorage.getItem("quizPlayerName");
  if (rememberedName) $("guestName").value = rememberedName;
  if (!backendReady) {
    renderRecentResults(getLocalScores());
    renderLeaderboard(getLocalScores());
    showToast("Supabase-URL ist unvollständig. Ergebnisse werden vorerst auf diesem Gerät gespeichert.", true);
    return;
  }
  db = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  await Promise.all([loadQuestions(), loadSettings(), loadScoreboards()]);
  const {data: {session}} = await db.auth.getSession();
  await applySession(session);
  db.auth.onAuthStateChange((_event, nextSession) => setTimeout(() => applySession(nextSession), 0));
}

function bindEvents() {
  $("startQuizButton").addEventListener("click", startQuiz);
  $("restartQuizButton").addEventListener("click", () => { showView("homeView"); setTimeout(startQuiz, 80); });
  $("previousQuestionButton").addEventListener("click", () => changeQuestion(-1));
  $("nextQuestionButton").addEventListener("click", () => changeQuestion(1));
  $("finishQuizButton").addEventListener("click", finishQuiz);
  $("cancelQuizButton").addEventListener("click", () => showView("homeView"));
  $("brandHome").addEventListener("click", (event) => { event.preventDefault(); showView("homeView"); });
  $("backToHomeButton").addEventListener("click", () => showView("homeView"));
  $("authButton").addEventListener("click", () => openModal("authModal"));
  $("closeAuthModal").addEventListener("click", () => closeModal("authModal"));
  $("logoutButton").addEventListener("click", logout);
  $("authForm").addEventListener("submit", submitAuth);
  document.querySelectorAll(".auth-tab").forEach((button) => button.addEventListener("click", () => setAuthMode(button.dataset.mode)));
  $("adminButton").addEventListener("click", openAdmin);
  document.querySelectorAll(".admin-tab").forEach((button) => button.addEventListener("click", () => switchAdminTab(button.dataset.tab)));
  $("addQuestionButton").addEventListener("click", () => openQuestionEditor());
  $("closeQuestionModal").addEventListener("click", () => closeModal("questionModal"));
  $("questionForm").addEventListener("submit", saveQuestion);
  $("designForm").addEventListener("submit", saveDesign);
  $("designLogoFile").addEventListener("change", previewLogoFile);
  $("createUserForm").addEventListener("submit", createUser);
  $("refreshUsersButton").addEventListener("click", loadUsers);
  $("clearScoresButton").addEventListener("click", clearScores);
  document.querySelectorAll(".modal").forEach((modal) => modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(modal.id); }));
}

async function loadQuestions() {
  const {data, error} = await db.from("questions").select("*").eq("is_active", true).order("sort_order");
  if (error) {
    questionBank = [...DEFAULT_QUESTIONS];
    showToast("Datenbankfragen konnten nicht geladen werden. Ersatzfragen werden verwendet.", true);
    return;
  }
  questionBank = data?.length ? data : [...DEFAULT_QUESTIONS];
}
async function loadSettings() {
  const {data, error} = await db.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (!error && data) applySettings(data);
}

function startQuiz() {
  const profileName = currentProfile?.display_name;
  const enteredName = $("guestName").value.trim();
  currentPlayerName = profileName || enteredName;
  if (!currentPlayerName) {
    showToast("Bitte zuerst einen Spielernamen eintragen.", true);
    $("guestName").focus();
    return;
  }
  localStorage.setItem("quizPlayerName", currentPlayerName);
  answers = {};
  currentQuestionIndex = 0;
  questions = prepareQuizQuestions();
  showView("quizView");
  renderQuestion();
}
function renderQuestion() {
  const question = questions[currentQuestionIndex];
  if (!question) { showToast("Keine Fragen vorhanden.", true); showView("homeView"); return; }
  $("questionCategory").textContent = question.category;
  $("questionText").textContent = question.question_text;
  $("questionCounter").textContent = `Frage ${currentQuestionIndex + 1} von ${questions.length}`;
  const answeredCount = Object.keys(answers).length;
  const percent = Math.round((answeredCount / questions.length) * 100);
  $("progressPercent").textContent = `${percent}%`;
  $("progressRing").style.setProperty("--progress", `${percent * 3.6}deg`);
  const options = $("answerOptions");
  options.innerHTML = "";
  question.option_order.forEach((key, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `answer-option${answers[question.id] === key ? " selected" : ""}`;
    button.innerHTML = `<span class="answer-letter">${String.fromCharCode(65 + index)}</span><span>${escapeHtml(getOption(question, key))}</span>`;
    button.addEventListener("click", () => { answers[question.id] = key; renderQuestion(); });
    options.appendChild(button);
  });
  $("previousQuestionButton").disabled = currentQuestionIndex === 0;
  const isLast = currentQuestionIndex === questions.length - 1;
  $("nextQuestionButton").classList.toggle("hidden", isLast);
  $("finishQuizButton").classList.toggle("hidden", !isLast);
  renderNavigator();
}
function renderNavigator() {
  const nav = $("questionNavigator");
  nav.innerHTML = "";
  questions.forEach((question, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `nav-dot${index === currentQuestionIndex ? " current" : ""}${answers[question.id] ? " answered" : ""}`;
    button.textContent = index + 1;
    button.addEventListener("click", () => { currentQuestionIndex = index; renderQuestion(); });
    nav.appendChild(button);
  });
}
function changeQuestion(delta) {
  const next = currentQuestionIndex + delta;
  if (next >= 0 && next < questions.length) { currentQuestionIndex = next; renderQuestion(); }
}
function gradeFor(percent) {
  if (percent >= 90) return 1;
  if (percent >= 80) return 2;
  if (percent >= 65) return 3;
  if (percent >= 50) return 4;
  if (percent >= 25) return 5;
  return 6;
}
async function finishQuiz() {
  const unanswered = questions.length - Object.keys(answers).length;
  if (unanswered && !confirm(`${unanswered} Frage(n) sind unbeantwortet. Trotzdem auswerten?`)) return;
  const score = questions.reduce((sum, question) => sum + (answers[question.id] === question.correct_option ? 1 : 0), 0);
  const percent = Math.round((score / questions.length) * 100);
  const grade = gradeFor(percent);
  $("resultPlayer").textContent = currentPlayerName;
  $("gradeCircle").querySelector("strong").textContent = grade;
  $("scorePoints").textContent = `${score}/${questions.length}`;
  $("scorePercent").textContent = `${percent}%`;
  $("scoreGrade").textContent = grade;
  const headings = {1:["Hervorragend!","Spitzenleistung!"],2:["Sehr gut gemacht!","Starke Leistung!"],3:["Gute Leistung!","Solides Ergebnis!"],4:["Bestanden!","Geschafft!"],5:["Noch etwas üben!","Der nächste Versuch wird besser!"],6:["Ein neuer Versuch lohnt sich!","Lies die Lösungen aufmerksam durch!"]};
  $("resultHeading").textContent = shuffle(headings[grade])[0];
  $("resultText").textContent = shuffle([`Du hast ${score} von ${questions.length} Punkten erreicht.`,`Dein Ergebnis beträgt ${percent} Prozent.`,`Du erhältst die Schulnote ${grade}.`])[0];
  renderReview();
  showView("resultView");
  const scorePayload = {player_name: currentPlayerName, user_id: currentUser?.id || null, score, total: questions.length, grade};
  let storedOnline = false;
  if (db) {
    try {
      const {error} = await db.from("scoreboard").insert(scorePayload);
      if (!error) storedOnline = true;
      if (currentUser) await db.from("quiz_attempts").insert({user_id: currentUser.id, score, total: questions.length, grade, answers});
    } catch (_error) {
      storedOnline = false;
    }
  }
  if (!storedOnline) {
    saveLocalScore(scorePayload);
    showToast("Ergebnis wurde auf diesem Gerät gespeichert. Für die gemeinsame Rangliste muss die vollständige Supabase-URL eingetragen werden.", true);
  }
  await loadScoreboards();
}
function renderReview() {
  const review = $("answerReview");
  review.innerHTML = "";
  questions.forEach((question, index) => {
    const selected = answers[question.id];
    const correct = selected === question.correct_option;
    const card = document.createElement("article");
    card.className = `review-card${correct ? "" : " wrong"}`;
    card.innerHTML = `<h3>${index + 1}. ${escapeHtml(question.question_text)}</h3><div class="review-line ${correct ? "correct" : "incorrect"}">Deine Antwort: ${selected ? `${displayedLetter(question, selected)}) ${escapeHtml(getOption(question, selected))}` : "Keine Antwort"}</div>${correct ? "" : `<div class="review-line correct">Richtige Antwort: ${displayedLetter(question, question.correct_option)}) ${escapeHtml(getOption(question, question.correct_option))}</div>`}<p class="explanation">${escapeHtml(question.explanation || "")}</p>`;
    review.appendChild(card);
  });
}

async function loadScoreboards() {
  const localItems = getLocalScores();
  if (!db) {
    renderRecentResults(localItems);
    renderLeaderboard(localItems);
    return;
  }
  try {
    const {data, error} = await db.from("scoreboard").select("id,player_name,score,total,grade,created_at").order("created_at", {ascending: false}).limit(200);
    const items = error ? localItems : [...(data || []), ...localItems];
    renderRecentResults(items);
    renderLeaderboard(items);
  } catch (_error) {
    renderRecentResults(localItems);
    renderLeaderboard(localItems);
  }
}
function renderRecentResults(items) {
  const body = $("recentResultsBody");
  const recent = items.slice(0, 20);
  body.innerHTML = recent.length ? recent.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.player_name)}</td><td>${item.score}/${item.total}</td><td>${item.grade}</td></tr>`).join("") : '<tr><td colspan="4">Noch keine Ergebnisse</td></tr>';
}
function renderLeaderboard(items) {
  const best = new Map();
  items.forEach((item) => {
    const key = item.player_name.trim().toLowerCase();
    const old = best.get(key);
    const rate = item.score / item.total;
    const oldRate = old ? old.score / old.total : -1;
    if (!old || rate > oldRate || (rate === oldRate && item.score > old.score)) best.set(key, item);
  });
  const ranking = [...best.values()].sort((a, b) => (b.score / b.total) - (a.score / a.total) || b.score - a.score || a.grade - b.grade).slice(0, 30);
  $("leaderboardBody").innerHTML = ranking.length ? ranking.map((item, index) => `<tr><td><span class="rank-badge${index < 3 ? " top" : ""}">${index + 1}</span></td><td>${escapeHtml(item.player_name)}</td><td>${item.score}/${item.total}</td><td>${item.grade}</td></tr>`).join("") : '<tr><td colspan="4">Noch keine Ergebnisse</td></tr>';
}

function setAuthMode(mode) {
  authMode = mode;
  document.querySelectorAll(".auth-tab").forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
  $("displayNameLabel").classList.toggle("hidden", mode !== "signup");
  $("authModalTitle").textContent = mode === "login" ? "Anmelden" : "Registrieren";
  $("authSubmitButton").textContent = mode === "login" ? "Anmelden" : "Konto erstellen";
  $("authIdentifierLabel").firstChild.textContent = mode === "login" ? "Benutzername oder E-Mail" : "Benutzername oder E-Mail";
}
async function submitAuth(event) {
  event.preventDefault();
  if (!db) { showToast("Anmeldung ist noch nicht verbunden. Die Supabase-URL wurde unvollständig kopiert.", true); return; }
  const identifier = $("authIdentifier").value.trim();
  const password = $("authPassword").value;
  const email = identifierToEmail(identifier);
  if (!email || email.startsWith("@")) { showToast("Bitte einen gültigen Benutzernamen eingeben.", true); return; }
  let result;
  if (authMode === "signup") {
    result = await db.auth.signUp({email, password, options: {data: {display_name: $("authDisplayName").value.trim() || identifier, username: identifier}}});
  } else {
    result = await db.auth.signInWithPassword({email, password});
    if (result.error && identifier.toLowerCase() === "admin" && password === ADMIN_PASSWORD) {
      const created = await db.auth.signUp({email: ADMIN_EMAIL, password: ADMIN_PASSWORD, options: {data: {display_name: "Admin", username: "Admin"}}});
      if (!created.error && created.data.session) {
        await db.rpc("ensure_fixed_admin");
        result = created;
      } else if (!created.error && !created.data.session) {
        showToast("Admin wurde angelegt. Schalte in Supabase die E-Mail-Bestätigung aus und melde dich erneut an.", true);
        return;
      }
    }
  }
  if (result.error) { showToast(translateAuthError(result.error.message), true); return; }
  if (email === ADMIN_EMAIL && result.data.session) await db.rpc("ensure_fixed_admin");
  closeModal("authModal");
  $("authForm").reset();
  showToast(authMode === "signup" ? "Konto wurde erstellt." : "Erfolgreich angemeldet.");
}
function translateAuthError(message) {
  if (/Invalid login credentials/i.test(message)) return "Benutzername oder Passwort ist falsch.";
  if (/Email not confirmed/i.test(message)) return "Das Konto ist noch nicht bestätigt. Bitte E-Mail-Bestätigung in Supabase ausschalten.";
  if (/already registered/i.test(message)) return "Dieser Benutzername ist bereits vergeben.";
  if (/Failed to fetch/i.test(message)) return "Supabase konnte nicht erreicht werden. Die Project URL in config.js ist unvollständig oder falsch.";
  return message;
}
async function applySession(session) {
  currentUser = session?.user || null;
  currentProfile = null;
  if (currentUser && db) {
    if (currentUser.email === ADMIN_EMAIL) await db.rpc("ensure_fixed_admin");
    const {data} = await db.from("profiles").select("*").eq("id", currentUser.id).maybeSingle();
    currentProfile = data || null;
    if (currentProfile && currentProfile.is_active === false) {
      await db.auth.signOut();
      showToast("Dieses Konto wurde deaktiviert.", true);
      return;
    }
  }
  $("authButton").classList.toggle("hidden", Boolean(currentUser));
  $("logoutButton").classList.toggle("hidden", !currentUser);
  $("userBadge").classList.toggle("hidden", !currentUser);
  $("adminButton").classList.toggle("hidden", currentProfile?.role !== "admin");
  if (currentUser) {
    $("userBadge").textContent = currentProfile?.display_name || currentProfile?.username || currentUser.email;
    if (currentProfile?.display_name) $("guestName").value = currentProfile.display_name;
  }
}
async function logout() {
  if (db) await db.auth.signOut();
  showView("homeView");
  showToast("Du wurdest abgemeldet.");
}

async function openAdmin() {
  if (currentProfile?.role !== "admin") { showToast("Kein Adminzugriff.", true); return; }
  showView("adminView");
  switchAdminTab("questions");
  await loadAdminQuestions();
}
function switchAdminTab(tab) {
  document.querySelectorAll(".admin-tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  ["questions", "design", "users", "scores"].forEach((name) => $(`${name}AdminPanel`).classList.toggle("active", name === tab));
  if (tab === "design") fillDesignForm();
  if (tab === "users") loadUsers();
  if (tab === "scores") loadAdminScores();
}
async function loadAdminQuestions() {
  const {data, error} = await db.from("questions").select("*").order("sort_order");
  if (error) { showToast(error.message, true); return; }
  renderAdminQuestions(data || []);
}
function renderAdminQuestions(items) {
  const list = $("adminQuestionsList");
  list.innerHTML = items.length ? "" : '<div class="empty-state">Noch keine Fragen vorhanden.</div>';
  items.forEach((question) => {
    const row = document.createElement("div");
    row.className = "admin-question-item";
    row.innerHTML = `<div class="item-content"><strong>${question.sort_order}. ${escapeHtml(question.question_text)}</strong><span>${escapeHtml(question.category)} · Richtig: ${question.correct_option.toUpperCase()} · ${question.is_active ? "Aktiv" : "Inaktiv"}</span></div><div class="item-actions"><button class="button button-secondary small-button edit">Bearbeiten</button><button class="button button-danger small-button delete">Löschen</button></div>`;
    row.querySelector(".edit").addEventListener("click", () => openQuestionEditor(question));
    row.querySelector(".delete").addEventListener("click", () => deleteQuestion(question.id));
    list.appendChild(row);
  });
}
function openQuestionEditor(question = null) {
  $("questionForm").reset();
  $("editQuestionId").value = question?.id || "";
  $("questionModalTitle").textContent = question ? "Frage bearbeiten" : "Neue Frage";
  $("editCategory").value = question?.category || "";
  $("editQuestionText").value = question?.question_text || "";
  optionKeys.forEach((key) => { $(`editOption${key.toUpperCase()}`).value = question?.[`option_${key}`] || ""; });
  $("editCorrectOption").value = question?.correct_option || "a";
  $("editSortOrder").value = question?.sort_order || questionBank.length + 1;
  $("editExplanation").value = question?.explanation || "";
  $("editIsActive").checked = question?.is_active ?? true;
  openModal("questionModal");
}
async function saveQuestion(event) {
  event.preventDefault();
  const id = $("editQuestionId").value;
  const payload = {category: $("editCategory").value.trim(), question_text: $("editQuestionText").value.trim(), option_a: $("editOptionA").value.trim(), option_b: $("editOptionB").value.trim(), option_c: $("editOptionC").value.trim(), option_d: $("editOptionD").value.trim(), correct_option: $("editCorrectOption").value, sort_order: Number($("editSortOrder").value), explanation: $("editExplanation").value.trim(), is_active: $("editIsActive").checked, updated_at: new Date().toISOString()};
  const query = id ? db.from("questions").update(payload).eq("id", id) : db.from("questions").insert({...payload, created_by: currentUser.id});
  const {error} = await query;
  if (error) { showToast(error.message, true); return; }
  closeModal("questionModal");
  showToast("Frage gespeichert.");
  await Promise.all([loadAdminQuestions(), loadQuestions()]);
}
async function deleteQuestion(id) {
  if (!confirm("Diese Frage wirklich löschen?")) return;
  const {error} = await db.from("questions").delete().eq("id", id);
  if (error) { showToast(error.message, true); return; }
  await Promise.all([loadAdminQuestions(), loadQuestions()]);
  showToast("Frage gelöscht.");
}

function fillDesignForm() {
  $("designSiteTitle").value = siteSettings.site_title;
  $("designSiteSubtitle").value = siteSettings.site_subtitle;
  $("designHeroBadge").value = siteSettings.hero_badge;
  $("designHeroTitle").value = siteSettings.hero_title;
  $("designHeroText").value = siteSettings.hero_text;
  $("designAccent").value = siteSettings.accent_color || "#e6535c";
  $("designLogoUrl").value = siteSettings.logo_url || "";
  $("designLogoPreview").src = siteSettings.logo_url || DEFAULT_SETTINGS.logo_url;
}
function previewLogoFile(event) {
  const file = event.target.files?.[0];
  if (file) $("designLogoPreview").src = URL.createObjectURL(file);
}
async function saveDesign(event) {
  event.preventDefault();
  let logoUrl = $("designLogoUrl").value.trim() || siteSettings.logo_url;
  const file = $("designLogoFile").files?.[0];
  if (file) {
    const extension = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `logos/logo-${Date.now()}.${extension}`;
    const {error: uploadError} = await db.storage.from("site-assets").upload(path, file, {cacheControl: "3600", upsert: false});
    if (uploadError) { showToast(`Logo konnte nicht hochgeladen werden: ${uploadError.message}`, true); return; }
    logoUrl = db.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
  }
  const payload = {id: 1, site_title: $("designSiteTitle").value.trim(), site_subtitle: $("designSiteSubtitle").value.trim(), hero_badge: $("designHeroBadge").value.trim(), hero_title: $("designHeroTitle").value.trim(), hero_text: $("designHeroText").value.trim(), accent_color: $("designAccent").value, logo_url: logoUrl, updated_by: currentUser.id, updated_at: new Date().toISOString()};
  const {data, error} = await db.from("site_settings").upsert(payload).select().single();
  if (error) { showToast(error.message, true); return; }
  applySettings(data);
  $("designLogoFile").value = "";
  showToast("Seitenansicht gespeichert.");
}

async function createUser(event) {
  event.preventDefault();
  const usernameInput = $("newUsername").value.trim();
  const username = normalizeUsername(usernameInput);
  if (username.length < 3) { showToast("Der Benutzername braucht mindestens 3 gültige Zeichen.", true); return; }
  if (username === "admin") { showToast("Der Benutzername Admin ist bereits reserviert.", true); return; }
  const email = `${username}@${INTERNAL_EMAIL_DOMAIN}`;
  const temporaryClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}});
  const {data, error} = await temporaryClient.auth.signUp({email, password: $("newUserPassword").value, options: {data: {display_name: $("newUserName").value.trim(), username: usernameInput}}});
  if (error) { showToast(translateAuthError(error.message), true); return; }
  if (!data.user) { showToast("Konto konnte nicht erstellt werden.", true); return; }
  await new Promise((resolve) => setTimeout(resolve, 300));
  const {error: profileError} = await db.from("profiles").update({username: usernameInput, display_name: $("newUserName").value.trim(), role: $("newUserRole").value, is_active: true}).eq("id", data.user.id);
  if (profileError) { showToast(`Konto angelegt, Profil konnte aber nicht angepasst werden: ${profileError.message}`, true); return; }
  event.target.reset();
  showToast(`Konto ${usernameInput} wurde erstellt.`);
  await loadUsers();
}
async function loadUsers() {
  const {data, error} = await db.from("profiles").select("id,email,username,display_name,role,is_active,created_at").order("created_at");
  if (error) { showToast(error.message, true); return; }
  const list = $("usersList");
  list.innerHTML = data?.length ? "" : '<div class="empty-state">Keine Konten gefunden.</div>';
  (data || []).forEach((user) => {
    const row = document.createElement("div");
    row.className = "user-item";
    row.innerHTML = `<div class="item-content"><strong>${escapeHtml(user.display_name || user.username || "Ohne Name")}</strong><span>Benutzername: ${escapeHtml(user.username || user.email?.split("@")[0] || "-")}</span></div><div class="role-controls"><select class="role"><option value="student">Spieler/in</option><option value="admin">Admin</option></select><label class="toggle-label"><input class="active" type="checkbox"> Aktiv</label></div>`;
    const role = row.querySelector(".role");
    const active = row.querySelector(".active");
    role.value = user.role;
    active.checked = user.is_active !== false;
    const self = user.id === currentUser.id;
    role.disabled = self;
    active.disabled = self;
    role.addEventListener("change", () => updateUser(user.id, {role: role.value}));
    active.addEventListener("change", () => updateUser(user.id, {is_active: active.checked}));
    list.appendChild(row);
  });
}
async function updateUser(id, changes) {
  const {error} = await db.from("profiles").update(changes).eq("id", id);
  if (error) { showToast(error.message, true); await loadUsers(); return; }
  showToast("Konto aktualisiert.");
}

async function loadAdminScores() {
  const {data, error} = await db.from("scoreboard").select("*").order("created_at", {ascending: false}).limit(300);
  if (error) { showToast(error.message, true); return; }
  const list = $("adminScoresList");
  list.innerHTML = data?.length ? "" : '<div class="empty-state">Noch keine Ergebnisse.</div>';
  (data || []).forEach((item) => {
    const row = document.createElement("div");
    row.className = "score-item";
    row.innerHTML = `<div class="item-content"><strong>${escapeHtml(item.player_name)} · ${item.score}/${item.total} Punkte · Note ${item.grade}</strong><span>${new Date(item.created_at).toLocaleString("de-DE")}</span></div><button class="button button-danger small-button">Löschen</button>`;
    row.querySelector("button").addEventListener("click", () => deleteScore(item.id));
    list.appendChild(row);
  });
}
async function deleteScore(id) {
  const {error} = await db.from("scoreboard").delete().eq("id", id);
  if (error) { showToast(error.message, true); return; }
  await Promise.all([loadAdminScores(), loadScoreboards()]);
}
async function clearScores() {
  if (!confirm("Wirklich alle Ergebnisse löschen?")) return;
  const {error} = await db.from("scoreboard").delete().gte("id", 0);
  if (error) { showToast(error.message, true); return; }
  await Promise.all([loadAdminScores(), loadScoreboards()]);
  showToast("Alle Ergebnisse wurden gelöscht.");
}

initialize().catch((error) => { console.error(error); showToast("Beim Start ist ein Fehler aufgetreten.", true); });
