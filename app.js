const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const STORAGE_KEY = "nour-ai-chats-v2";

const state = {
  mode: "chat",
  chats: loadChats(),
  currentId: null,
  busy: false,
  inputImage: null,
  editorHtml: ""
};

const els = {
  messages: $("#messages"),
  prompt: $("#prompt"),
  composer: $("#composer"),
  send: $("#sendBtn"),
  history: $("#history"),
  topSubtitle: $("#topSubtitle"),
  connection: $("#connection"),
  sidebar: $("#sidebar"),
  shade: $("#mobileShade"),
  setup: $("#setupDialog"),
  editor: $("#editorDialog"),
  editorFrame: $("#editorFrame"),
  editorStage: $("#editorStage")
};

function loadChats() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveChats() {
  const safeChats = state.chats.slice(0, 20).map(chat => ({
    ...chat,
    messages: chat.messages.slice(-40).map(message => {
      const copy = { ...message };
      if (copy.type === "image" && copy.src?.startsWith("data:")) {
        delete copy.src;
        copy.text = copy.text || "Bild wurde erstellt. Das Bild wird aus Platzgründen nicht im Browser-Verlauf gespeichert.";
      }
      return copy;
    })
  }));
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(safeChats)); } catch { /* Speicher voll */ }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function currentChat() {
  return state.chats.find(chat => chat.id === state.currentId) || null;
}

function createChat() {
  const chat = {
    id: makeId(),
    title: "Neuer Chat",
    createdAt: Date.now(),
    previousInteractionId: null,
    messages: []
  };
  state.chats.unshift(chat);
  state.currentId = chat.id;
  state.mode = "chat";
  setMode("chat");
  saveChats();
  renderAll();
  closeSidebar();
  setTimeout(() => els.prompt.focus(), 80);
}

function openChat(id) {
  if (!state.chats.some(chat => chat.id === id)) return;
  state.currentId = id;
  renderAll();
  closeSidebar();
}

function deleteAllChats() {
  if (!confirm("Möchtest du den gesamten lokalen Verlauf löschen?")) return;
  state.chats = [];
  state.currentId = null;
  saveChats();
  createChat();
}

function addMessage(message) {
  let chat = currentChat();
  if (!chat) {
    createChat();
    chat = currentChat();
  }
  chat.messages.push({ id: makeId(), createdAt: Date.now(), ...message });
  if (chat.title === "Neuer Chat" && message.role === "user") {
    chat.title = String(message.text || "Neuer Chat").slice(0, 42);
  }
  saveChats();
  renderHistory();
  renderMessages();
  scrollBottom();
  return chat.messages[chat.messages.length - 1];
}

