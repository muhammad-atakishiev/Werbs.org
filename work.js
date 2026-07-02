"use strict";

import { getLang, setLang, t, applyTranslations, initLangSwitcher } from "./i18n.js";

// ─────────────────────────────────────────────
//  ЛОАДЕР — показывает экран загрузки
// ─────────────────────────────────────────────
function showLoader() {
    const el = document.getElementById("pageLoader");
    if (el) el.classList.remove("hidden");
}

// Навигация с лоадером
function navigateTo(url, delay = 500) {
    showLoader();
    setTimeout(() => { window.location.href = url; }, delay);
}

// Скрыть лоадер после загрузки страницы
window.addEventListener("load", () => {
    const el = document.getElementById("pageLoader");
    if (el) {
        el.classList.add("fade-out");
        setTimeout(() => el.classList.add("hidden"), 320);
    }
});

// ─────────────────────────────────────────────
//  Импорт Firebase
// ─────────────────────────────────────────────
let db, fbDoc, fbSetDoc, fbGetDoc, fbUpdateDoc,
    fbCollection, fbQuery, fbWhere, fbOrderBy,
    fbOnSnapshot, fbAddDoc, fbServerTimestamp, fbArrayUnion;

async function loadFirebase() {
    const m = await import("./firebase.js");
    db                = m.db;
    fbDoc             = m.doc;
    fbSetDoc          = m.setDoc;
    fbGetDoc          = m.getDoc;
    fbUpdateDoc       = m.updateDoc;
    fbCollection      = m.collection;
    fbQuery           = m.query;
    fbWhere           = m.where;
    fbOrderBy         = m.orderBy;
    fbOnSnapshot      = m.onSnapshot;
    fbAddDoc          = m.addDoc;
    fbServerTimestamp = m.serverTimestamp;
    fbArrayUnion      = m.arrayUnion;
}

// ─────────────────────────────────────────────
//  ГЛОБАЛЬНОЕ СОСТОЯНИЕ
// ─────────────────────────────────────────────
let ME           = null;
let activeChatId = null;
let chatUnsub    = null;
let pendingFiles = [];
let currentTab   = "chats";

// ─────────────────────────────────────────────
//  УТИЛИТЫ
// ─────────────────────────────────────────────
const $ = id => document.getElementById(id);
const escHtml = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const fmtTime = ts => { const d = ts?.toDate ? ts.toDate() : new Date(ts); return d.getHours().toString().padStart(2,"0")+":"+d.getMinutes().toString().padStart(2,"0"); };
const fmtSize = b => !b ? "" : b<1024 ? b+" B" : b<1048576 ? (b/1024).toFixed(1)+" KB" : (b/1048576).toFixed(1)+" MB";
const truncate = (s,n) => s.length>n ? s.slice(0,n)+"…" : s;

function generateId(used=[]) {
    let id;
    do { id = Math.floor(100000000 + Math.random() * 900000000).toString(); } while(used.includes(id));
    return id;
}
function chatKey(a, b) { return [a,b].sort().join("_"); }

// ─────────────────────────────────────────────
//  ИНИЦИАЛИЗАЦИЯ
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {

    // Перевод применяется сразу на любой странице
    applyTranslations();

    // ── INDEX PAGE ──
    const menuBtn = document.querySelector(".menu-btn");
    const menuEl  = $("menu");
    if (menuBtn && menuEl) menuBtn.addEventListener("click", () => menuEl.classList.toggle("open"));

    const langSel = $("language-select");
    if (langSel) initLangSwitcher("language-select");

    // ── REGISTER ──
    const regForm = $("regForm");
    if (regForm) { await loadFirebase(); initRegister(regForm); }

    // ── LOGIN ──
    const loginForm = $("loginForm");
    if (loginForm) { await loadFirebase(); initLogin(loginForm); }

    // ── APP ──
    if (document.body.classList.contains("app-page")) {
        await loadFirebase();
        await initApp();
    }
});

// ─────────────────────────────────────────────
//  РЕГИСТРАЦИЯ
// ─────────────────────────────────────────────
function initRegister(form) {
    const countryKeys = ["Казахстан","Россия","Украина","США","Германия","Франция","Италия","Китай","Япония","Корея","Турция","Канада","Бразилия","Индия","Великобритания","Испания","Польша","Нидерланды","Швеция","Норвегия","Австралия","Мексика"];
    const countryEN   = ["Kazakhstan","Russia","Ukraine","USA","Germany","France","Italy","China","Japan","South Korea","Turkey","Canada","Brazil","India","United Kingdom","Spain","Poland","Netherlands","Sweden","Norway","Australia","Mexico"];
    const sel = $("country");
    if (sel) {
        const lang = getLang();
        const labels = lang === "en" ? countryEN : countryKeys;
        labels.forEach((label, i) => {
            const o = document.createElement("option");
            o.value = countryKeys[i]; // храним канонично на русском (стабильный ключ)
            o.textContent = label;
            sel.appendChild(o);
        });
    }

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const nick    = $("nickname").value.trim();
        const pass    = $("password").value;
        const confirm = $("confirmPassword").value;
        const country = $("country").value;
        const notBot  = $("notBot")?.checked;
        const errEl   = $("error");
        const setErr  = s => { if(errEl) errEl.textContent = s; };

        setErr("");
        if (!nick||!pass||!confirm||!country) return setErr(t("errFillAll"));
        if (nick.length<3)   return setErr(t("errNickLen"));
        if (pass.length<6)   return setErr(t("errPassLen"));
        if (pass!==confirm)  return setErr(t("errPassMismatch"));
        if (!notBot)         return setErr(t("errNotBot"));

        const reserved = ["admin","moderator","werbs","support"];
        if (reserved.includes(nick.toLowerCase())) return setErr(t("errNickReserved"));

        const btn = form.querySelector("button[type=submit]");
        const originalLabel = btn.textContent;
        btn.textContent = t("checking"); btn.disabled = true;
        try {
            const q = fbQuery(fbCollection(db,"users"), fbWhere("nickLower","==",nick.toLowerCase()));
            const snap = await new Promise(resolve => fbOnSnapshot(q, resolve, {once:true}));
            if (!snap.empty) { setErr(t("errNickTaken")); btn.textContent=originalLabel; btn.disabled=false; return; }

            const idSnap = await fbGetDoc(fbDoc(db,"meta","usedIds"));
            const usedIds = idSnap.exists() ? (idSnap.data().ids||[]) : [];
            const newId   = generateId(usedIds);

            // ── Бейдж "Топер" для первых 50 зарегистрированных ──
            const counterSnap = await fbGetDoc(fbDoc(db,"meta","userCounter"));
            const currentCount = counterSnap.exists() ? (counterSnap.data().count||0) : 0;
            const newCount = currentCount + 1;
            const badges = [];
            if (newCount <= 50) badges.push("topper");

            const user = {
                id: newId, nick, nickLower: nick.toLowerCase(), pass, country,
                friends: [], lang: getLang(), badges, regNumber: newCount, createdAt: Date.now()
            };
            await fbSetDoc(fbDoc(db,"users",newId), user);
            await fbSetDoc(fbDoc(db,"meta","usedIds"), { ids: [...usedIds, newId] });
            await fbSetDoc(fbDoc(db,"meta","userCounter"), { count: newCount });

            sessionStorage.setItem("w_me", JSON.stringify(user));
            navigateTo("app.html");
        } catch(err) {
            setErr(t("errGeneric")+err.message);
            btn.textContent=originalLabel; btn.disabled=false;
        }
    });
}

