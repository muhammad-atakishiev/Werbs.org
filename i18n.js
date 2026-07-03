// ═══════════════════════════════════════════
//  СИСТЕМА ПЕРЕВОДА (i18n)
//  Работает на всех страницах сайта одинаково.
// ═══════════════════════════════════════════

export const TRANSLATIONS = {
    ru: {
        // ── INDEX (стартовая) ──
        welcomeTitle: "Добро пожаловать в Werbs (PC version)",
        welcomeDesc: "Добро пожаловать в Werbs — это сайт для общения с друзьями и новыми людьми, где можно переписываться и интересно проводить время.",
        welcomePolicyPre: "Ознакомьтесь с нашими",
        welcomePolicyLink: "политиками конфиденциальности",
        welcomePolicyMid: ". Нажмите «Принять и продолжить», чтобы принять",
        welcomeAgreementLink: "Пользовательское соглашение.",
        acceptBtn: "Принять и продолжить",
        menuHelp: "Помощь",
        menuAbout: "О нас",

        // ── РЕГИСТРАЦИЯ ──
        regHeaderTitle: "Зарегистрируйтесь",
        regHeaderDesc: "Ник будет виден другим — выберите внимательно.",
        labelNickname: "Ник",
        placeholderNickname: "например: werbs_user",
        labelPassword: "Пароль",
        placeholderPassword: "минимум 6 символов",
        labelConfirmPassword: "Подтвердите пароль",
        placeholderConfirmPassword: "повторите пароль",
        labelCountry: "Страна",
        selectCountry: "Выберите страну",
        notBot: "Я не робот",
        regSubmit: "Зарегистрироваться",
        haveAccount: "Уже есть аккаунт?",
        loginLink: "Войти",

        errFillAll: "Заполните все поля",
        errNickLen: "Ник минимум 3 символа",
        errPassLen: "Пароль минимум 6 символов",
        errPassMismatch: "Пароли не совпадают",
        changePasswordBtn: "Сменить пароль",
        changePasswordTitle: "Смена пароля",
        oldPasswordLabel: "Текущий пароль",
        newPasswordLabel: "Новый пароль",
        confirmNewPasswordLabel: "Подтвердите новый пароль",
        changePasswordSubmit: "Сменить пароль",
        errOldPasswordWrong: "Текущий пароль неверный",
        errNewPassSameAsOld: "Новый пароль совпадает со старым",
        errNotBot: "Подтвердите что вы не робот",
        errNickReserved: "Ник зарезервирован",
        errNickTaken: "Ник уже занят",
        errGeneric: "Ошибка: ",
        checking: "Проверка...",

        // ── ВХОД ──
        loginHeaderTitle: "Войти в Werbs",
        loginHeaderDesc: "Введите свой ник и пароль",
        loginSubmit: "Войти",
        noAccount: "Нет аккаунта?",
        registerLink: "Зарегистрироваться",
        errEnterCreds: "Введите ник и пароль",
        errWrongCreds: "Неверный ник или пароль",
        errLocked: "Слишком много попыток. Подождите {sec}.",
        loggingIn: "Вход...",

        // ── ПРИЛОЖЕНИЕ ──
        tabChats: "Чаты",
        tabFriends: "Друзья",
        searchPlaceholder: "Поиск...",
        noChats: "Нет чатов 😔<br>Добавь друга по ID!",
        noFriends: "Нет друзей 😔",
        notFound: "Ничего не найдено",
        loadError: "Ошибка загрузки",
        you: "Вы: ",
        photo: "📷 Фото",
        file: "📎 Файл",
        chooseChat: "Выберите чат чтобы начать общение",
        startConversation: "Начните общение 👋",
        msgPlaceholder: "Написать сообщение...",
        idLabel: "ID: ",
        topperTooltip: "Один из первых 50 пользователей Werbs",
        creatorTooltip: "Создатель Werbs",
        adminTooltip: "Администратор Werbs",

        timeOnSiteLabel: "Время на сайте",
        changeDecorations: "Сменить украшения",
        ttShop: "Магазин",
        shopTitle: "Магазин украшений",
        yourTime: "Ваше время:",
        myDecorations: "Мои украшения",
        goToShop: "В магазин",
        itemBannerName: "Звёздный фон профиля",
        itemBannerPrice: "12 часов на сайте",
        itemGalaxyName: "Галактический фон профиля",
        itemSunsetName: "Закатный фон профиля",
        itemOceanName: "Океанский фон профиля",
        itemForestName: "Лесной фон профиля",
        itemNightName: "Ночной фон профиля",
        itemAuroraName: "Северное сияние (фон)",
        itemNeonFrameName: "Неоновая рамка аватарки",
        itemGoldFrameName: "Золотая рамка аватарки",
        itemFireFrameName: "Огненная рамка аватарки",
        itemIceFrameName: "Ледяная рамка аватарки",
        itemPurpleFrameName: "Фиолетовая рамка аватарки",
        itemGalaxyFrameName: "Галактическая рамка аватарки",
        itemDiamondFrameName: "Бриллиантовая рамка аватарки",
        itemLegendName: "Значок Легенды 🌟",
        itemVeteranName: "Значок Ветерана 🛡️",
        btnBuy: "Купить",
        btnNotEnough: "Недостаточно времени",
        btnOwned: "Куплено",
        btnEquip: "Применить",
        btnEquipped: "Применено",
        purchaseSuccess: "Украшение куплено!",

        // профиль
        changePhoto: "Сменить фото",
        yourIdTitle: "Твой ID для добавления в друзья",
        copy: "📋",
        copied: "✅",
        languageLabel: "Язык интерфейса",

        // добавление друга
        addFriendTitle: "Добавить друга",
        addFriendDesc: "Введите ID пользователя",
        friendIdPlaceholder: "123456789",
        addFriendBtn: "Добавить в друзья",
        alreadyFriends: "✅ Уже в друзьях",
        errEnterId: "Введите ID",
        errSelfAdd: "Нельзя добавить себя",
        errAlreadyFriend: "Уже в друзьях",
        errUserNotFound: "Пользователь не найден",
        adding: "Добавление...",
        friendAdded: "✅ {nick} добавлен в друзья!",

        // sidebar tooltips
        ttChats: "Чаты",
        ttFriends: "Друзья",
        ttAddFriend: "Добавить друга",
        ttProfile: "Профиль",
        ttLogout: "Выйти",

        logoutTitle: "Выйти из аккаунта?",
        logoutDesc: "Вы уверены что хотите выйти?",
        logoutNo: "Нет",
        logoutYes: "Да, выйти",
    },

    en: {
        // ── INDEX ──
        welcomeTitle: "Welcome to Werbs (PC version)",
        welcomeDesc: "Welcome to Werbs — a place to chat with friends and meet new people, and have a great time.",
        welcomePolicyPre: "Check out our",
        welcomePolicyLink: "privacy policy",
        welcomePolicyMid: ". Click \"Accept and continue\" to accept the",
        welcomeAgreementLink: "Terms of Use.",
        acceptBtn: "Accept and continue",
        menuHelp: "Help",
        menuAbout: "About us",

        // ── REGISTER ──
        regHeaderTitle: "Sign up",
        regHeaderDesc: "Your nickname will be visible to others — choose carefully.",
        labelNickname: "Nickname",
        placeholderNickname: "e.g. werbs_user",
        labelPassword: "Password",
        placeholderPassword: "at least 6 characters",
        labelConfirmPassword: "Confirm password",
        placeholderConfirmPassword: "repeat password",
        labelCountry: "Country",
        selectCountry: "Select a country",
        notBot: "I'm not a robot",
        regSubmit: "Sign up",
        haveAccount: "Already have an account?",
        loginLink: "Log in",

        errFillAll: "Fill in all fields",
        errNickLen: "Nickname must be at least 3 characters",
        errPassLen: "Password must be at least 6 characters",
        errPassMismatch: "Passwords don't match",
        changePasswordBtn: "Change password",
        changePasswordTitle: "Change Password",
        oldPasswordLabel: "Current password",
        newPasswordLabel: "New password",
        confirmNewPasswordLabel: "Confirm new password",
        changePasswordSubmit: "Change password",
        errOldPasswordWrong: "Current password is incorrect",
        errNewPassSameAsOld: "New password is same as old",
        errNotBot: "Please confirm you're not a robot",
        errNickReserved: "This nickname is reserved",
        errNickTaken: "This nickname is already taken",
        errGeneric: "Error: ",
        checking: "Checking...",

        // ── LOGIN ──
        loginHeaderTitle: "Log in to Werbs",
        loginHeaderDesc: "Enter your nickname and password",
        loginSubmit: "Log in",
        noAccount: "Don't have an account?",
        registerLink: "Sign up",
        errEnterCreds: "Enter your nickname and password",
        errWrongCreds: "Wrong nickname or password",
        errLocked: "Too many attempts. Please wait {sec}.",
        loggingIn: "Logging in...",

        // ── APP ──
        tabChats: "Chats",
        tabFriends: "Friends",
        searchPlaceholder: "Search...",
        noChats: "No chats yet 😔<br>Add a friend by ID!",
        noFriends: "No friends yet 😔",
        notFound: "Nothing found",
        loadError: "Loading error",
        you: "You: ",
        photo: "📷 Photo",
        file: "📎 File",
        chooseChat: "Select a chat to start messaging",
        startConversation: "Start the conversation 👋",
        msgPlaceholder: "Type a message...",
        idLabel: "ID: ",
        topperTooltip: "One of the first 50 Werbs users",
        creatorTooltip: "Werbs Creator",
        adminTooltip: "Werbs Administrator",

        timeOnSiteLabel: "Time on site",
        changeDecorations: "Change decorations",
        ttShop: "Shop",
        shopTitle: "Decorations Shop",
        yourTime: "Your time:",
        myDecorations: "My decorations",
        goToShop: "Go to shop",
        itemBannerName: "Starry profile banner",
        itemBannerPrice: "12 hours on site",
        itemGalaxyName: "Galaxy profile banner",
        itemSunsetName: "Sunset profile banner",
        itemOceanName: "Ocean profile banner",
        itemForestName: "Forest profile banner",
        itemNightName: "Night profile banner",
        itemAuroraName: "Aurora banner",
        itemNeonFrameName: "Neon avatar frame",
        itemGoldFrameName: "Gold avatar frame",
        itemFireFrameName: "Fire avatar frame",
        itemIceFrameName: "Ice avatar frame",
        itemPurpleFrameName: "Purple avatar frame",
        itemGalaxyFrameName: "Galaxy avatar frame",
        itemDiamondFrameName: "Diamond avatar frame",
        itemLegendName: "Legend Badge 🌟",
        itemVeteranName: "Veteran Badge 🛡️",
        btnBuy: "Buy",
        btnNotEnough: "Not enough time",
        btnOwned: "Owned",
        btnEquip: "Equip",
        btnEquipped: "Equipped",
        purchaseSuccess: "Decoration purchased!",

        changePhoto: "Change photo",
        yourIdTitle: "Your ID for adding friends",
        copy: "📋",
        copied: "✅",
        languageLabel: "Interface language",

        addFriendTitle: "Add a friend",
        addFriendDesc: "Enter the user's ID",
        friendIdPlaceholder: "123456789",
        addFriendBtn: "Add friend",
        alreadyFriends: "✅ Already friends",
        errEnterId: "Enter an ID",
        errSelfAdd: "You can't add yourself",
        errAlreadyFriend: "Already friends",
        errUserNotFound: "User not found",
        adding: "Adding...",
        friendAdded: "✅ {nick} added as a friend!",

        ttChats: "Chats",
        ttFriends: "Friends",
        ttAddFriend: "Add friend",
        ttProfile: "Profile",
        ttLogout: "Log out",

        logoutTitle: "Log out?",
        logoutDesc: "Are you sure you want to log out?",
        logoutNo: "No",
        logoutYes: "Yes, log out",
    }
};

