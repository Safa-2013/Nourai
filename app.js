const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const STORAGE_KEY = "nour-ai-chats-v2";
const AUTH_KEY = "nour-ai-local-accounts-v1";
const SESSION_KEY = "nour-ai-local-session-v1";
const BRAND_KEY = "nour-ai-brand-v1";
const DEFAULT_ADMIN_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";

const state = {
  mode: "chat",
  chats: loadChats(),
  currentId: null,
  busy: false,
  inputImage: null,
  editorHtml: "",
  accounts: loadAccounts(),
  sessionUserId: localStorage.getItem(SESSION_KEY) || null,
  brand: loadBrand()
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
  editorStage: $("#editorStage"),
  accountDialog: $("#accountDialog"),
  adminDialog: $("#adminDialog")
};


function loadAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem(AUTH_KEY) || "[]");
    if (Array.isArray(accounts) && accounts.length) return accounts;
  } catch {}
  const defaults = [{ id: "admin-local", username: "admin", name: "Administrator", role: "admin", passwordHash: DEFAULT_ADMIN_HASH, createdAt: Date.now() }];
  localStorage.setItem(AUTH_KEY, JSON.stringify(defaults));
  return defaults;
}
function saveAccounts() { localStorage.setItem(AUTH_KEY, JSON.stringify(state.accounts)); }
function loadBrand() {
  try {
    return { name:"Nour AI", subtitle:"Creative Intelligence", letter:"N", accent:"#7c6cff", autoTool:true, ...JSON.parse(localStorage.getItem(BRAND_KEY)||"{}") };
  } catch {
    return { name:"Nour AI", subtitle:"Creative Intelligence", letter:"N", accent:"#7c6cff", autoTool:true };
  }
}
function saveBrand() { localStorage.setItem(BRAND_KEY, JSON.stringify(state.brand)); }
async function hashPassword(value) {
  const data = new TextEncoder().encode(String(value));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2,"0")).join("");
}
function currentUser() { return state.accounts.find(account => account.id === state.sessionUserId) || null; }
function ownerKey() { return currentUser()?.id || "guest"; }
function isAdmin() { return currentUser()?.role === "admin"; }
function canAccessChat(chat) { return isAdmin() || (chat.owner || "guest") === ownerKey(); }
function canEditChat(chat) { return canAccessChat(chat); }
function roleLabel(role) { return ({admin:"Admin",employee:"Mitarbeiter",user:"Benutzer"})[role] || role; }
function accountById(id) { return state.accounts.find(account => account.id === id); }