// ─────────────────────────────────────────────
//  ВХОД
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
//  ПРОГРЕССИВНАЯ БЛОКИРОВКА ВХОДА
//  Хранится в Firebase — переживает перезагрузку,
//  выход и повторный вход.
//
//  3 ошибки → 15 сек
//  3 ошибки снова → 1 мин
//  3 ошибки снова → 15 мин
//  3 ошибки снова → 1 день (86400 сек)
// ─────────────────────────────────────────────

const BLOCK_DURATIONS = [15, 60, 900, 86400]; // секунды

let lockoutInterval = null;

async function getLoginLockout(nickLower) {
    try {
        const snap = await fbGetDoc(fbDoc(db, "loginLockouts", nickLower));
        if (!snap.exists()) return { fails: 0, blockedUntil: 0, blockLevel: 0 };
        return snap.data();
    } catch(e) { return { fails: 0, blockedUntil: 0, blockLevel: 0 }; }
}

async function saveLoginLockout(nickLower, state) {
    try { await fbSetDoc(fbDoc(db, "loginLockouts", nickLower), state); } catch(e) {}
}

async function clearLoginLockout(nickLower) {
    try { await fbSetDoc(fbDoc(db, "loginLockouts", nickLower), { fails: 0, blockedUntil: 0, blockLevel: 0 }); } catch(e) {}
}

function fmtLockTime(seconds) {
    if (seconds < 60) return seconds + (getLang()==="en" ? " sec" : " сек");
    if (seconds < 3600) return Math.round(seconds/60) + (getLang()==="en" ? " min" : " мин");
    if (seconds < 86400) return Math.round(seconds/3600) + (getLang()==="en" ? " h" : " ч");
    return getLang()==="en" ? "1 day" : "1 день";
}

function startLockoutCountdown(form, blockedUntil) {
    const errEl = $("error");
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;

    if (lockoutInterval) clearInterval(lockoutInterval);
    lockoutInterval = setInterval(() => {
        const remaining = Math.ceil((blockedUntil - Date.now()) / 1000);
        if (remaining <= 0) {
            clearInterval(lockoutInterval);
            lockoutInterval = null;
            if (errEl) errEl.textContent = "";
            btn.disabled = false;
            return;
        }
        if (errEl) errEl.textContent = t("errLocked", { sec: fmtLockTime(remaining) });
    }, 500);
}

function initLogin(form) {
    const nickInput = $("nickname");

    // При вводе ника — проверяем блокировку сразу
    if (nickInput) {
        nickInput.addEventListener("input", async () => {
            const nick = nickInput.value.trim();
            if (!nick) {
                if (lockoutInterval) { clearInterval(lockoutInterval); lockoutInterval = null; }
                $("error").textContent = "";
                form.querySelector("button[type=submit]").disabled = false;
                return;
            }
            const state = await getLoginLockout(nick.toLowerCase());
            if (state.blockedUntil && Date.now() < state.blockedUntil) {
                startLockoutCountdown(form, state.blockedUntil);
            } else {
                if (lockoutInterval) { clearInterval(lockoutInterval); lockoutInterval = null; }
                $("error").textContent = "";
                form.querySelector("button[type=submit]").disabled = false;
            }
        });

        // При загрузке страницы — если поле уже заполнено (автозаполнение)
        if (nickInput.value.trim()) {
            getLoginLockout(nickInput.value.trim().toLowerCase()).then(state => {
                if (state.blockedUntil && Date.now() < state.blockedUntil) {
                    startLockoutCountdown(form, state.blockedUntil);
                }
            });
        }
    }

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const nick  = $("nickname").value.trim();
        const pass  = $("password").value;
        const errEl = $("error");
        const setErr = s => { if(errEl) errEl.textContent = s; };
        setErr("");
        if (!nick||!pass) return setErr(t("errEnterCreds"));

        // Проверяем блокировку из Firebase
        const state = await getLoginLockout(nick.toLowerCase());
        if (state.blockedUntil && Date.now() < state.blockedUntil) {
            startLockoutCountdown(form, state.blockedUntil);
            return;
        }

        const btn = form.querySelector("button[type=submit]");
        const originalLabel = btn.textContent;
        btn.textContent = t("loggingIn"); btn.disabled = true;

        try {
            const q    = fbQuery(fbCollection(db,"users"), fbWhere("nickLower","==",nick.toLowerCase()), fbWhere("pass","==",pass));
            const snap = await new Promise(resolve => fbOnSnapshot(q, resolve, {once:true}));

            if (snap.empty) {
                const newFails = (state.fails || 0) + 1;

                if (newFails >= 3) {
                    // Блокировка — берём длительность по текущему уровню
                    const level = state.blockLevel || 0;
                    const durationSec = BLOCK_DURATIONS[Math.min(level, BLOCK_DURATIONS.length - 1)];
                    const blockedUntil = Date.now() + durationSec * 1000;
                    const newLevel = Math.min(level + 1, BLOCK_DURATIONS.length - 1);
                    await saveLoginLockout(nick.toLowerCase(), { fails: 0, blockedUntil, blockLevel: newLevel });
                    startLockoutCountdown(form, blockedUntil);
                    setErr(t("errLocked", { sec: fmtLockTime(durationSec) }));
                } else {
                    await saveLoginLockout(nick.toLowerCase(), { ...state, fails: newFails });
                    setErr(t("errWrongCreds") + ` (${newFails}/3)`);
                    btn.textContent = originalLabel; btn.disabled = false;
                }
                return;
            }

            // Успешный вход — сбрасываем блокировку
            await clearLoginLockout(nick.toLowerCase());

            const user = snap.docs[0].data();
            if (user.lang) setLang(user.lang);

            sessionStorage.setItem("w_me", JSON.stringify(user));
            navigateTo("app.html");
        } catch(err) {
            setErr(t("errGeneric")+err.message);
            btn.textContent = originalLabel; btn.disabled = false;
        }
    });
}