// ─────────────────────────────────────────────
//  ХРАНЕНИЕ И ПОЛУЧЕНИЕ ЯЗЫКА
// ─────────────────────────────────────────────

// До регистрации/входа — язык хранится в localStorage.
// После входа — язык хранится в профиле пользователя (Firestore),
// и localStorage используется как быстрый кэш.
export function getLang() {
    return localStorage.getItem("w_lang") || "ru";
}

export function setLang(lang) {
    localStorage.setItem("w_lang", lang);
}

export function t(key, vars) {
    const lang = getLang();
    let str = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.ru[key] || key;
    if (vars) {
        Object.keys(vars).forEach(k => { str = str.replace("{" + k + "}", vars[k]); });
    }
    return str;
}

// ─────────────────────────────────────────────
//  ПРИМЕНЕНИЕ ПЕРЕВОДА К СТРАНИЦЕ
//  Ищет элементы с data-i18n="key" (textContent)
//  и data-i18n-ph="key" (placeholder)
//  и data-i18n-html="key" (innerHTML, для строк с тегами)
// ─────────────────────────────────────────────
export function applyTranslations() {
    const lang = getLang();
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(el => {
        el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-html]").forEach(el => {
        el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(el => {
        el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
        el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
}

// Переключатель языка (используется на index.html)
export function initLangSwitcher(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.value = getLang();
    applyTranslations();
    sel.addEventListener("change", e => {
        setLang(e.target.value);
        applyTranslations();
    });
}