function applyBrand() {
  document.documentElement.style.setProperty("--accent", state.brand.accent || "#7c6cff");
  document.title = state.brand.name || "Nour AI";
  $$(".brand-copy strong").forEach(el => el.textContent = state.brand.name);
  $$(".brand-copy span").forEach(el => el.textContent = state.brand.subtitle);
  $$(".brand-mark,.welcome-logo,.message-avatar").forEach(el => el.textContent = state.brand.letter || "N");
  $("#topTitle").textContent = state.brand.name;
  $("#brandNameInput").value = state.brand.name;
  $("#brandSubtitleInput").value = state.brand.subtitle;
  $("#brandLetterInput").value = state.brand.letter;
  $("#brandAccentInput").value = state.brand.accent;
  $("#autoToolInput").checked = state.brand.autoTool !== false;
}
function renderAccount() {
  const user = currentUser();
  $("#guestAccountView").classList.toggle("hidden", !!user);
  $("#signedInAccountView").classList.toggle("hidden", !user);
  $("#openAdminBtn").classList.toggle("hidden", !isAdmin());
  $("#accountBtn").textContent = user ? (user.name || user.username).slice(0,1).toUpperCase() : "G";
  $("#sidebarAccountText").textContent = user ? `${user.name || user.username} · ${roleLabel(user.role)}` : "Gastmodus · Gemini verbunden";
  if (user) {
    $("#profileAvatar").textContent = (user.name || user.username).slice(0,1).toUpperCase();
    $("#profileName").textContent = user.name || user.username;
    $("#profileRole").textContent = `${roleLabel(user.role)} · @${user.username}`;
  }
}
function showError(id, message="") {
  const el=$(id);
  el.textContent=message;
  el.classList.toggle("hidden", !message);
}
function renderAdminUsers() {
  const list=$("#adminUserList");
  list.innerHTML = state.accounts.map(account => {
    const own = account.id === currentUser()?.id;
    return `<div class="user-row" data-user-id="${escapeHtml(account.id)}"><div><strong>${escapeHtml(account.name || account.username)}</strong><small>@${escapeHtml(account.username)}${own?" · Du":""}</small></div><select class="admin-role" ${own?"disabled":""}><option value="user" ${account.role==="user"?"selected":""}>Benutzer</option><option value="employee" ${account.role==="employee"?"selected":""}>Mitarbeiter</option><option value="admin" ${account.role==="admin"?"selected":""}>Admin</option></select><button class="admin-delete" ${own?"disabled":""}>Löschen</button></div>`;
  }).join("");
  $$(".admin-role",list).forEach(select => select.onchange = () => {
    const row=select.closest(".user-row");
    const account=accountById(row.dataset.userId);
    if(!account||account.id===currentUser()?.id)return;
    account.role=select.value;
    saveAccounts();
    renderAdminUsers();
  });
  $$(".admin-delete",list).forEach(button => button.onclick = () => {
    const id=button.closest(".user-row").dataset.userId;
    if(id===currentUser()?.id)return;
    if(!confirm("Dieses lokale Konto löschen?"))return;
    state.accounts=state.accounts.filter(account=>account.id!==id);
    saveAccounts();
    renderAdminUsers();
  });
}
function resetViewForIdentity() {
  const available=state.chats.filter(canAccessChat);
  state.currentId=available[0]?.id || null;
  if(!state.currentId) createChat(); else renderAll();
  renderAccount();
}
function detectRequestedMode(prompt) {
  if (state.brand.autoTool === false) return "chat";
  const p=String(prompt).toLowerCase();
  const wants=/(^|\s)(erstelle|erstell|mach|mache|generiere|zeichne|entwirf|baue|produziere|designe|ich möchte|ich will|bitte)(\s|$)/i.test(p);
  if(!wants) return "chat";
  if(/\b(video|film|clip|reel|animation)\b/i.test(p)) return "video";
  if(/\b(website|webseite|homepage|landingpage|webshop|shopseite)\b/i.test(p)) return "website";
  if(/\b(bild|foto|logo|poster|grafik|sticker|illustration|werbung|instagram[- ]?post)\b/i.test(p)) return "image";
  return "chat";
}

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
      if ((copy.type === "image" && copy.src?.startsWith("data:")) || (copy.type === "video" && copy.src?.startsWith("blob:"))) {
        delete copy.src;
        copy.text = copy.text || (copy.type === "video" ? "Video wurde erstellt. Nach einem Neuladen muss es neu gerendert werden." : "Bild wurde erstellt. Das Bild wird aus Platzgründen nicht im Browser-Verlauf gespeichert.");
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
  const chat = state.chats.find(chat => chat.id === state.currentId) || null;
  return chat && canAccessChat(chat) ? chat : null;
}