// ─────────────────────────────────────────────
//  APP — ИНИЦИАЛИЗАЦИЯ
// ─────────────────────────────────────────────
async function initApp() {
    const stored = sessionStorage.getItem("w_me");
    if (!stored) { navigateTo("login.html"); return; }
    ME = JSON.parse(stored);

    try {
        const snap = await fbGetDoc(fbDoc(db,"users",ME.id));
        if (snap.exists()) { ME = snap.data(); sessionStorage.setItem("w_me", JSON.stringify(ME)); }
    } catch(e) {}

    // Применяем язык пользователя ко всему приложению
    if (ME.lang) { setLang(ME.lang); applyTranslations(); }

    await grantCreatorPerksIfNeeded(); // выдать создателю часы и бейджи, если ещё не выданы

    renderLeft();
    updateSidebarAvatar(); // показать аватарку в сайдбаре сразу при входе
    startTimeTracking();   // запускаем накопление времени на сайте

    fbOnSnapshot(fbDoc(db,"users",ME.id), snap => {
        if (!snap.exists()) return;
        ME = snap.data();
        sessionStorage.setItem("w_me", JSON.stringify(ME));
        renderLeft();
    });
}

// ─────────────────────────────────────────────
//  АВТОВЫДАЧА ПРИВИЛЕГИЙ СОЗДАТЕЛЮ
//  Если ник владельца сайта совпадает — один раз
//  выставляет ему часы и бейджи "topper" + "creator".
// ─────────────────────────────────────────────
const CREATOR_NICK = "Creator"; // ← если сменишь ник, поменяй и здесь
const CREATOR_HOURS = 9205;

async function grantCreatorPerksIfNeeded() {
    if (!ME || ME.nick !== CREATOR_NICK) return;

    const currentBadges = ME.badges || [];
    const hasCreatorBadge = currentBadges.includes("creator");
    const hasTopperBadge  = currentBadges.includes("topper");
    const hasAdminBadge   = currentBadges.includes("admin");
    const hasGearBadge    = currentBadges.includes("gear");
    const currentHours    = Math.floor((ME.timeSeconds||0) / 3600);

    // Если всё уже выдано — ничего не делаем (чтобы не сбрасывать накопленное время повторно)
    if (hasCreatorBadge && hasTopperBadge && hasAdminBadge && hasGearBadge && currentHours >= CREATOR_HOURS) return;

    const newBadges = [...new Set([...currentBadges, "topper", "creator", "admin", "gear"])];
    const newSeconds = Math.max(ME.timeSeconds||0, CREATOR_HOURS * 3600);

    try {
        await fbUpdateDoc(fbDoc(db,"users",ME.id), { badges: newBadges, timeSeconds: newSeconds });
        ME.badges = newBadges;
        ME.timeSeconds = newSeconds;
        sessionStorage.setItem("w_me", JSON.stringify(ME));
    } catch(e) {}
}
// ─────────────────────────────────────────────
//  СИСТЕМА НАКОПЛЕНИЯ ВРЕМЕНИ НА САЙТЕ
//  Время идёт только пока вкладка app.html открыта и активна.
//  Каждые 60 секунд накопленное время сохраняется в Firebase.
// ─────────────────────────────────────────────
let timeTrackInterval = null;
let secondsSinceLastSave = 0;

function startTimeTracking() {
    if (timeTrackInterval) clearInterval(timeTrackInterval);

    timeTrackInterval = setInterval(async () => {
        // Считаем время только если вкладка активна (видима пользователю)
        if (document.visibilityState !== "visible") return;

        secondsSinceLastSave++;

        // Раз в 60 секунд — сохраняем накопленное в Firebase
        if (secondsSinceLastSave >= 60) {
            const toAdd = secondsSinceLastSave;
            secondsSinceLastSave = 0;
            try {
                const currentSeconds = ME.timeSeconds || 0;
                const newSeconds = currentSeconds + toAdd;
                await fbUpdateDoc(fbDoc(db,"users",ME.id), { timeSeconds: newSeconds });
                ME.timeSeconds = newSeconds;
                sessionStorage.setItem("w_me", JSON.stringify(ME));
            } catch(e) {}
        }
    }, 1000);

    // Сохраняем оставшееся время при закрытии вкладки
    window.addEventListener("beforeunload", () => {
        if (secondsSinceLastSave > 0) {
            // Синхронный fallback через sendBeacon не поддерживает Firestore напрямую,
            // поэтому просто пытаемся сохранить — может не успеть, но это ОК (точность не критична)
            const currentSeconds = ME.timeSeconds || 0;
            const newSeconds = currentSeconds + secondsSinceLastSave;
            try { fbUpdateDoc(fbDoc(db,"users",ME.id), { timeSeconds: newSeconds }); } catch(e) {}
        }
    });
}

function formatHours(totalSeconds) {
    const hours = Math.floor((totalSeconds||0) / 3600);
    return hours + (getLang()==="en" ? " h" : " ч");
}

// ─────────────────────────────────────────────
//  TABS
// ─────────────────────────────────────────────
window.switchTab = function(tab) {
    currentTab = tab;
    $("panelTitle").textContent = tab==="chats" ? t("tabChats") : t("tabFriends");
    document.querySelectorAll(".sidebar-icon").forEach(b=>b.classList.remove("active"));
    $("btn-"+tab)?.classList.add("active");
    activeChatId = null;
    if (chatUnsub) { chatUnsub(); chatUnsub=null; }
    resetConv();
    renderLeft();
};