function updateMessage(id, patch) {
  const chat = currentChat();
  const message = chat?.messages.find(item => item.id === id);
  if (!message) return;
  Object.assign(message, patch);
  saveChats();
  renderMessages();
  scrollBottom();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatText(value = "") {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

function welcomeHtml() {
  return `
    <div class="welcome">
      <div class="welcome-logo">N</div>
      <h1>Was möchtest du heute machen?</h1>
      <p>Unterhalte dich mit Nour AI, erstelle echte Bilder, generiere Videos oder baue eine komplette Website.</p>
      <div class="suggestions">
        <button class="suggestion" data-suggest="Erkläre mir einfach, wie künstliche Intelligenz funktioniert."><b>Etwas erklären</b><span>Fragen stellen und verständliche Antworten erhalten</span></button>
        <button class="suggestion" data-mode-suggest="image" data-suggest="Erstelle ein hochwertiges futuristisches Logo für Nour AI auf dunklem Hintergrund."><b>Ein Bild erstellen</b><span>Poster, Logos, Produktbilder und Illustrationen</span></button>
        <button class="suggestion" data-mode-suggest="video" data-suggest="Ein cineastisches Video einer leuchtenden futuristischen Stadt bei Nacht, Kameraflug zwischen den Gebäuden, passende Geräusche."><b>Ein Video erstellen</b><span>8 Sekunden mit Veo und Ton</span></button>
        <button class="suggestion" data-mode-suggest="website" data-suggest="Eine moderne Website für ein kreatives KI-Studio namens Nour AI, dunkles Premium-Design, Leistungen, Beispiele und Kontaktbereich."><b>Eine Website bauen</b><span>Danach direkt visuell bearbeiten</span></button>
      </div>
    </div>`;
}

function messageHtml(message) {
  if (message.role === "user") {
    return `<article class="message user"><div class="bubble">${formatText(message.text)}</div></article>`;
  }

  let result = "";
  if (message.type === "image" && message.src) {
    result = `<div class="result-card"><img src="${message.src}" alt="Von Nour AI erzeugtes Bild"><div class="card-actions"><a class="primary" href="${message.src}" download="nour-ai-bild.png">Bild herunterladen</a></div></div>`;
  }
  if (message.type === "website" && message.html) {
    const encoded = encodeURIComponent(message.id);
    result = `<div class="result-card"><iframe title="Website-Vorschau" sandbox="allow-same-origin" data-website-id="${encoded}"></iframe><div class="card-actions"><button class="primary edit-site" data-message-id="${message.id}">Website bearbeiten</button><button class="download-site" data-message-id="${message.id}">HTML herunterladen</button></div></div>`;
  }
  if (message.type === "video-progress") {
    result = `<div class="result-card progress-card"><div class="progress-head"><b>Video wird erstellt</b><span>${escapeHtml(message.status || "Das kann einige Minuten dauern …")}</span></div><div class="progress-track"><div class="progress-bar"></div></div></div>`;
  }
  if (message.type === "video" && message.src) {
    result = `<div class="result-card"><video src="${escapeHtml(message.src)}" controls playsinline></video><div class="card-actions"><a class="primary" href="${escapeHtml(message.src)}" download="nour-ai-video.mp4">Video herunterladen</a><span class="paid-note">Google speichert erzeugte Videos nur begrenzte Zeit. Lade es bald herunter.</span></div></div>`;
  }

  return `<article class="message assistant"><div class="message-avatar">N</div><div><div class="message-meta">Nour AI</div><div class="bubble">${formatText(message.text || "")}${result}</div></div></article>`;
}

function renderMessages() {
  const chat = currentChat();
  if (!chat || chat.messages.length === 0) {
    els.messages.innerHTML = welcomeHtml();
    bindSuggestions();
    return;
  }

  els.messages.innerHTML = chat.messages.map(messageHtml).join("");

  chat.messages.forEach(message => {
    if (message.type === "website" && message.html) {
      const iframe = $(`iframe[data-website-id="${CSS.escape(encodeURIComponent(message.id))}"]`, els.messages);
      if (iframe) iframe.srcdoc = message.html;
    }
  });

  $$(".edit-site", els.messages).forEach(button => {
    button.onclick = () => {
      const message = chat.messages.find(item => item.id === button.dataset.messageId);
      if (message?.html) openEditor(message.html, message.id);
    };
  });
  $$(".download-site", els.messages).forEach(button => {
    button.onclick = () => {
      const message = chat.messages.find(item => item.id === button.dataset.messageId);
      if (message?.html) downloadText("nour-ai-website.html", message.html, "text/html");
    };
  });
}

function renderHistory() {
  if (!state.chats.length) {
    els.history.innerHTML = `<div class="sidebar-label">Noch kein Verlauf</div>`;
    return;
  }
  els.history.innerHTML = state.chats.map(chat => `
    <button class="history-item ${chat.id === state.currentId ? "active" : ""}" data-chat-id="${chat.id}" title="${escapeHtml(chat.title)}">${escapeHtml(chat.title)}</button>
  `).join("");
  $$(".history-item", els.history).forEach(button => button.onclick = () => openChat(button.dataset.chatId));
}

function renderAll() {
  renderHistory();
  renderMessages();
}

function bindSuggestions() {
  $$(".suggestion", els.messages).forEach(button => {
    button.onclick = () => {
      const mode = button.dataset.modeSuggest;
      if (mode) setMode(mode);
      els.prompt.value = button.dataset.suggest || "";
      autoSize();
      els.prompt.focus();
    };
  });
}

function setMode(mode) {
  state.mode = mode;
  $$(".mode").forEach(button => button.classList.toggle("active", button.dataset.mode === mode));
  $$(".option-group").forEach(group => group.classList.add("hidden"));
  $(`.${mode}-options`)?.classList.remove("hidden");

  const labels = {
    chat: ["Chat", "Nachricht an Nour AI …"],
    image: ["Bild erstellen", "Beschreibe genau, welches Bild du möchtest …"],
    video: ["Video erstellen", "Beschreibe Szene, Kamerabewegung und Ton …"],
    website: ["Website erstellen", "Beschreibe deine Website, Farben und Inhalte …"]
  };
  els.topSubtitle.textContent = labels[mode][0];
  els.prompt.placeholder = labels[mode][1];
  els.prompt.focus();
}

function setConnection(text, kind = "ready") {
  els.connection.classList.remove("working", "error");
  if (kind !== "ready") els.connection.classList.add(kind);
  els.connection.innerHTML = `<i></i> ${escapeHtml(text)}`;
}

function setBusy(value) {
  state.busy = value;
  els.send.disabled = value;
  setConnection(value ? "Nour AI arbeitet" : "Bereit", value ? "working" : "ready");
}

function typingMessage() {
  const id = makeId();
  const chat = currentChat();
  chat.messages.push({ id, role: "assistant", type: "typing", text: "", createdAt: Date.now() });
  renderMessages();
  const bubble = $(`.message:last-child .bubble`, els.messages);
  if (bubble) bubble.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;
  scrollBottom();
  return id;
}

function removeMessage(id) {
  const chat = currentChat();
  if (!chat) return;
  chat.messages = chat.messages.filter(message => message.id !== id);
  renderMessages();
}

async function api(path, options = {}) {
  const response = await fetch(path, options);
  let data;
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) {
    const error = new Error(data.error || `Fehler ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function maybeSetup(error) {
  const message = String(error?.message || "");
  if (/GEMINI_API_KEY|Gemini-Schlüssel|API.?Schlüssel fehlt/i.test(message)) {
    if (!els.setup.open) els.setup.showModal();
  }
}

async function sendChat(prompt) {
  const chat = currentChat();
  const typingId = typingMessage();
  try {
    const data = await api("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, previousInteractionId: chat.previousInteractionId })
    });
    removeMessage(typingId);
    chat.previousInteractionId = data.interactionId || chat.previousInteractionId;
    addMessage({ role: "assistant", text: data.text, type: "text" });
  } catch (error) {
    removeMessage(typingId);
    maybeSetup(error);
    addMessage({ role: "assistant", text: `Fehler: ${error.message}`, type: "text" });
  }
}

async function sendImage(prompt) {
  const typingId = typingMessage();
  try {
    const data = await api("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        aspectRatio: $("#imageRatio").value,
        imageSize: $("#imageSize").value,
        inputImage: state.inputImage
      })
    });
    removeMessage(typingId);
    addMessage({ role: "assistant", text: data.text || "Das Bild ist fertig.", type: "image", src: data.image });
    clearInputImage();
  } catch (error) {
    removeMessage(typingId);
    maybeSetup(error);
    addMessage({ role: "assistant", text: `Bild konnte nicht erstellt werden: ${error.message}`, type: "text" });
  }
}

async function sendWebsite(prompt) {
  const typingId = typingMessage();
  try {
    const data = await api("/api/website", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    removeMessage(typingId);
    addMessage({ role: "assistant", text: "Die Website ist fertig. Du kannst sie jetzt öffnen, anklicken und bearbeiten.", type: "website", html: data.html });
  } catch (error) {
    removeMessage(typingId);
    maybeSetup(error);
    addMessage({ role: "assistant", text: `Website konnte nicht erstellt werden: ${error.message}`, type: "text" });
  }
}

async function sendVideo(prompt) {
  let progressMessage;
  try {
    const data = await api("/api/video-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, aspectRatio: $("#videoRatio").value })
    });
    progressMessage = addMessage({ role: "assistant", text: "", type: "video-progress", operation: data.operation, status: "Veo rendert dein 8-Sekunden-Video …" });
    await pollVideo(progressMessage.id, data.operation);
  } catch (error) {
    maybeSetup(error);
    if (progressMessage) updateMessage(progressMessage.id, { type: "text", text: `Video konnte nicht erstellt werden: ${error.message}` });
    else addMessage({ role: "assistant", text: `Video konnte nicht gestartet werden: ${error.message}`, type: "text" });
  }
}

async function pollVideo(messageId, operation) {
  const start = Date.now();
  let checks = 0;
  while (Date.now() - start < 7 * 60 * 1000) {
    await wait(checks === 0 ? 4000 : 10000);
    checks += 1;
    const data = await api(`/api/video-status?operation=${encodeURIComponent(operation)}`);
    if (data.done) {
      updateMessage(messageId, {
        type: "video",
        text: "Dein Video ist fertig.",
        src: data.downloadUrl,
        status: undefined
      });
      return;
    }
    const elapsed = Math.round((Date.now() - start) / 1000);
    updateMessage(messageId, { status: `Seit ${elapsed} Sekunden in Bearbeitung …` });
  }
  throw new Error("Das Video dauert ungewöhnlich lange. Versuche es später erneut.");
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

els.composer.addEventListener("submit", async event => {
  event.preventDefault();
  if (state.busy) return;
  const prompt = els.prompt.value.trim();
  if (!prompt) return;

  addMessage({ role: "user", text: prompt, type: "text" });
  els.prompt.value = "";
  autoSize();
  setBusy(true);

  try {
    if (state.mode === "chat") await sendChat(prompt);
    if (state.mode === "image") await sendImage(prompt);
    if (state.mode === "website") await sendWebsite(prompt);
    if (state.mode === "video") await sendVideo(prompt);
  } finally {
    setBusy(false);
    els.prompt.focus();
  }
});

els.prompt.addEventListener("input", autoSize);
els.prompt.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    els.composer.requestSubmit();
  }
});

function autoSize() {
  els.prompt.style.height = "auto";
  els.prompt.style.height = `${Math.min(els.prompt.scrollHeight, 180)}px`;
}

function scrollBottom() {
  requestAnimationFrame(() => els.messages.scrollTo({ top: els.messages.scrollHeight, behavior: "smooth" }));
}

function openSidebar() {
  els.sidebar.classList.add("open");
  els.shade.classList.add("show");
}
function closeSidebar() {
  els.sidebar.classList.remove("open");
  els.shade.classList.remove("show");
}

function clearInputImage() {
  state.inputImage = null;
  $("#imageFile").value = "";
  $("#fileChip").classList.add("hidden");
  $("#fileChip").textContent = "";
}

$("#imageFile").addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 6 * 1024 * 1024) {
    alert("Das Bild darf höchstens 6 MB groß sein.");
    clearInputImage();
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    state.inputImage = reader.result;
    $("#fileChip").textContent = `✓ ${file.name}`;
    $("#fileChip").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

function openEditor(html, messageId) {
  state.editorHtml = html;
  els.editor.dataset.messageId = messageId || "";
  els.editorFrame.srcdoc = html;
  els.editor.showModal();
  els.editorFrame.onload = () => {
    const doc = els.editorFrame.contentDocument;
    if (!doc?.body) return;
    doc.body.contentEditable = "true";
    doc.designMode = "on";
    doc.body.style.minHeight = "100vh";
    doc.addEventListener("input", captureEditorHtml);
  };
}

function captureEditorHtml() {
  const doc = els.editorFrame.contentDocument;
  if (!doc?.documentElement) return state.editorHtml;
  state.editorHtml = "<!doctype html>\n" + doc.documentElement.outerHTML;
  const messageId = els.editor.dataset.messageId;
  if (messageId) {
    const chat = currentChat();
    const message = chat?.messages.find(item => item.id === messageId);
    if (message) {
      message.html = state.editorHtml;
      saveChats();
    }
  }
  return state.editorHtml;
}

function editorDocument() {
  return els.editorFrame.contentDocument;
}

function appendToEditor(html) {
  const doc = editorDocument();
  if (!doc?.body) return;
  doc.body.insertAdjacentHTML("beforeend", html);
  captureEditorHtml();
}

function downloadText(filename, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$$('[data-command]').forEach(button => button.onclick = () => editorDocument()?.execCommand(button.dataset.command));
$$('[data-block]').forEach(button => button.onclick = () => editorDocument()?.execCommand("formatBlock", false, button.dataset.block));
$("#addText").onclick = () => appendToEditor('<p style="max-width:900px;margin:24px auto;padding:0 20px;font:18px/1.7 Arial,sans-serif">Diesen Text anklicken und bearbeiten.</p>');
$("#addButton").onclick = () => appendToEditor('<div style="text-align:center;margin:24px"><a href="#" style="display:inline-block;padding:14px 22px;border-radius:10px;background:#6d5dfc;color:white;text-decoration:none;font:bold 16px Arial">Button bearbeiten</a></div>');
$("#addImage").onclick = () => {
  const url = prompt("Füge die Adresse eines Bildes ein:");
  if (url) appendToEditor(`<div style="text-align:center;margin:24px"><img src="${escapeHtml(url)}" alt="Bild" style="max-width:90%;height:auto;border-radius:16px"></div>`);
};
$("#pageColor").oninput = event => {
  const doc = editorDocument();
  if (doc?.body) {
    doc.body.style.background = event.target.value;
    captureEditorHtml();
  }
};
$("#previewDesktop").onclick = () => els.editorStage.classList.remove("mobile");
$("#previewMobile").onclick = () => els.editorStage.classList.add("mobile");
$("#downloadWebsite").onclick = () => downloadText("nour-ai-website.html", captureEditorHtml(), "text/html");
$("#closeEditor").onclick = () => {
  captureEditorHtml();
  els.editor.close();
  renderMessages();
};

$("#newChatBtn").onclick = createChat;
$("#clearChatsBtn").onclick = deleteAllChats;
$("#menuBtn").onclick = openSidebar;
$("#sidebarClose").onclick = closeSidebar;
els.shade.onclick = closeSidebar;
$("#attachImageBtn").onclick = () => $("#imageFile").click();
$("#setupClose").onclick = () => els.setup.close();
$("#setupOkay").onclick = () => els.setup.close();
$$('.mode').forEach(button => button.onclick = () => setMode(button.dataset.mode));

if (!state.chats.length) createChat();
else {
  state.currentId = state.chats[0].id;
  renderAll();
}
setMode("chat");
autoSize();