function createChat() {
  const chat = {
    id: makeId(),
    title: "Neuer Chat",
    createdAt: Date.now(),
    previousInteractionId: null,
    owner: ownerKey(),
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
  if (!state.chats.some(chat => chat.id === id && canAccessChat(chat))) return;
  state.currentId = id;
  renderAll();
  closeSidebar();
}

function deleteAllChats() {
  if (!confirm("Möchtest du den gesamten lokalen Verlauf löschen?")) return;
  state.chats = state.chats.filter(chat => !canAccessChat(chat));
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
      <div class="welcome-logo">${escapeHtml(state.brand.letter || "N")}</div>
      <h1>Was möchtest du heute machen?</h1>
      <p>Unterhalte dich mit Nour AI, erstelle kostenlose KI-Vektorgrafiken, Motion-Graphic-Videos oder komplette Websites.</p>
      <div class="suggestions">
        <button class="suggestion" data-suggest="Erkläre mir einfach, wie künstliche Intelligenz funktioniert."><b>Etwas erklären</b><span>Fragen stellen und verständliche Antworten erhalten</span></button>
        <button class="suggestion" data-mode-suggest="image" data-suggest="Erstelle ein hochwertiges futuristisches Logo für Nour AI auf dunklem Hintergrund."><b>Ein Bild erstellen</b><span>Kostenlose KI-Vektorgrafiken, Logos, Poster und Illustrationen</span></button>
        <button class="suggestion" data-mode-suggest="video" data-suggest="Ein cineastisches Video einer leuchtenden futuristischen Stadt bei Nacht, Kameraflug zwischen den Gebäuden, passende Geräusche."><b>Ein Video erstellen</b><span>8 Sekunden Motion Graphics – lokal und kostenlos gerendert</span></button>
        <button class="suggestion" data-mode-suggest="website" data-suggest="Eine moderne Website für ein kreatives KI-Studio namens Nour AI, dunkles Premium-Design, Leistungen, Beispiele und Kontaktbereich."><b>Eine Website bauen</b><span>Danach direkt visuell bearbeiten</span></button>
      </div>
    </div>`;
}

function messageHtml(message) {
  const editable = canEditChat(currentChat());
  if (message.role === "user") {
    return `<article class="message user"><div class="bubble">${formatText(message.text)}</div></article>`;
  }

  let result = "";
  if (message.type === "image" && message.src) {
    result = `<div class="result-card"><img src="${message.src}" alt="Von Nour AI erzeugtes Bild"><div class="card-actions">${editable ? `<button class="primary edit-image" data-message-id="${message.id}">Bild bearbeiten</button>` : ""}<a href="${message.src}" download="nour-ai-bild.svg">SVG herunterladen</a></div></div>`;
  }
  if (message.type === "website" && message.html) {
    const encoded = encodeURIComponent(message.id);
    result = `<div class="result-card"><iframe title="Website-Vorschau" sandbox="allow-same-origin" data-website-id="${encoded}"></iframe><div class="card-actions">${editable ? `<button class="primary edit-site" data-message-id="${message.id}">Website bearbeiten</button>` : ""}<button class="download-site" data-message-id="${message.id}">HTML herunterladen</button></div></div>`;
  }
  if (message.type === "video-progress") {
    result = `<div class="result-card progress-card"><div class="progress-head"><b>Video wird erstellt</b><span>${escapeHtml(message.status || "Das kann einige Minuten dauern …")}</span></div><div class="progress-track"><div class="progress-bar"></div></div></div>`;
  }
  if (message.type === "video" && message.src) {
    result = `<div class="result-card"><video src="${escapeHtml(message.src)}" controls playsinline></video><div class="card-actions">${editable ? `<button class="primary edit-video" data-message-id="${message.id}">Video bearbeiten</button>` : ""}<a href="${escapeHtml(message.src)}" download="nour-ai-video.webm">Video herunterladen</a><span class="paid-note">Lokal im Browser gerendert – keine Videokosten.</span></div></div>`;
  }

  return `<article class="message assistant"><div class="message-avatar">${escapeHtml(state.brand.letter || "N")}</div><div><div class="message-meta">${escapeHtml(state.brand.name || "Nour AI")}</div><div class="bubble">${formatText(message.text || "")}${result}</div></div></article>`;
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
  $$(".edit-image", els.messages).forEach(button => button.onclick = () => { const m=chat.messages.find(x=>x.id===button.dataset.messageId); if(m?.src) openImageEditor(m.src); });
  $$(".edit-video", els.messages).forEach(button => button.onclick = () => { const m=chat.messages.find(x=>x.id===button.dataset.messageId); if(m?.src) openVideoEditor(m.src); });
}

function renderHistory() {
  if (!state.chats.length) {
    els.history.innerHTML = `<div class="sidebar-label">Noch kein Verlauf</div>`;
    return;
  }
  const visibleChats = state.chats.filter(canAccessChat);
  els.history.innerHTML = visibleChats.map(chat => {
    const owner = accountById(chat.owner);
    const ownerTag = isAdmin() && owner ? `<span class="owner-chip">${escapeHtml(owner.username)}</span>` : "";
    return `<button class="history-item ${chat.id === state.currentId ? "active" : ""}" data-chat-id="${chat.id}" title="${escapeHtml(chat.title)}">${escapeHtml(chat.title)}${ownerTag}</button>`;
  }).join("");
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
    video: ["Kostenloses Video", "Beschreibe Text, Stil und Stimmung des Motion-Graphic-Videos …"],
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
  const contentType = response.headers.get("content-type") || "";
  let data = {};
  if (contentType.includes("application/json")) { try { data = await response.json(); } catch {} }
  if (!response.ok || !contentType.includes("application/json")) {
    let message = data.error || `Fehler ${response.status}`;
    if (location.hostname.endsWith("github.io")) message = "Du hast noch die GitHub-Pages-Adresse geöffnet. Öffne die Adresse, die auf .vercel.app endet.";
    else if ([404,405].includes(response.status)) message = "Die Vercel-API fehlt noch. Lade den kompletten Ordner api und den Ordner lib hoch und starte in Vercel Redeploy.";
    const error = new Error(message); error.status=response.status; throw error;
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
    addMessage({ role: "assistant", text: data.text || "Die kostenlose KI-Vektorgrafik ist fertig.", type: "image", src: data.image });
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

function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight){const words=String(text||"").split(/\s+/),lines=[];let line="";for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}if(line)lines.push(line);const startY=y-((lines.length-1)*lineHeight)/2;lines.slice(0,4).forEach((value,index)=>{ctx.strokeText(value,x,startY+index*lineHeight,maxWidth);ctx.fillText(value,x,startY+index*lineHeight,maxWidth);});}
async function renderFreeVideo(storyboard,aspectRatio="16:9"){
  if(!window.MediaRecorder)throw new Error("Dein Browser unterstützt den kostenlosen Videoexport leider nicht.");
  const canvas=document.createElement("canvas"),sizes={"16:9":[854,480],"9:16":[480,854],"1:1":[640,640]};
  [canvas.width,canvas.height]=sizes[aspectRatio]||sizes["16:9"];
  const ctx=canvas.getContext("2d"),stream=canvas.captureStream(24);
  let audioContext=null,oscillator=null;

  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(AC){
      audioContext=new AC();
      await Promise.race([audioContext.resume(),new Promise(resolve=>setTimeout(resolve,1500))]);
      const destination=audioContext.createMediaStreamDestination(),gain=audioContext.createGain();
      oscillator=audioContext.createOscillator();
      gain.gain.value=.025;
      oscillator.type=storyboard.musicMood==="dramatisch"?"sawtooth":storyboard.musicMood==="ruhig"?"sine":"triangle";
      oscillator.frequency.value=storyboard.musicMood==="ruhig"?174:220;
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      destination.stream.getAudioTracks().forEach(track=>stream.addTrack(track));
    }
  }catch{}

  const mimeTypes=["video/webm;codecs=vp8,opus","video/webm;codecs=vp9,opus","video/webm"];
  const mimeType=mimeTypes.find(type=>MediaRecorder.isTypeSupported(type))||"";
  let recorder;
  try{
    recorder=new MediaRecorder(stream,mimeType?{mimeType,videoBitsPerSecond:2500000}:undefined);
  }catch{
    recorder=new MediaRecorder(stream);
  }

  const chunks=[];
  recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  const stopped=new Promise(resolve=>{
    recorder.onstop=resolve;
    recorder.onerror=resolve;
  });

  const scenes=storyboard.scenes?.length?storyboard.scenes:[{text:storyboard.title,emoji:"✨",color1:"#6d5dfc",color2:"#16112f"}];
  const duration=6,started=performance.now();
  recorder.start(250);

  await Promise.race([
    new Promise(resolve=>{
      let finished=false;
      const emergency=setTimeout(()=>{if(!finished){finished=true;resolve()}},10000);
      function frame(now){
        if(finished)return;
        const elapsed=Math.min(duration,(now-started)/1000),sceneLength=duration/scenes.length;
        const sceneIndex=Math.min(scenes.length-1,Math.floor(elapsed/sceneLength));
        const scene=scenes[sceneIndex],local=(elapsed-sceneIndex*sceneLength)/sceneLength;
        const ease=1-Math.pow(1-Math.min(1,local*2.2),3);
        const gradient=ctx.createLinearGradient(0,0,canvas.width,canvas.height);
        gradient.addColorStop(0,scene.color1||"#6d5dfc");
        gradient.addColorStop(1,scene.color2||"#111827");
        ctx.fillStyle=gradient;ctx.fillRect(0,0,canvas.width,canvas.height);

        ctx.save();
        for(let i=0;i<8;i++){
          const angle=i*.8+elapsed*.2,radius=canvas.width*(.11+(i%4)*.06);
          const x=canvas.width/2+Math.cos(angle)*radius,y=canvas.height/2+Math.sin(angle*1.2)*radius*.6;
          ctx.globalAlpha=.07+(i%3)*.02;ctx.fillStyle="#fff";ctx.beginPath();
          ctx.arc(x,y,canvas.width*(.035+(i%3)*.012),0,Math.PI*2);ctx.fill();
        }
        ctx.restore();

        ctx.save();ctx.translate(canvas.width/2,canvas.height/2);
        const scale=.84+ease*.16;ctx.scale(scale,scale);
        ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.globalAlpha=Math.min(1,local*4,(1-local)*5);
        ctx.font=`800 ${Math.round(canvas.width*.074)}px Arial`;
        ctx.lineWidth=Math.max(4,canvas.width*.008);
        ctx.strokeStyle="rgba(0,0,0,.45)";ctx.fillStyle="#fff";
        wrapCanvasText(ctx,scene.text,0,canvas.height*.04,canvas.width*.78,canvas.width*.09);
        ctx.font=`${Math.round(canvas.width*.11)}px Arial`;
        ctx.fillText(scene.emoji||"✨",0,-canvas.height*.18);
        ctx.restore();

        ctx.globalAlpha=.8;ctx.textAlign="center";ctx.fillStyle="#fff";
        ctx.font=`600 ${Math.round(canvas.width*.019)}px Arial`;
        ctx.fillText(storyboard.subtitle||storyboard.title||"Nour AI",canvas.width/2,canvas.height*.90,canvas.width*.8);
        ctx.globalAlpha=1;
        ctx.fillStyle="rgba(255,255,255,.25)";
        ctx.fillRect(canvas.width*.08,canvas.height*.955,canvas.width*.84,Math.max(3,canvas.height*.006));
        ctx.fillStyle="#fff";
        ctx.fillRect(canvas.width*.08,canvas.height*.955,canvas.width*.84*(elapsed/duration),Math.max(3,canvas.height*.006));

        if(elapsed<duration)requestAnimationFrame(frame);
        else{finished=true;clearTimeout(emergency);resolve()}
      }
      requestAnimationFrame(frame);
    }),
    new Promise(resolve=>setTimeout(resolve,12000))
  ]);

  try{recorder.requestData()}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
  try{if(recorder.state!=="inactive")recorder.stop()}catch{}
  await Promise.race([stopped,new Promise(resolve=>setTimeout(resolve,3000))]);

  try{oscillator?.stop()}catch{}
  try{await audioContext?.close()}catch{}

  const blob=new Blob(chunks,{type:mimeType||"video/webm"});
  if(!blob.size)throw new Error("Der Browser konnte das Video nicht exportieren. Bitte Google Chrome benutzen.");
  return URL.createObjectURL(blob);
}
async function sendVideo(prompt){let progressMessage;try{const data=await api("/api/video-start",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,aspectRatio:$("#videoRatio").value})});progressMessage=addMessage({role:"assistant",text:"",type:"video-progress",status:"KI erstellt Storyboard und dein Browser rendert das Video kostenlos …"});const src=await Promise.race([renderFreeVideo(data.storyboard,data.aspectRatio||$("#videoRatio").value),new Promise((_,reject)=>setTimeout(()=>reject(new Error("Zeitlimit erreicht. Bitte erneut versuchen oder Google Chrome benutzen.")),25000))]);updateMessage(progressMessage.id,{type:"video",text:"Dein kostenloses KI-Motion-Graphic-Video ist fertig und kann im CapCut-ähnlichen Editor bearbeitet werden.",src,status:undefined});}catch(error){maybeSetup(error);if(progressMessage)updateMessage(progressMessage.id,{type:"text",text:`Video konnte nicht erstellt werden: ${error.message}`});else addMessage({role:"assistant",text:`Video konnte nicht gestartet werden: ${error.message}`,type:"text"});}}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

els.composer.addEventListener("submit", async event => {
  event.preventDefault();
  if (state.busy) return;
  const prompt = els.prompt.value.trim();
  if (!prompt) return;

  const autoSwitched = state.mode === "chat" && detectRequestedMode(prompt) !== "chat";
  const detectedMode = state.mode === "chat" ? detectRequestedMode(prompt) : state.mode;
  if (autoSwitched) setMode(detectedMode);
  addMessage({ role: "user", text: prompt, type: "text" });
  els.prompt.value = "";
  autoSize();
  setBusy(true);

  try {
    if (detectedMode === "chat") await sendChat(prompt);
    if (detectedMode === "image") await sendImage(prompt);
    if (detectedMode === "website") await sendWebsite(prompt);
    if (detectedMode === "video") await sendVideo(prompt);
  } finally {
    setBusy(false);
    if (autoSwitched) setMode("chat");
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


$("#accountBtn").onclick = () => { renderAccount(); showError("#loginError"); els.accountDialog.showModal(); };
$("#accountClose").onclick = () => els.accountDialog.close();
$("#loginPassword").onkeydown = event => { if(event.key === "Enter") $("#loginSubmit").click(); };

$("#loginSubmit").onclick = async () => {
  const username=$("#loginUsername").value.trim().toLowerCase();
  const password=$("#loginPassword").value;
  const hash=await hashPassword(password);
  const account=state.accounts.find(item=>item.username.toLowerCase()===username && item.passwordHash===hash);
  if(!account){ showError("#loginError","Benutzername oder Passwort ist falsch."); return; }
  state.sessionUserId=account.id;
  localStorage.setItem(SESSION_KEY,account.id);
  $("#loginPassword").value="";
  showError("#loginError");
  els.accountDialog.close();
  resetViewForIdentity();
};

$("#registerSubmit").onclick = async () => {
  const username=$("#loginUsername").value.trim().toLowerCase();
  const password=$("#loginPassword").value;
  if(username.length<3){ showError("#loginError","Der Benutzername braucht mindestens 3 Zeichen."); return; }
  if(password.length<4){ showError("#loginError","Das Passwort braucht mindestens 4 Zeichen."); return; }
  if(state.accounts.some(item=>item.username.toLowerCase()===username)){ showError("#loginError","Dieser Benutzername ist bereits vergeben."); return; }
  const account={id:makeId(),username,name:username,role:"user",passwordHash:await hashPassword(password),createdAt:Date.now()};
  state.accounts.push(account); saveAccounts();
  state.sessionUserId=account.id; localStorage.setItem(SESSION_KEY,account.id);
  els.accountDialog.close(); resetViewForIdentity();
};

$("#logoutBtn").onclick = () => {
  state.sessionUserId=null; localStorage.removeItem(SESSION_KEY);
  els.accountDialog.close(); resetViewForIdentity();
};

$("#changePasswordBtn").onclick = async () => {
  const user=currentUser(), password=$("#changePassword").value;
  if(!user || password.length<4){ alert("Das neue Passwort braucht mindestens 4 Zeichen."); return; }
  user.passwordHash=await hashPassword(password); saveAccounts(); $("#changePassword").value=""; alert("Passwort geändert.");
};

$("#openAdminBtn").onclick = () => {
  if(!isAdmin())return;
  els.accountDialog.close(); renderAdminUsers(); applyBrand(); els.adminDialog.showModal();
};
$("#adminClose").onclick = () => els.adminDialog.close();

$("#adminCreateUser").onclick = async () => {
  if(!isAdmin())return;
  const name=$("#adminNewName").value.trim();
  const username=$("#adminNewUsername").value.trim().toLowerCase();
  const password=$("#adminNewPassword").value;
  const role=$("#adminNewRole").value;
  if(username.length<3 || password.length<4){ showError("#adminUserError","Benutzername: mindestens 3 Zeichen. Passwort: mindestens 4 Zeichen."); return; }
  if(state.accounts.some(item=>item.username.toLowerCase()===username)){ showError("#adminUserError","Dieser Benutzername existiert bereits."); return; }
  state.accounts.push({id:makeId(),name:name||username,username,role,passwordHash:await hashPassword(password),createdAt:Date.now()});
  saveAccounts(); showError("#adminUserError");
  $("#adminNewName").value=""; $("#adminNewUsername").value=""; $("#adminNewPassword").value="";
  renderAdminUsers();
};

$("#saveBrandBtn").onclick = () => {
  if(!isAdmin())return;
  state.brand={
    name:$("#brandNameInput").value.trim()||"Nour AI",
    subtitle:$("#brandSubtitleInput").value.trim()||"Creative Intelligence",
    letter:$("#brandLetterInput").value.trim().slice(0,2).toUpperCase()||"N",
    accent:$("#brandAccentInput").value,
    autoTool:$("#autoToolInput").checked
  };
  saveBrand(); applyBrand(); renderMessages(); alert("Ansicht gespeichert.");
};

$("#resetLocalAccountsBtn").onclick = () => {
  if(!isAdmin() || !confirm("Alle lokalen Konten zurücksetzen? Lokale Chats bleiben erhalten."))return;
  state.accounts=[{id:"admin-local",username:"admin",name:"Administrator",role:"admin",passwordHash:DEFAULT_ADMIN_HASH,createdAt:Date.now()}];
  saveAccounts(); state.sessionUserId="admin-local"; localStorage.setItem(SESSION_KEY,"admin-local");
  renderAdminUsers(); renderAccount(); alert("Zurückgesetzt. Admin: admin");
};

if (!state.chats.filter(canAccessChat).length) createChat();
else {
  state.currentId = state.chats.find(canAccessChat)?.id || null;
  renderAll();
}
applyBrand();
renderAccount();
setMode("chat");
autoSize();


// Verbindung prüfen: verhindert den rätselhaften 405-Fehler auf GitHub Pages.
async function checkBackend(){
  try{
    const r=await fetch("/api/health",{cache:"no-store"});
    const ct=r.headers.get("content-type")||"";
    if(!r.ok||!ct.includes("application/json")) throw new Error();
    const d=await r.json();
    if(!d.hasGeminiKey){setConnection("API-Schlüssel fehlt","error"); if(!els.setup.open) els.setup.showModal();}
  }catch{
    setConnection("Falsche Adresse oder API fehlt","error");
    if(location.hostname.endsWith("github.io")) addMessage({role:"assistant",type:"text",text:"Wichtig: Diese echte KI funktioniert nicht über die github.io-Adresse. Öffne dein Nour-AI-Projekt über die Adresse, die auf .vercel.app endet."});
  }
}

const imageEditor={canvas:$("#imageEditCanvas"),ctx:$("#imageEditCanvas").getContext("2d"),image:null,layers:[],selected:-1,drag:null};
function drawImageEditor(){const {canvas,ctx,image,layers}=imageEditor;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#222";ctx.fillRect(0,0,canvas.width,canvas.height);if(image){ctx.save();ctx.filter=`brightness(${$("#imgBrightness").value}%) contrast(${$("#imgContrast").value}%)`;const s=Math.max(canvas.width/image.width,canvas.height/image.height),w=image.width*s,h=image.height*s;ctx.drawImage(image,(canvas.width-w)/2,(canvas.height-h)/2,w,h);ctx.restore();}layers.forEach((l,i)=>{ctx.save();ctx.font=`800 ${l.size}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineWidth=Math.max(3,l.size/14);ctx.strokeStyle="rgba(0,0,0,.65)";ctx.strokeText(l.text,l.x,l.y);ctx.fillStyle=l.color;ctx.fillText(l.text,l.x,l.y);if(i===imageEditor.selected){const m=ctx.measureText(l.text);ctx.strokeStyle="#6d5dfc";ctx.lineWidth=3;ctx.strokeRect(l.x-m.width/2-10,l.y-l.size/2-10,m.width+20,l.size+20);}ctx.restore();});}
function loadEditorImage(src){const img=new Image();img.onload=()=>{imageEditor.image=img;const ratio=img.width/img.height;imageEditor.canvas.width=ratio>=1?1080:Math.round(1080*ratio);imageEditor.canvas.height=ratio>=1?Math.round(1080/ratio):1080;drawImageEditor();};img.src=src;}
function openImageEditor(src){imageEditor.layers=[];imageEditor.selected=-1;loadEditorImage(src);$("#imageEditorDialog").showModal();}
function addImageLayer(text){imageEditor.layers.push({text,color:$("#imgTextColor").value,size:+$("#imgTextSize").value,x:imageEditor.canvas.width/2,y:imageEditor.canvas.height/2});imageEditor.selected=imageEditor.layers.length-1;drawImageEditor();}
$("#addImageText").onclick=()=>addImageLayer($("#imgTextInput").value||"Text");$("#addImageSticker").onclick=()=>addImageLayer("✨");$("#deleteImageLayer").onclick=()=>{if(imageEditor.selected>=0)imageEditor.layers.splice(imageEditor.selected,1);imageEditor.selected=-1;drawImageEditor();};
["#imgBrightness","#imgContrast"].forEach(s=>$(s).oninput=drawImageEditor);$("#imgTextColor").oninput=e=>{const l=imageEditor.layers[imageEditor.selected];if(l){l.color=e.target.value;drawImageEditor();}};$("#imgTextSize").oninput=e=>{const l=imageEditor.layers[imageEditor.selected];if(l){l.size=+e.target.value;drawImageEditor();}};
imageEditor.canvas.onpointerdown=e=>{const r=imageEditor.canvas.getBoundingClientRect(),x=(e.clientX-r.left)*imageEditor.canvas.width/r.width,y=(e.clientY-r.top)*imageEditor.canvas.height/r.height;for(let i=imageEditor.layers.length-1;i>=0;i--){const l=imageEditor.layers[i];imageEditor.ctx.font=`800 ${l.size}px Arial`;const w=imageEditor.ctx.measureText(l.text).width;if(x>l.x-w/2-20&&x<l.x+w/2+20&&y>l.y-l.size/2-20&&y<l.y+l.size/2+20){imageEditor.selected=i;imageEditor.drag={dx:x-l.x,dy:y-l.y};imageEditor.canvas.setPointerCapture(e.pointerId);drawImageEditor();return;}}imageEditor.selected=-1;drawImageEditor();};
imageEditor.canvas.onpointermove=e=>{if(!imageEditor.drag||imageEditor.selected<0)return;const r=imageEditor.canvas.getBoundingClientRect(),x=(e.clientX-r.left)*imageEditor.canvas.width/r.width,y=(e.clientY-r.top)*imageEditor.canvas.height/r.height,l=imageEditor.layers[imageEditor.selected];l.x=x-imageEditor.drag.dx;l.y=y-imageEditor.drag.dy;drawImageEditor();};imageEditor.canvas.onpointerup=()=>imageEditor.drag=null;
$("#downloadEditedImage").onclick=()=>{drawImageEditor();const a=document.createElement("a");a.download="nour-ai-bearbeitet.png";a.href=imageEditor.canvas.toDataURL("image/png");a.click();};$("#closeImageEditor").onclick=()=>$("#imageEditorDialog").close();$("#imageEditorUpload").onchange=e=>{const f=e.target.files?.[0];if(f)loadEditorImage(URL.createObjectURL(f));};