function resetConv() {
    $("conversationPanel").innerHTML = `<div class="conversation-empty"><div>💬</div><div>${t("chooseChat")}</div></div>`;
}

window.onSearch = function() { renderLeft(); };

// ─────────────────────────────────────────────
//  ЛЕВАЯ ПАНЕЛЬ
// ─────────────────────────────────────────────
async function renderLeft() {
    const query = $("searchInput")?.value.toLowerCase()||"";
    const list  = $("leftList");
    if (!list) return;

    const friends = ME.friends||[];
    if (!friends.length) {
        list.innerHTML = `<div class="user-list-empty">${currentTab==="chats" ? t("noChats") : t("noFriends")}</div>`;
        return;
    }

    let friendDocs = [];
    try {
        const promises = friends.map(id => fbGetDoc(fbDoc(db,"users",id)));
        const snaps    = await Promise.all(promises);
        friendDocs = snaps.filter(s=>s.exists()).map(s=>s.data());
    } catch(e) { list.innerHTML=`<div class="user-list-empty">${t("loadError")}</div>`; return; }

    const filtered = friendDocs.filter(f=>f.nick.toLowerCase().includes(query));
    if (!filtered.length) { list.innerHTML=`<div class="user-list-empty">${t("notFound")}</div>`; return; }

    const items = await Promise.all(filtered.map(async f => {
        let sub = currentTab==="friends" ? t("idLabel")+f.id : "";
        if (currentTab==="chats") {
            try {
                const key = chatKey(ME.id, f.id);
                const msgsSnap = await new Promise(resolve => {
                    const q = fbQuery(fbCollection(db,"chats",key,"messages"), fbOrderBy("ts","desc"));
                    fbOnSnapshot(q, snap => resolve(snap), {once:true});
                });
                if (!msgsSnap.empty) {
                    const last = msgsSnap.docs[0].data();
                    const isMe = last.from===ME.id;
                    const preview = last.type==="image" ? t("photo")
                                  : last.type==="file"  ? t("file")+" "+(last.name||"")
                                  : truncate(last.text||"",28);
                    sub = (isMe?t("you"):"")+preview;
                }
            } catch(e) {}
        }
        const av = localStorage.getItem("w_av_"+f.id);
        const avHtml = av
            ? `<img src="${av}" class="friend-avatar">`
            : `<div class="friend-avatar-placeholder">${f.nick[0].toUpperCase()}</div>`;
        const isActive = activeChatId===f.id?" active":"";
        const fHasTopper = (f.badges||[]).includes("topper");
        const badgeHtml = fHasTopper ? ` <span class="badge-topper-small" title="${t('topperTooltip')}">🏆</span>` : "";
        return `<div class="friend-item${isActive}" onclick="openChat('${f.id}')">
            ${avHtml}
            <div class="friend-info">
                <div class="friend-nick">@${escHtml(f.nick)}${badgeHtml}</div>
                <div class="friend-sub">${escHtml(sub)}</div>
            </div>
        </div>`;
    }));
    list.innerHTML = items.join("");
}

// ─────────────────────────────────────────────
//  ЧАТ
// ─────────────────────────────────────────────
window.openChat = async function(friendId) {
    activeChatId = friendId;
    if (chatUnsub) { chatUnsub(); chatUnsub=null; }

    const friendSnap = await fbGetDoc(fbDoc(db,"users",friendId));
    if (!friendSnap.exists()) return;
    const friend = friendSnap.data();

    const av = localStorage.getItem("w_av_"+friend.id);
    const avHtml = av
        ? `<img src="${av}" class="chat-header-avatar">`
        : `<div class="chat-header-avatar-placeholder">${friend.nick[0].toUpperCase()}</div>`;
    const friendHasTopper = (friend.badges||[]).includes("topper");
    const headerBadge = friendHasTopper ? ` <span class="badge-topper-small" title="${t('topperTooltip')}">🏆</span>` : "";

    $("conversationPanel").innerHTML = `
    <div class="chat-window">
        <div class="chat-header">
            ${avHtml}
            <div>
                <div class="chat-header-nick">@${escHtml(friend.nick)}${headerBadge}</div>
                <div class="chat-header-sub">${t("idLabel")}${friend.id}</div>
            </div>
        </div>
        <div class="chat-messages" id="chatMessages"><div class="msg-loading">…</div></div>
        <div class="chat-attachments-preview" id="attachPreview"></div>
        <div class="chat-input-row">
            <button class="attach-btn" onclick="triggerAttach()">📎</button>
            <input type="file" id="fileInput" multiple style="display:none" onchange="handleFiles(this.files)">
            <input type="text" id="msgInput" placeholder="${t('msgPlaceholder')}"
                onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendMsg();}">
            <button class="send-btn" onclick="sendMsg()">➤</button>
        </div>
    </div>`;

    const key = chatKey(ME.id, friendId);
    const q   = fbQuery(fbCollection(db,"chats",key,"messages"), fbOrderBy("ts","asc"));
    chatUnsub = fbOnSnapshot(q, snap => {
        const msgs = snap.docs.map(d=>d.data());
        renderMessages(msgs);
    });

    $("msgInput")?.focus();
    renderLeft();
};

function renderMessages(msgs) {
    const container = $("chatMessages");
    if (!container) return;
    const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;

    if (!msgs.length) {
        container.innerHTML = `<div class="msg-empty">${t("startConversation")}</div>`;
        return;
    }

    container.innerHTML = msgs.map(m => {
        const isMe = m.from===ME.id;
        const side = isMe?"msg-me":"msg-them";
        const time = m.ts ? fmtTime(m.ts) : "";
        let content = "";
        if (m.type==="image") {
            content = `<img src="${m.data}" class="msg-img" onclick="openImageViewer('${m.data}')" alt="photo">`;
        } else if (m.type==="file") {
            content = `<div class="msg-file">
                <span class="msg-file-icon">📄</span>
                <div><div class="msg-file-name">${escHtml(m.name||"")}</div><div class="msg-file-size">${fmtSize(m.size)}</div></div>
                <a href="${m.data}" download="${escHtml(m.name||"file")}" class="msg-file-dl">⬇</a>
            </div>`;
        } else {
            content = `<span>${escHtml(m.text||"")}</span>`;
        }
        return `<div class="msg-bubble ${side}">${content}<small class="msg-time">${time}</small></div>`;
    }).join("");

    if (wasAtBottom) setTimeout(()=>{ container.scrollTop=container.scrollHeight; },40);
}

// ─────────────────────────────────────────────
//  ОТПРАВКА
// ─────────────────────────────────────────────
window.triggerAttach = () => $("fileInput")?.click();

window.handleFiles = function(files) {
    if (!files?.length) return;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
            const isImg = file.type.startsWith("image/");
            pendingFiles.push({ type:isImg?"image":"file", data:ev.target.result, name:file.name, size:file.size });
            renderAttachPreview();
        };
        reader.readAsDataURL(file);
    });
    $("fileInput").value="";
};

function renderAttachPreview() {
    const box = $("attachPreview");
    if (!box) return;
    if (!pendingFiles.length) { box.innerHTML=""; return; }
    box.innerHTML = pendingFiles.map((a,i) =>
        a.type==="image"
            ? `<div class="attach-thumb" onclick="removeAttach(${i})"><img src="${a.data}"><div class="attach-remove">✕</div></div>`
            : `<div class="attach-file-item" onclick="removeAttach(${i})">📄 ${escHtml(truncate(a.name,20))}<div class="attach-remove">✕</div></div>`
    ).join("");
}

window.removeAttach = i => { pendingFiles.splice(i,1); renderAttachPreview(); };

window.sendMsg = async function() {
    if (!activeChatId) return;
    const input = $("msgInput");
    const text  = input?.value.trim();
    if (!text && !pendingFiles.length) return;

    const key = chatKey(ME.id, activeChatId);
    const col = fbCollection(db,"chats",key,"messages");

    const filesToSend = [...pendingFiles];
    pendingFiles = [];
    renderAttachPreview();

    for (const f of filesToSend) {
        await fbAddDoc(col, { from:ME.id, type:f.type, data:f.data, name:f.name, size:f.size, ts:fbServerTimestamp() });
    }
    if (text) {
        if (input) input.value="";
        await fbAddDoc(col, { from:ME.id, type:"text", text, ts:fbServerTimestamp() });
    }
};

// ─────────────────────────────────────────────
//  ПРОФИЛЬ
// ─────────────────────────────────────────────
const countryKeys = ["Казахстан","Россия","Украина","США","Германия","Франция","Италия","Китай","Япония","Корея","Турция","Канада","Бразилия","Индия","Великобритания","Испания","Польша","Нидерланды","Швеция","Норвегия","Австралия","Мексика"];
const countryEN   = ["Kazakhstan","Russia","Ukraine","USA","Germany","France","Italy","China","Japan","South Korea","Turkey","Canada","Brazil","India","United Kingdom","Spain","Poland","Netherlands","Sweden","Norway","Australia","Mexico"];
function localizedCountry(name) {
    const idx = countryKeys.indexOf(name);
    if (idx === -1) return name;
    return getLang()==="en" ? countryEN[idx] : countryKeys[idx];
}

window.openProfile = function() {
    $("profileModal")?.classList.remove("hidden");
    renderEquippedBadgesInProfile();
    $("profileCountryModal").textContent = "🌍 "+(localizedCountry(ME.country)||"—");
    $("profileIdCopy").textContent       = ME.id;
    const av = localStorage.getItem("w_av_"+ME.id);
    const img = $("avatarImg");
    if (img) img.src = av||"https://via.placeholder.com/100x100/476df0/ffffff?text=👤";

    // Время на сайте
    $("profileTimeValue").textContent = formatHours(ME.timeSeconds);

    // Применённый фон профиля (если куплен и выбран)
    renderProfileBanner();
    renderProfileFrame();

    // Обновить аватарку в сайдбаре
    updateSidebarAvatar();

    const inp = $("avatarInput");
    if (inp) inp.onchange = e => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            localStorage.setItem("w_av_"+ME.id, ev.target.result);
            if (img) img.src = ev.target.result;
            updateSidebarAvatar(); // обновить сайдбар сразу после смены
            renderLeft();
        };
        reader.readAsDataURL(file);
    };

    // Кнопка-переключатель языка (показывает текущий язык)
    const langBtn = $("profileLangToggle");
    if (langBtn) langBtn.textContent = getLang().toUpperCase();
};
window.closeProfile = () => $("profileModal")?.classList.add("hidden");

// Переключение языка кнопкой RU/EN в профиле
window.toggleProfileLang = async function() {
    const newLang = getLang() === "ru" ? "en" : "ru";
    setLang(newLang);
    applyTranslations();

    const langBtn = $("profileLangToggle");
    if (langBtn) langBtn.textContent = newLang.toUpperCase();

    $("profileCountryModal").textContent = "🌍 "+(localizedCountry(ME.country)||"—");

    try {
        await fbUpdateDoc(fbDoc(db,"users",ME.id), { lang: newLang });
        ME.lang = newLang;
        sessionStorage.setItem("w_me", JSON.stringify(ME));
    } catch(err) {}

    window.switchTab(currentTab);
};

// Обновить аватарку в кнопке сайдбара
function updateSidebarAvatar() {
    const av      = localStorage.getItem("w_av_"+ME.id);
    const imgEl   = $("sidebarAvatarImg");
    const emojiEl = $("sidebarAvatarEmoji");
    if (!imgEl || !emojiEl) return;
    if (av) {
        imgEl.src = av;
        imgEl.style.display = "block";
        emojiEl.style.display = "none";
    } else {
        imgEl.style.display = "none";
        emojiEl.style.display = "block";
    }
}
window.copyId = function() {
    const id = $("profileIdCopy")?.textContent;
    if (!id) return;
    navigator.clipboard.writeText(id).then(()=>{
        const btn = document.querySelector(".copy-btn");
        if (btn) { btn.textContent=t("copied"); setTimeout(()=>btn.textContent=t("copy"),2000); }
    });
};

// ─────────────────────────────────────────────
//  ДОБАВЛЕНИЕ ДРУГА
// ─────────────────────────────────────────────
window.openAddFriend = function() {
    $("addFriendModal")?.classList.remove("hidden");
    $("addFriendMsg").textContent="";
    $("addFriendMsg").className="modal-msg";
    $("userPreview")?.classList.add("hidden");
    $("friendIdInput").value="";
};
window.closeAddFriend = () => $("addFriendModal")?.classList.add("hidden");