const vp=$("#videoEditorPlayer"),vo=$("#videoOverlayText"),vd=$("#videoEditorDialog");
function applyVideoEditor(){vo.textContent=$("#videoText").value;vo.style.color=$("#videoTextColor").value;vo.style.fontSize=$("#videoTextSize").value+"px";const p=$("#videoTextPosition").value;vo.style.top=p==="top"?"12%":p==="center"?"50%":"auto";vo.style.bottom=p==="bottom"?"12%":"auto";vo.style.transform=p==="center"?"translateY(-50%)":"none";vp.style.filter=`brightness(${$("#videoBrightness").value}%) contrast(${$("#videoContrast").value}%)`;vp.volume=+$("#videoVolume").value/100;vp.playbackRate=+$("#videoSpeed").value;const ratio=$("#videoEditRatio").value;$("#videoPreview").style.aspectRatio=ratio.replace(":"," / ");}
function openVideoEditor(src){vp.src=src;vd.showModal();vp.onloadedmetadata=()=>{const d=vp.duration||8;$("#videoPlayhead").max=d;$("#trimStart").max=d;$("#trimEnd").max=d;$("#trimEnd").value=d.toFixed(2);applyVideoEditor();};}
["#videoText","#videoTextColor","#videoTextSize","#videoTextPosition","#videoBrightness","#videoContrast","#videoVolume","#videoSpeed","#videoEditRatio"].forEach(s=>$(s).oninput=applyVideoEditor);vp.ontimeupdate=()=>$("#videoPlayhead").value=vp.currentTime;$("#videoPlayhead").oninput=e=>vp.currentTime=+e.target.value;$("#closeVideoEditor").onclick=()=>{vp.pause();vd.close();};$("#videoEditorUpload").onchange=e=>{const f=e.target.files?.[0];if(f){vp.src=URL.createObjectURL(f);vp.load();}};
$("#exportEditedVideo").onclick=async()=>{try{const start=Math.max(0,+$("#trimStart").value||0),end=Math.min(vp.duration,+$("#trimEnd").value||vp.duration);if(end<=start)throw Error("Ende muss nach dem Start liegen.");const ratio=$("#videoEditRatio").value,[rw,rh]=ratio.split(":").map(Number),canvas=document.createElement("canvas");canvas.width=rw>=rh?1280:720;canvas.height=rw>=rh?Math.round(canvas.width*rh/rw):Math.round(canvas.width*rh/rw);if(ratio==="9:16"){canvas.width=720;canvas.height=1280}else if(ratio==="1:1"){canvas.width=1080;canvas.height=1080}const ctx=canvas.getContext("2d"),stream=canvas.captureStream(30);let sourceStream=null;try{sourceStream=vp.captureStream?.();sourceStream?.getAudioTracks().forEach(t=>stream.addTrack(t));}catch{}const types=["video/mp4;codecs=h264,aac","video/webm;codecs=vp9,opus","video/webm"];const mime=types.find(MediaRecorder.isTypeSupported)||"";const rec=new MediaRecorder(stream,mime?{mimeType:mime}:undefined),chunks=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);const done=new Promise(resolve=>rec.onstop=resolve);vp.currentTime=start;await new Promise(r=>vp.onseeked=r);rec.start(500);await vp.play();const render=()=>{if(vp.currentTime>=end||vp.ended){vp.pause();rec.stop();return;}ctx.fillStyle="#000";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.filter=`brightness(${$("#videoBrightness").value}%) contrast(${$("#videoContrast").value}%)`;const s=Math.max(canvas.width/vp.videoWidth,canvas.height/vp.videoHeight),w=vp.videoWidth*s,h=vp.videoHeight*s;ctx.drawImage(vp,(canvas.width-w)/2,(canvas.height-h)/2,w,h);ctx.filter="none";const text=$("#videoText").value;if(text){ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`800 ${Math.round(+$("#videoTextSize").value*canvas.width/900)}px Arial`;ctx.lineWidth=8;ctx.strokeStyle="rgba(0,0,0,.7)";ctx.fillStyle=$("#videoTextColor").value;const pos=$("#videoTextPosition").value,y=pos==="top"?canvas.height*.13:pos==="center"?canvas.height*.5:canvas.height*.87;ctx.strokeText(text,canvas.width/2,y,canvas.width*.85);ctx.fillText(text,canvas.width/2,y,canvas.width*.85);}requestAnimationFrame(render);};render();await done;const blob=new Blob(chunks,{type:mime||"video/webm"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=mime.startsWith("video/mp4")?"nour-ai-bearbeitet.mp4":"nour-ai-bearbeitet.webm";a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}catch(e){alert("Export nicht möglich: "+e.message);}};

checkBackend();