window.searchUserPreview = async function() {
    const friendId = $("friendIdInput").value.trim();
    const preview  = $("userPreview");
    $("addFriendMsg").textContent="";
    if (friendId.length<9) { preview?.classList.add("hidden"); return; }

    try {
        const snap = await fbGetDoc(fbDoc(db,"users",friendId));
        if (!snap.exists()||friendId===ME.id) { preview?.classList.add("hidden"); return; }
        const f = snap.data();
        const av = localStorage.getItem("w_av_"+f.id);
        const avHtml = av ? `<img src="${av}" class="friend-avatar">` : `<div class="friend-avatar-placeholder">${f.nick[0].toUpperCase()}</div>`;
        const already = (ME.friends||[]).includes(f.id);
        const fHasTopperP = (f.badges||[]).includes("topper");
        const badgeHtmlP = fHasTopperP ? ` <span class="badge-topper-small" title="${t('topperTooltip')}">🏆</span>` : "";
        preview?.classList.remove("hidden");
        preview.innerHTML = `<div class="friend-item" style="cursor:default">${avHtml}<div class="friend-info"><div class="friend-nick">@${escHtml(f.nick)}${badgeHtmlP}</div><div class="friend-sub">🌍 ${escHtml(localizedCountry(f.country)||"—")}${already?" · "+t("alreadyFriends"):""}</div></div></div>`;
    } catch(e) { preview?.classList.add("hidden"); }
};

window.addFriendById = async function() {
    const friendId = $("friendIdInput").value.trim();
    const msgEl    = $("addFriendMsg");
    msgEl.className="modal-msg"; msgEl.textContent="";

    if (!friendId) { msgEl.textContent=t("errEnterId"); return; }
    if (friendId===ME.id) { msgEl.textContent=t("errSelfAdd"); return; }
    if ((ME.friends||[]).includes(friendId)) { msgEl.textContent=t("errAlreadyFriend"); return; }

    const btn = document.querySelector("#addFriendModal .modal-btn");
    const originalLabel = btn.textContent;
    btn.textContent=t("adding"); btn.disabled=true;
    try {
        const snap = await fbGetDoc(fbDoc(db,"users",friendId));
        if (!snap.exists()) { msgEl.textContent=t("errUserNotFound"); btn.textContent=originalLabel; btn.disabled=false; return; }
        const friend = snap.data();

        await fbUpdateDoc(fbDoc(db,"users",ME.id),    { friends: fbArrayUnion(friendId) });
        await fbUpdateDoc(fbDoc(db,"users",friendId), { friends: fbArrayUnion(ME.id)    });

        ME.friends = [...(ME.friends||[]), friendId];
        sessionStorage.setItem("w_me", JSON.stringify(ME));

        msgEl.className="modal-msg success";
        msgEl.textContent=t("friendAdded",{nick:"@"+friend.nick});
        renderLeft();
        setTimeout(closeAddFriend, 1500);
    } catch(e) {
        msgEl.textContent=t("errGeneric")+e.message;
    }
    btn.textContent=originalLabel; btn.disabled=false;
};

// ─────────────────────────────────────────────
//  ПРОСМОТР ИЗОБРАЖЕНИЯ
// ─────────────────────────────────────────────
window.openImageViewer = function(src) {
    $("viewerImg").src = src;
    $("imageViewer")?.classList.remove("hidden");
};
window.closeImageViewer = () => $("imageViewer")?.classList.add("hidden");

// ─────────────────────────────────────────────
//  ВЫХОД
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  ВЫХОД — с подтверждением
// ─────────────────────────────────────────────
window.logout = function() {
    // Закрываем профиль если открыт
    document.getElementById("profileModal")?.classList.add("hidden");
    // Показываем модалку подтверждения
    document.getElementById("logoutModal")?.classList.remove("hidden");
};

window.closeLogoutModal = function() {
    document.getElementById("logoutModal")?.classList.add("hidden");
};

window.confirmLogout = function() {
    if (chatUnsub) chatUnsub();
    sessionStorage.removeItem("w_me");
    navigateTo("index.html");
};

// ─────────────────────────────────────────────
//  СМЕНА ПАРОЛЯ
// ─────────────────────────────────────────────
window.openChangePassword = function() {
    $("profileModal")?.classList.add("hidden");
    $("changePasswordModal")?.classList.remove("hidden");
    $("oldPasswordInput").value = "";
    $("newPasswordInput").value = "";
    $("confirmNewPasswordInput").value = "";
    $("changePasswordMsg").textContent = "";
    $("changePasswordMsg").className = "modal-msg";
};

window.closeChangePassword = function() {
    $("changePasswordModal")?.classList.add("hidden");
};

window.submitChangePassword = async function() {
    const oldPass    = $("oldPasswordInput").value;
    const newPass    = $("newPasswordInput").value;
    const confirmPass = $("confirmNewPasswordInput").value;
    const msgEl = $("changePasswordMsg");
    msgEl.className = "modal-msg";
    msgEl.textContent = "";

    if (!oldPass || !newPass || !confirmPass) { msgEl.textContent = t("errFillAll"); return; }
    if (oldPass !== ME.pass) { msgEl.textContent = t("errOldPasswordWrong"); return; }
    if (newPass.length < 6)  { msgEl.textContent = t("errPassLen"); return; }
    if (newPass !== confirmPass) { msgEl.textContent = t("errPassMismatch"); return; }
    if (newPass === oldPass) { msgEl.textContent = t("errNewPassSameAsOld"); return; }

    const btn = document.querySelector("#changePasswordModal .modal-btn");
    const orig = btn.textContent;
    btn.textContent = "..."; btn.disabled = true;

    try {
        await fbUpdateDoc(fbDoc(db,"users",ME.id), { pass: newPass });
        ME.pass = newPass;
        sessionStorage.setItem("w_me", JSON.stringify(ME));
        msgEl.className = "modal-msg success";
        msgEl.textContent = "✅ Пароль изменён!";
        setTimeout(() => { closeChangePassword(); btn.textContent = orig; btn.disabled = false; }, 1500);
    } catch(e) {
        msgEl.textContent = t("errGeneric") + e.message;
        btn.textContent = orig; btn.disabled = false;
    }
};

// Каталог товаров. На будущее — сюда добавляются новые украшения.
const SHOP_ITEMS = [
    // ── РАМКИ АВАТАРКИ ──
    { id: "frame_neon",     nameKey: "itemNeonFrameName",    priceHours: 1,    type: "frame",  preview: "conic-gradient(from 0deg, #ff4d4d, #ffd24d, #4dff88, #4dd2ff, #b14dff, #ff4d4d)" },
    { id: "frame_gold",     nameKey: "itemGoldFrameName",    priceHours: 48,   type: "frame",  preview: "linear-gradient(135deg, #fceabb 0%, #f8b500 50%, #c87f0a 100%)" },
    { id: "frame_fire",     nameKey: "itemFireFrameName",    priceHours: 24,   type: "frame",  preview: "conic-gradient(from 0deg, #ff0000, #ff6600, #ffcc00, #ff6600, #ff0000)" },
    { id: "frame_ice",      nameKey: "itemIceFrameName",     priceHours: 30,   type: "frame",  preview: "conic-gradient(from 0deg, #a8edea, #ffffff, #56c8d8, #ffffff, #a8edea)" },
    { id: "frame_purple",   nameKey: "itemPurpleFrameName",  priceHours: 36,   type: "frame",  preview: "conic-gradient(from 0deg, #7b2ff7, #c24dff, #476df0, #c24dff, #7b2ff7)" },
    { id: "frame_galaxy",   nameKey: "itemGalaxyFrameName",  priceHours: 200,  type: "frame",  preview: "conic-gradient(from 0deg, #0f0c29, #302b63, #ff6ec4, #7b5ef8, #0f0c29)" },
    { id: "frame_diamond",  nameKey: "itemDiamondFrameName", priceHours: 500,  type: "frame",  preview: "conic-gradient(from 0deg, #b9f2ff, #ffffff, #89d4e8, #d4f7ff, #ffffff, #b9f2ff)" },
    // ── ФОНЫ ПРОФИЛЯ ──
    { id: "banner_stars",   nameKey: "itemBannerName",       priceHours: 12,   type: "banner", preview: "linear-gradient(135deg, #1a1d2e 0%, #2d1b69 40%, #476df0 100%)" },
    { id: "banner_galaxy",  nameKey: "itemGalaxyName",       priceHours: 120,  type: "banner", preview: "linear-gradient(135deg, #2d0a4e 0%, #7b2ff7 45%, #ff6ec4 100%)" },
    { id: "banner_sunset",  nameKey: "itemSunsetName",       priceHours: 20,   type: "banner", preview: "linear-gradient(135deg, #f83600 0%, #f9d423 100%)" },
    { id: "banner_ocean",   nameKey: "itemOceanName",        priceHours: 35,   type: "banner", preview: "linear-gradient(135deg, #0575e6 0%, #021b79 100%)" },
    { id: "banner_forest",  nameKey: "itemForestName",       priceHours: 50,   type: "banner", preview: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)" },
    { id: "banner_night",   nameKey: "itemNightName",        priceHours: 75,   type: "banner", preview: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" },
    { id: "banner_aurora",  nameKey: "itemAuroraName",       priceHours: 300,  type: "banner", preview: "linear-gradient(135deg, #00c3ff 0%, #77ff77 40%, #ff77e9 100%)" },
    // ── ЗНАЧКИ (бейджи) — за 2000 часов ──
    { id: "badge_legend",   nameKey: "itemLegendName",       priceHours: 2000, type: "badge",  preview: "linear-gradient(135deg, #f7971e, #ffd200)", emoji: "🌟" },
    { id: "badge_veteran",  nameKey: "itemVeteranName",      priceHours: 2000, type: "badge",  preview: "linear-gradient(135deg, #bdc3c7, #2c3e50)", emoji: "🛡️" },
];

function getOwnedItems() {
    return ME.ownedItems || [];
}
function getEquippedBanner() {
    return ME.equippedBanner || null;
}
function getEquippedFrame() {
    return ME.equippedFrame || null;
}
function getEquippedBadges() {
    return ME.equippedBadges || [];
}

// Отрисовать фон профиля если он применён
function renderProfileBanner() {
    const bannerEl = $("profileBanner");
    if (!bannerEl) return;
    const equippedId = getEquippedBanner();
    const item = SHOP_ITEMS.find(i => i.id === equippedId);
    if (item) {
        bannerEl.style.background = item.preview;
        bannerEl.classList.add("has-banner");
    } else {
        bannerEl.style.background = "";
        bannerEl.classList.remove("has-banner");
    }
}

// Отрисовать рамку вокруг аватарки в профиле, если применена
function renderProfileFrame() {
    const frameWrap = $("avatarFrameWrap");
    if (!frameWrap) return;
    const equippedId = getEquippedFrame();
    const item = SHOP_ITEMS.find(i => i.id === equippedId);
    if (item) {
        frameWrap.style.setProperty("--frame-gradient", item.preview);
        frameWrap.classList.add("has-frame");
    } else {
        frameWrap.classList.remove("has-frame");
    }
}

window.openShop = function() {
    document.getElementById("profileModal")?.classList.add("hidden");
    document.getElementById("inventoryModal")?.classList.add("hidden");
    $("shopModal")?.classList.remove("hidden");
    $("shopTimeValue").textContent = formatHours(ME.timeSeconds);
    renderShopItems(false);
};

window.closeShop = function() {
    $("shopModal")?.classList.add("hidden");
};

window.openInventory = function() {
    document.getElementById("profileModal")?.classList.add("hidden");
    $("inventoryModal")?.classList.remove("hidden");
    renderShopItems(true);
};

window.closeInventory = function() {
    $("inventoryModal")?.classList.add("hidden");
};

// Показать купленные значки-бейджи в профиле рядом с ником
function renderEquippedBadgesInProfile() {
    const badges = ME.badges || [];
    const hasTopper  = badges.includes("topper");
    const hasCreator = badges.includes("creator");
    const hasAdmin   = badges.includes("admin");
    const hasKing    = badges.includes("king");

    // Купленные бейджи из магазина
    const equippedShopBadges = getEquippedBadges();
    const shopBadgeItems = equippedShopBadges.map(id => SHOP_ITEMS.find(i => i.id === id)).filter(Boolean);

    let badgesHtml = "";
    if (hasCreator) badgesHtml += ` <span class="badge-topper" title="${t('creatorTooltip')}">🔨</span>`;
    if (hasAdmin)   badgesHtml += ` <span class="badge-topper" title="${t('adminTooltip')}">👑</span>`;
    const hasGear = badges.includes("gear");
    if (hasGear)    badgesHtml += ` <span class="badge-topper" title="Настройщик Werbs">⚙️</span>`;
    if (hasTopper)  badgesHtml += ` <span class="badge-topper" title="${t('topperTooltip')}">🏆</span>`;
    shopBadgeItems.forEach(b => {
        badgesHtml += ` <span class="badge-topper" title="${t(b.nameKey)}">${b.emoji}</span>`;
    });

    const nickEl = $("profileNickModal");
    if (nickEl) nickEl.innerHTML = "@"+escHtml(ME.nick) + badgesHtml;
}

function renderShopItems(filterOwned) {
    const listId = filterOwned ? "shopItemsList" : "shopItemsListShop";
    const list = $(listId);
    if (!list) return;

    const totalHours = Math.floor((ME.timeSeconds||0) / 3600);
    const owned = getOwnedItems();
    const equippedBanner = getEquippedBanner();
    const equippedFrame  = getEquippedFrame();
    const equippedBadges = getEquippedBadges();

    const items = filterOwned ? SHOP_ITEMS.filter(i => owned.includes(i.id)) : SHOP_ITEMS;

    if (items.length === 0) {
        list.innerHTML = `<div style="text-align:center;color:#888;padding:30px;font-size:14px;">Инвентарь пуст 😔<br>Купи украшения в магазине!</div>`;
        return;
    }

    list.innerHTML = items.map(item => {
        const isOwned = owned.includes(item.id);
        const isEquipped = (item.type === "banner" && equippedBanner === item.id)
                         || (item.type === "frame"  && equippedFrame  === item.id)
                         || (item.type === "badge"  && equippedBadges.includes(item.id));
        const canAfford = totalHours >= item.priceHours;

        let previewStyle;
        if (item.type === "frame") {
            previewStyle = `background:${item.preview};border-radius:50%;`;
        } else if (item.type === "badge") {
            previewStyle = `background:${item.preview};display:flex;align-items:center;justify-content:center;font-size:26px;border-radius:12px;`;
        } else {
            previewStyle = `background:${item.preview};border-radius:10px;`;
        }

        const previewInner = item.type === "badge" ? item.emoji : "";

        let btnHtml;
        if (filterOwned) {
            if (isEquipped) {
                btnHtml = `<button class="shop-item-btn equipped" onclick="equipItem('${item.id}')">${t('btnEquipped')}</button>`;
            } else {
                btnHtml = `<button class="shop-item-btn can-buy" onclick="equipItem('${item.id}')">${t('btnEquip')}</button>`;
            }
        } else {
            if (isEquipped) {
                btnHtml = `<button class="shop-item-btn equipped" onclick="equipItem('${item.id}')">${t('btnEquipped')}</button>`;
            } else if (isOwned) {
                btnHtml = `<button class="shop-item-btn can-buy" onclick="equipItem('${item.id}')">${t('btnEquip')}</button>`;
            } else if (canAfford) {
                btnHtml = `<button class="shop-item-btn can-buy" onclick="buyItem('${item.id}')">${t('btnBuy')}</button>`;
            } else {
                btnHtml = `<button class="shop-item-btn cant-buy" disabled>${t('btnNotEnough')}</button>`;
            }
        }

        const typeLabel = item.type === "frame" ? "🔵" : item.type === "badge" ? "🏅" : "🖼";

        return `<div class="shop-item">
            <div class="shop-item-preview" style="${previewStyle}">${previewInner}</div>
            <div class="shop-item-info">
                <div class="shop-item-name">${typeLabel} ${t(item.nameKey)}</div>
                <div class="shop-item-price">⏱️ ${item.priceHours} ${getLang()==='en'?(item.priceHours===1?'hour':'hours'):'час'.concat(item.priceHours===1?'':(item.priceHours<5?'а':'ов'))}</div>
            </div>
            ${btnHtml}
        </div>`;
    }).join("");
}

window.buyItem = async function(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    const totalHours = Math.floor((ME.timeSeconds||0) / 3600);
    if (totalHours < item.priceHours) return;

    const owned = getOwnedItems();
    if (owned.includes(itemId)) return;

    try {
        const newOwned = [...owned, itemId];
        await fbUpdateDoc(fbDoc(db,"users",ME.id), { ownedItems: newOwned });
        ME.ownedItems = newOwned;
        sessionStorage.setItem("w_me", JSON.stringify(ME));
        renderShopItems(false);
    } catch(e) {}
};

window.equipItem = async function(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    try {
        if (item.type === "banner") {
            const newEquipped = getEquippedBanner() === itemId ? null : itemId;
            await fbUpdateDoc(fbDoc(db,"users",ME.id), { equippedBanner: newEquipped });
            ME.equippedBanner = newEquipped;
        } else if (item.type === "frame") {
            const newEquipped = getEquippedFrame() === itemId ? null : itemId;
            await fbUpdateDoc(fbDoc(db,"users",ME.id), { equippedFrame: newEquipped });
            ME.equippedFrame = newEquipped;
        } else if (item.type === "badge") {
            const current = getEquippedBadges();
            let newBadges;
            if (current.includes(itemId)) {
                newBadges = current.filter(b => b !== itemId); // снять
            } else {
                newBadges = [...current, itemId]; // надеть
            }
            await fbUpdateDoc(fbDoc(db,"users",ME.id), { equippedBadges: newBadges });
            ME.equippedBadges = newBadges;
        }
        sessionStorage.setItem("w_me", JSON.stringify(ME));

        // Перерисовать в инвентаре или магазине
        const invModal = $("inventoryModal");
        if (invModal && !invModal.classList.contains("hidden")) {
            renderShopItems(true);
        } else {
            renderShopItems(false);
        }
        renderProfileBanner();
        renderProfileFrame();
        renderEquippedBadgesInProfile();
    } catch(e) {}
};
