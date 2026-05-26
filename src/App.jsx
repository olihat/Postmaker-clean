import React, { createContext, useContext, useReducer, useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, FacebookAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';

// ==========================================
// 1. ZMIENNE ŚRODOWISKOWE I API
// ==========================================
const apiKey = ""; // Klucz API dla Gemini

let auth = null;
try {
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
  if (firebaseConfig) {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
} catch (e) {
  console.warn('Brak konfiguracji Firebase. Aplikacja użyje trybu demonstracyjnego.');
}

// ==========================================
// 2. DANE APLIKACJI (JSON)
// ==========================================
const seedPersonas = [
  { id: "media", name: "Media / Prasa", icon: "📰", description: "Dziennikarze i redakcje. Komunikaty prasowe, oficjalne stanowiska.", toneGuidelines: "Formalny, rzeczowy, bez emocji. Trzecia osoba. Krótki lead z odpowiedzią na 5W.", argumentationStyle: "Fakty, liczby, źródła, cytaty eksperckie. Bez sprzedażowego języka.", vocabulary: ["organizacja", "projekt", "inicjatywa", "wsparcie", "działania", "raport"], avoid: ["Ty/Wy", "emoji", "hashtagi", "wykrzykniki", "kolokwializmy"] },
  { id: "mass", name: "Szeroki odbiorca", icon: "👥", description: "Ogół społeczeństwa, social media, zaangażowanie i zasięg.", toneGuidelines: "Przystępny, lekki, bezpośredni. Druga osoba (Ty). Krótkie zdania, hook na początku.", argumentationStyle: "Storytelling, konkretne historie, emocje, prosty język. CTA w każdym poście.", vocabulary: ["pomóż", "razem", "poznaj", "sprawdź", "dołącz", "zmiana"], avoid: ["żargon urzędowy", "skróty branżowe", "długie zdania złożone"] },
  { id: "patient_family", name: "Rodziny pacjentów", icon: "💗", description: "Bliscy osób chorych. Komunikacja wspierająca, informacyjna, empatyczna.", toneGuidelines: "Ciepły, empatyczny, spokojny. Bez paniki i nadmiaru emocji.", argumentationStyle: "Konkretne wsparcie i kroki. Praktyczne informacje. Walidacja emocji.", vocabulary: ["wsparcie", "rozumiemy", "nie jesteście sami", "pomoc"], avoid: ["walka", "wojownik", "ofiary", "rokowania", "puste obietnice"] }
];

const seedCampaigns = [
  { id: "camp-christmas", name: "Boże Narodzenie", icon: "🎄", date: "12-24", theme: "Świąteczna pomoc, paczki, samotność świąt", suggestedPersona: "mass", briefScaffold: { goal: "Zachęcić do udziału w świątecznej zbiórce", audience: "Darczyńcy, wolontariusze", message: "Święta to czas, w którym nikt nie powinien być sam.", tone: "formalny" } },
  { id: "camp-valentines", name: "Walentynki", icon: "💝", date: "02-14", theme: "Miłość w różnych formach — rodzina, opieka", suggestedPersona: "mass", briefScaffold: { goal: "Pokazać, że miłość to także codzienna troska o bliskich", audience: "Pary, rodziny", message: "Walentynki to nie tylko romans. To także troska o tych, którzy potrzebują wsparcia.", tone: "nieformalny" } },
  { id: "camp-world-health", name: "Światowy Dzień Zdrowia", icon: "🏥", date: "04-07", theme: "Profilaktyka, dostęp do opieki", suggestedPersona: "mass", briefScaffold: { goal: "Edukacja zdrowotna i promocja profilaktyki", audience: "Szeroki odbiorca", message: "Zdrowie to codzienne wybory i wsparcie systemowe.", tone: "nieformalny" } }
];

const translations = {
  pl: {
    appName: "Postmaker",
    splashBtn: "Stwórzmy posty",
    loginTitleReg: "Załóż konto, by działać szybciej.",
    loginTitleLog: "Zaloguj się, by tworzyć.",
    loginName: "Imię i nazwisko",
    loginEmail: "Adres e-mail",
    loginPass: "Hasło",
    loginPassRep: "Powtórz hasło",
    loginBtnReg: "Załóż darmowe konto",
    loginBtnLog: "Zaloguj się",
    loginTest: "Logowanie testowe",
    loginHasAcc: "Masz już konto? ",
    loginNoAcc: "Nie masz konta? ",
    loginHere: "Zaloguj się tutaj",
    registerHere: "Załóż darmowe konto",
    loginOr: "LUB Z E-MAIL",
    continueGoogle: "Kontynuuj z Google",
    continueApple: "Kontynuuj z Apple",
    continueFb: "Kontynuuj z Facebook",
    passMismatch: "Hasła nie są identyczne!",
    loginError: "Wystąpił błąd logowania: ",
    noDb: "Brak bazy. Użyj przycisku Logowania testowego.",
    
    tabCreator: "Kreator",
    tabTemplates: "Szablony",
    tabCampaigns: "Kampanie",
    tabCalendar: "Kalendarz",
    tabDrafts: "Wersje robocze",
    tabArchive: "Archiwum",
    
    creditsInf: "∞ Kredytów",
    creditsNum: " Kredytów",
    menuProfile: "Profil",
    menuPlan: "Plan",
    menuSettings: "Ustawienia",
    menuLogout: "Wyloguj się",
    
    creatorTitle: "Kreator",
    creatorSubtitle: "Błyskawicznie zamień każdy pomysł w gotowy, profesjonalny post. Skonfiguruj styl, wybierz platformy i pozwól AI wykonać za Ciebie całą pracę.",
    step1: "Temat, Odbiorcy i Ton",
    addToTpl: "Dodaj do szablonu",
    mainTopic: "Temat główny",
    mainTopicPlh: "Np. Dzień Ziemi, Nowa usługa...",
    desc: "Opis (O czym piszemy?)",
    descPlh: "Opisz szczegóły, fakty, informacje...",
    audience: "Odbiorcy",
    audiencePlh: "Np. studenci, inwestorzy biznesowi, rodzice...",
    tone: "Ton",
    toneFormal: "Formalny",
    toneInformal: "Nieformalny",
    toneCustom: "Niestandardowy",
    customToneLabel: "Własny ton (AI to zrozumie)",
    customTonePlh: "Np. sarkastyczny, zagadkowy...",
    knowledgeBase: "Baza wiedzy (Wklej link i wciśnij Enter, lub dodaj pliki)",
    linkPlh: "https://... (Enter, by pobrać)",
    filesBtn: "Pliki",
    fetchingLink: "Pobieram treść z linku...",
    
    step2: "Gdzie to opublikujesz?",
    euMarks: "🇪🇺 Oznaczenia unijne",
    euFormula: "Dołącz obowiązkową formułkę informacyjną",
    generateBtn: "Stwórz Gotowe Posty",
    generatingBtn: "Projektuję materiały...",
    
    processingAi: "Przetwarzanie przez AI...",
    fillForm: "Wypełnij formularz po lewej",
    fillFormSub: "Twoja nowa siatka treści, gotowa w ułamek sekundy, pojawi się w tym miejscu.",
    workflowTitle: "TWÓJ NOWY WORKFLOW TREŚCI",
    planAll: "📅 Zaplanuj wszystko:",
    setForAll: "Ustaw dla wszystkich",
    saveDraft: "Zapisz szkic projektu",
    copyText: "Kopiuj tekst",
    uploadDisk: "Wgraj plik z dysku",
    genImg: "Generuj Grafikę AI (Pro)",
    genVid: "Generuj Wideo AI (Beta)",
    soraRender: "AI Renderuje wideo...",
    soraWait: "To może potrwać dłuższą chwilę.",
    removeFile: "✕ Usuń plik",
    
    tplTitle: "Szablony",
    tplSub: "Zamiast od zera, wystartuj z gotową strukturą komunikacyjną przygotowaną na konkretne wydarzenia.",
    searchTpl: "🔍 Szukaj szablonu po nazwie...",
    addCustomTpl: "+ Dodaj własny szablon",
    cancelAdd: "Anuluj dodawanie",
    tplName: "Nazwa szablonu",
    tplNamePlh: "Np. Tygodniowy Raport",
    tplTheme: "Opis / Tematyka",
    tplThemePlh: "Np. Podsumowanie działań fundacji",
    tplIcon: "Ikona (Emoji)",
    tplIconPlh: "Np. 🌟",
    btnChoose: "😀 Wybierz",
    btnChange: "😀 Zmień",
    tplDate: "Data (opcjonalnie)",
    tplDatePlh: "Np. 12-24 lub brak",
    saveLibrary: "Zapisz szablon w bibliotece",
    save: "Zapisz",
    cancel: "Anuluj",
    event: "Wydarzenie: ",
    openInCreator: "Otwórz w Kreatorze",
    
    campTitle: "Edytor Kampanii",
    campSub: "Zarządzaj zapisanymi projektami i zmieniaj wytyczne.",
    noCampTitle: "Brak aktywnych kampanii",
    noCampSub: "Zapisuj swoje projekty z poziomu Kreatora, aby zarządzać kampaniami i edytować wytyczne w locie.",
    sortNew: "Sortuj: Najnowsze (Data)",
    sortOld: "Sortuj: Najstarsze (Data)",
    sortAZ: "Sortuj: A-Z (Nazwa)",
    sortZA: "Sortuj: Z-A (Nazwa)",
    noNameProject: "Projekt bez nazwy",
    genFromGuidelines: "Generuj z wytycznych",
    edit: "Edytuj",
    delete: "Usuń",
    saveChanges: "Zapisz zmiany",
    
    calTitle: "Twój Kalendarz",
    calSub: "Zarządzaj zaplanowanymi publikacjami i buduj strategię na cały miesiąc w formie siatki.",
    scheduledFor: "Zaplanowane na: ",
    noPostsTitle: "Brak postów tego dnia",
    noPostsSub: "Kliknij inny dzień na kalendarzu lub zaplanuj nowe treści w Kreatorze.",
    postsOnPlatforms: "Posty na platformach: ",
    editPostTitle: "Edytuj wpis",
    manageTime: "Zarządzanie czasem publikacji",
    changeTimeSingle: "Zmień czas tylko dla tego medium",
    applyToAllProj: "Zastosuj nowy czas do całego projektu",
    applyAllBtn: "Zastosuj wszędzie",
    postContent: "Treść publikacji",
    attachmentsLabel: "Załączniki",
    confirmClose: "Zatwierdź i zamknij",
    deletePost: "Usuń post",
    months: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
    days: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'],
    
    draftsTitle: "Wersje Robocze",
    draftsSub: "Dokończ to, co zacząłeś. Twoje zapisane szkice postów.",
    noDraftsTitle: "Brak wersji roboczych",
    noDraftsSub: "Zapisuj szkice projektów z poziomu Kreatora, aby móc do nich wrócić później.",
    noTitleDraft: "Szkic bez tytułu",
    noDesc: "Brak opisu",
    load: "Wczytaj",
    
    archTitle: "Archiwum Generacji",
    archSub: "Pełna historia wszystkich Twoich materiałów wygenerowanych przez AI.",
    noArchTitle: "Puste Archiwum",
    noArchSub: "Każde kliknięcie 'Stwórz Gotowe Posty' automatycznie zachowa tu Twoją wygenerowaną historię.",
    autoSaveBadge: "Auto-zapis",
    
    profTitle: "Twój Profil",
    profSub: "Zarządzaj swoimi danymi i integracjami.",
    credState: "Stan Twoich Kredytów",
    credStateSub: "Każda platforma podczas generacji to koszt 5 kredytów.",
    basicData: "Dane Podstawowe",
    orgLabel: "Organizacja",
    saveData: "Zapisz dane",
    connectedAccs: "Połączone Konta (Live)",
    connectedAccsSub: "Połączenie konta pozwala na automatyczną publikację z poziomu Kalendarza.",
    verified: "✓ Zweryfikowano",
    notVerified: "Nie zweryfikowano",
    verifying: "Otwieranie weryfikacji...",
    
    planTitle: "Twój Plan",
    planSub: "Zarządzaj subskrypcją i swoimi możliwościami.",
    currentPlan: "Obecny plan: ",
    renews: "Odnawia się pierwszego dnia miesiąca",
    usedLimit: "Wykorzystano: 0 / 10 limitu",
    mostPopular: "Najpopularniejszy",
    activePlan: "Aktywny",
    choosePlan: "Wybierz plan",
    planFree: "Darmowy",
    planFreeDesc: "Podstawowe funkcje na start.",
    planFreeF1: "10 postów miesięcznie",
    planFreeF2: "Podstawowe szablony",
    planProDesc: "Pełen potencjał automatyzacji.",
    planProF1: "Nielimitowane posty",
    planProF2: "Wszystkie szablony",
    planProF3: "Grafiki AI i Wideo AI",
    planOrg: "Organizacja",
    planOrgDesc: "Pakiet dla fundacji z rabatem.",
    planOrgF1: "Funkcje PRO z rabatem",
    planOrgF2: "Zarządzanie zespołem",
    
    setTitle: "Ustawienia",
    setSub: "Dostosuj środowisko pracy do swoich potrzeb.",
    langLabel: "Język",
    langDesc: "Wybierz język interfejsu aplikacji.",
    darkMode: "Tryb Ciemny",
    darkModeDesc: "Oszczędza wzrok (głębokie czernie).",
    notifMode: "Powiadomienia na e-mail",
    notifDesc: "Wysyłaj powiadomienie na maila o tym, że posty zostały wstawione.",
    autoSaveMode: "Auto-zapis",
    autoSaveDesc: "Zapisuj w tle do archiwum.",
    legalInfo: "Informacje Prawne",
    tos: "📄 Regulamin świadczenia usług",
    privacy: "🔒 Polityka prywatności",
    understandAccept: "Rozumiem i akceptuję",
    agreeProcess: "Zgadzam się na przetwarzanie",
    
    botHello: "Cześć! Jestem Twoim wirtualnym asystentem Postmaker AI. Pytaj o wszystko: od planowania po kredyty!",
    botWait: "Jako bot demonstracyjny nie posiadam jeszcze połączenia z serwerem, ale docelowo pomogę Ci z każdym aspektem aplikacji i tworzenia treści!",
    askQ: "Zadaj pytanie...",
    send: "Wyślij",
    
    toastLinkAdded: "Link przeanalizowany! Wiedza dodana.",
    toastFilesAdded: "Załączono pliki: ",
    toastSelectPlatform: "Zaznacz co najmniej jedną platformę!",
    toastNoCredits: "Brak kredytów! Koszt to ",
    toastCreditsHave: ", a masz ",
    toastGenerated: "Gotowe! Wyniki zapisano też w Archiwum.",
    toastFillTpl: "Aby dodać szablon, wypełnij całą pierwszą tabelę!",
    toastTplAdded: "Dodano do szablonów!",
    toastTplUpdated: "Szablon zaktualizowany!",
    toastTplBuiltIn: "Wbudowanych szablonów nie można edytować. Skopiuj go najpierw jako własny.",
    toastDateSelect: "Wybierz datę!",
    toastScheduled: "Zaplanowano postów w Kalendarzu: ",
    toastDraftSaved: "Zapisano cały projekt jako szkic!",
    toastCopied: "Skopiowano!",
    toastDraftLoaded: "Wczytano szkic!",
    toastDraftDeleted: "Usunięto szkic!",
    toastImgError: "Błąd generowania obrazu.",
    toastVidSuccess: "Wideo wygenerowane pomyślnie!",
    toastCampLoaded: "Wczytano kampanię do Kreatora!",
    toastCampUpdated: "Zaktualizowano wytyczne kampanii!",
    toastTimeUpdatedAll: "Zmieniono godzinę dla całego projektu!",
    toastPostUpdated: "Zaktualizowano wpis!",
    toastPostDeleted: "Usunięto z kalendarza!",
    toastProfileSaved: "Zapisano zmiany w profilu",
    toastPlatformConnected: "Pomyślnie połączono z platformą ",
    toastPlanChanged: "Zmieniono plan!",
    
    seedCamp1: "Boże Narodzenie",
    seedCamp1Desc: "Świąteczna pomoc, paczki, samotność świąt",
    seedCamp2: "Walentynki",
    seedCamp2Desc: "Miłość w różnych formach — rodzina, opieka",
    seedCamp3: "Światowy Dzień Zdrowia",
    seedCamp3Desc: "Profilaktyka, dostęp do opieki",
    
    aiPrompt: "Polski"
  },
  en: {
    appName: "Postmaker",
    splashBtn: "Let's create posts",
    loginTitleReg: "Create an account to work faster.",
    loginTitleLog: "Log in to create.",
    loginName: "Full Name",
    loginEmail: "Email Address",
    loginPass: "Password",
    loginPassRep: "Repeat Password",
    loginBtnReg: "Create Free Account",
    loginBtnLog: "Log In",
    loginTest: "Test Login",
    loginHasAcc: "Already have an account? ",
    loginNoAcc: "Don't have an account? ",
    loginHere: "Log in here",
    registerHere: "Create a free account",
    loginOr: "OR WITH E-MAIL",
    continueGoogle: "Continue with Google",
    continueApple: "Continue with Apple",
    continueFb: "Continue with Facebook",
    passMismatch: "Passwords do not match!",
    loginError: "Login error occurred: ",
    noDb: "No database. Use the Test Login button.",
    
    tabCreator: "Creator",
    tabTemplates: "Templates",
    tabCampaigns: "Campaigns",
    tabCalendar: "Calendar",
    tabDrafts: "Drafts",
    tabArchive: "Archive",
    
    creditsInf: "∞ Credits",
    creditsNum: " Credits",
    menuProfile: "Profile",
    menuPlan: "Plan",
    menuSettings: "Settings",
    menuLogout: "Log Out",
    
    creatorTitle: "Creator",
    creatorSubtitle: "Instantly turn any idea into a ready, professional post. Configure the style, choose platforms, and let AI do all the work for you.",
    step1: "Topic, Audience & Tone",
    addToTpl: "Add to templates",
    mainTopic: "Main Topic",
    mainTopicPlh: "E.g., Earth Day, New Service...",
    desc: "Description (What are we writing about?)",
    descPlh: "Describe details, facts, information...",
    audience: "Audience",
    audiencePlh: "E.g., students, business investors, parents...",
    tone: "Tone",
    toneFormal: "Formal",
    toneInformal: "Informal",
    toneCustom: "Custom",
    customToneLabel: "Custom tone (AI will understand)",
    customTonePlh: "E.g., sarcastic, mysterious...",
    knowledgeBase: "Knowledge Base (Paste link & press Enter, or add files)",
    linkPlh: "https://... (Enter to fetch)",
    filesBtn: "Files",
    fetchingLink: "Fetching content from link...",
    
    step2: "Where will you publish?",
    euMarks: "🇪🇺 EU Marks",
    euFormula: "Include mandatory EU funding formula",
    generateBtn: "Create Ready Posts",
    generatingBtn: "Designing materials...",
    
    processingAi: "Processing with AI...",
    fillForm: "Fill out the form on the left",
    fillFormSub: "Your new content grid, ready in a fraction of a second, will appear right here.",
    workflowTitle: "YOUR NEW CONTENT WORKFLOW",
    planAll: "📅 Schedule all:",
    setForAll: "Set for all",
    saveDraft: "Save project draft",
    copyText: "Copy text",
    uploadDisk: "Upload file from disk",
    genImg: "Generate AI Image (Pro)",
    genVid: "Generate AI Video (Beta)",
    soraRender: "AI is rendering video...",
    soraWait: "This might take a while.",
    removeFile: "✕ Remove file",
    
    tplTitle: "Templates",
    tplSub: "Instead of starting from scratch, begin with a ready communication structure prepared for specific events.",
    searchTpl: "🔍 Search template by name...",
    addCustomTpl: "+ Add custom template",
    cancelAdd: "Cancel adding",
    tplName: "Template Name",
    tplNamePlh: "E.g., Weekly Report",
    tplTheme: "Description / Theme",
    tplThemePlh: "E.g., Summary of foundation activities",
    tplIcon: "Icon (Emoji)",
    tplIconPlh: "E.g., 🌟",
    btnChoose: "😀 Choose",
    btnChange: "😀 Change",
    tplDate: "Date (optional)",
    tplDatePlh: "E.g., 12-24 or empty",
    saveLibrary: "Save template in library",
    save: "Save",
    cancel: "Cancel",
    event: "Event: ",
    openInCreator: "Open in Creator",
    
    campTitle: "Campaign Editor",
    campSub: "Manage saved projects and alter guidelines.",
    noCampTitle: "No active campaigns",
    noCampSub: "Save your projects from the Creator to manage campaigns and edit guidelines on the fly.",
    sortNew: "Sort: Newest (Date)",
    sortOld: "Sort: Oldest (Date)",
    sortAZ: "Sort: A-Z (Name)",
    sortZA: "Sort: Z-A (Name)",
    noNameProject: "Unnamed Project",
    genFromGuidelines: "Generate from guidelines",
    edit: "Edit",
    delete: "Delete",
    saveChanges: "Save changes",
    
    calTitle: "Your Calendar",
    calSub: "Manage scheduled publications and build a strategy for the whole month in grid view.",
    scheduledFor: "Scheduled for: ",
    noPostsTitle: "No posts on this day",
    noPostsSub: "Click another day on the calendar or schedule new content in the Creator.",
    postsOnPlatforms: "Posts on platforms: ",
    editPostTitle: "Edit Post",
    manageTime: "Publication Time Management",
    changeTimeSingle: "Change time only for this medium",
    applyToAllProj: "Apply new time to the entire project",
    applyAllBtn: "Apply everywhere",
    postContent: "Post Content",
    attachmentsLabel: "Attachments",
    confirmClose: "Confirm and close",
    deletePost: "Delete post",
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    
    draftsTitle: "Drafts",
    draftsSub: "Finish what you started. Your saved post drafts.",
    noDraftsTitle: "No drafts",
    noDraftsSub: "Save project drafts from the Creator to return to them later.",
    noTitleDraft: "Draft without title",
    noDesc: "No description",
    load: "Load",
    
    archTitle: "Generation Archive",
    archSub: "Full history of all your AI-generated materials.",
    noArchTitle: "Empty Archive",
    noArchSub: "Every click on 'Create Ready Posts' will automatically save your generated history here.",
    autoSaveBadge: "Auto-save",
    
    profTitle: "Your Profile",
    profSub: "Manage your data and integrations.",
    credState: "Your Credits Status",
    credStateSub: "Each platform generation costs 5 credits.",
    basicData: "Basic Data",
    orgLabel: "Organization",
    saveData: "Save data",
    connectedAccs: "Connected Accounts (Live)",
    connectedAccsSub: "Connecting an account allows for automatic publishing directly from the Calendar.",
    verified: "✓ Verified",
    notVerified: "Not verified",
    verifying: "Opening verification...",
    
    planTitle: "Your Plan",
    planSub: "Manage subscription and your capabilities.",
    currentPlan: "Current plan: ",
    renews: "Renews on the first day of the month",
    usedLimit: "Used: 0 / 10 limit",
    mostPopular: "Most Popular",
    activePlan: "Active",
    choosePlan: "Choose plan",
    planFree: "Free",
    planFreeDesc: "Basic functions to start.",
    planFreeF1: "10 posts monthly",
    planFreeF2: "Basic templates",
    planProDesc: "Full automation potential.",
    planProF1: "Unlimited posts",
    planProF2: "All templates",
    planProF3: "AI Images & AI Video",
    planOrg: "Organization",
    planOrgDesc: "Package for foundations with discount.",
    planOrgF1: "PRO features with discount",
    planOrgF2: "Team management",
    
    setTitle: "Settings",
    setSub: "Customize the workspace to your needs.",
    langLabel: "Language",
    langDesc: "Choose application interface language.",
    darkMode: "Dark Mode",
    darkModeDesc: "Saves eyesight (deep blacks).",
    notifMode: "Email Notifications",
    notifDesc: "Send an email notification when posts are published.",
    autoSaveMode: "Auto-save",
    autoSaveDesc: "Save in background to the archive.",
    legalInfo: "Legal Information",
    tos: "📄 Terms of Service",
    privacy: "🔒 Privacy Policy",
    understandAccept: "I understand and accept",
    agreeProcess: "I agree to processing",
    
    botHello: "Hello! I'm your Postmaker AI virtual assistant. Ask me anything: from planning to credits!",
    botWait: "As a demo bot, I don't have a server connection yet, but eventually I will help you with every aspect of the app and content creation!",
    askQ: "Ask a question...",
    send: "Send",
    
    toastLinkAdded: "Link analyzed! Knowledge added.",
    toastFilesAdded: "Files attached: ",
    toastSelectPlatform: "Select at least one platform!",
    toastNoCredits: "Not enough credits! Cost is ",
    toastCreditsHave: ", and you have ",
    toastGenerated: "Done! Results saved in Archive.",
    toastFillTpl: "To add a template, fill out the entire first table!",
    toastTplAdded: "Added to templates!",
    toastTplUpdated: "Template updated!",
    toastTplBuiltIn: "Built-in templates cannot be edited. Copy it as custom first.",
    toastDateSelect: "Select a date!",
    toastScheduled: "Posts scheduled in Calendar: ",
    toastDraftSaved: "Entire project saved as a draft!",
    toastCopied: "Copied!",
    toastDraftLoaded: "Draft loaded!",
    toastDraftDeleted: "Draft deleted!",
    toastImgError: "Image generation error.",
    toastVidSuccess: "Video generated successfully!",
    toastCampLoaded: "Campaign loaded into Creator!",
    toastCampUpdated: "Campaign guidelines updated!",
    toastTimeUpdatedAll: "Time changed for the entire project!",
    toastPostUpdated: "Post updated!",
    toastPostDeleted: "Removed from calendar!",
    toastProfileSaved: "Profile changes saved",
    toastPlatformConnected: "Successfully connected with platform ",
    toastPlanChanged: "Plan changed!",
    
    seedCamp1: "Christmas",
    seedCamp1Desc: "Holiday help, packages, loneliness during holidays",
    seedCamp2: "Valentine's Day",
    seedCamp2Desc: "Love in various forms — family, care",
    seedCamp3: "World Health Day",
    seedCamp3Desc: "Prevention, access to healthcare",
    
    aiPrompt: "English"
  }
};

const ALL_EMOJIS = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','😺','😸','😹','😻','😼','😽','🙀','😿','😾',
  '👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👀','👁','👅','👄',
  '🌍','🌎','🌏','🌐','🗺','🗾','🧭','🏔','⛰','🌋','🗻','🏕','🏖','🏜','🏝','🏞','🏟','🏛','🏗','🧱','🪨','🪵','🛖','🏘','🏚','🏠','🏡','🏢','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽','⛪️','🕌','🛕','🕍','⛩','🕋','🌁','🌃','🏙','🌄','🌅','🌆','🌇','🌉','♨️','🎠','🎡','🎢','💈','🎪','🚂','🚃','🚄','🚅','🚆','🚇','🚈','🚉','🚊','🚝','🚞','🚋','🚌','🚎','🚐','🚑','🚒','🚓','🚕','🚖','🚗','🚘','🚙','🛻','🚚','🚛','🚜','🏎','🏍','🛵','🦽','🦼','🩼','🛴','🚲','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🦼','🦽',
  '🔥','✨','🌟','💫','💥','💢','💦','💧','💤','💨','👂','👀','👁','🧠','🗣','👤','👥','🫂','🫀','🫁',
  '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿','🦔',
  '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕️','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽','🥣','🥡','🥢','🧂',
  '⚽️','🏀','🏈','⚾️','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳️','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸','🥌','🎿','⛷','🏂','🪂','🏋️‍♀️','🏋️','🏋️‍♂️','🤼‍♀️','🤼','🤼‍♂️','🤸‍♀️','🤸','🤸‍♂️','⛹️‍♀️','⛹️','⛹️‍♂️','🤺','🤾‍♀️','🤾','🤾‍♂️','🏌️‍♀️','🏌️','🏌️‍♂️','🏇','🧘‍♀️','🧘','🧘‍♂️','🏄‍♀️','🏄','🏄‍♂️','🏊‍♀️','🏊','🏊‍♂️','🤽‍♀️','🤽','🤽‍♂️','🚣‍♀️','🚣','🚣‍♂️','🧗‍♀️','🧗','🧗‍♂️','🚵‍♀️','🧗','🧗‍♂️','🚴‍♀️','🚴','🚴‍♂️','🚵‍♀️','🚵','🚵‍♂️','🏆','🥇','🥈','🥉','🏅','🎖','🏵','🎗','🎫','🎟','🎪','🤹‍♀️','🤹','🤹‍♂️','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🎲','♟','🎯','🎳','🎮','🎰','🧩',
  '⌚️','📱','📲','💻','⌨️','🖥','🖨','🖱','🖲','🕹','🗜','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽','🎞','📞','☎️','📟','📠','📺','📻','🎙','🎚','🎛','🧭','⏱','⏲','⏰','🕰','⌛️','⏳','📡','🔋','🔌','💡','🔦','🕯','🪔','🧯','🛢','💸','💵','💴','💶','💷','🪙','💰','💳','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒','🛠','⛏','🪚','🔩','⚙️','🪤','🧱','⛓','🧲','🔫','💣','🧨','🪓','🔪','🗡','⚔️','🛡','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🔭','🔬','🕳','🩹','🩺','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡','🧹','🪠','🧺','🧻','🚽','🚰','🚿','🛁','🛀','🧼','🪥','🪒','🧽','🪣','🧴','🛎','🔑','🗝','🚪','🪑','🛋','🛏','🛌','🧸','🪆','🖼','🪞','🪟','🛍','🛒','🎁','🎈','🎏','🎀','🪄','🪅','🎊','🎉','🎎','🏮','🎐','🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷','🪧','📪','📫','📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒','🗓','📆','📅','🗑','📇','🗃','🗳','🗄','📋','📁','📂','🗂','🗞','📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗','📎','🖇','📐','📏','🧮','📌','📍','✂️','🖊','🖋','✒️','🖌','🖍','📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓',
];

// ==========================================
// 3. LOGIKA BIZNESOWA (Services)
// ==========================================
const PLATFORM_ICONS = {
  facebook: { icon: 'fb', color: '#1877F2' },
  instagram: { icon: 'ig', color: '#E1306C' },
  linkedin: { icon: 'in', color: '#0A66C2' },
  newsletter: { icon: 'nw', color: '#8b5cf6' },
  tiktok: { icon: 'tt', color: '#ff0050' }
};

const SVG_ICONS = {
  facebook: <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>,
  instagram: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>,
  linkedin: <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>,
  newsletter: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>,
  tiktok: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="100%" height="100%"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
};

const MailboxIcon = ({ size = 64, strokeWidth = 4, withOutline = false }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
    {withOutline && (
      <g stroke="#000000" strokeWidth={strokeWidth + 6}>
         <line x1="60" y1="80" x2="60" y2="120" />
         <polygon points="50,30 90,30 90,70 50,70" />
         <line x1="30" y1="40" x2="50" y2="30" />
         <line x1="70" y1="40" x2="90" y2="30" />
         <line x1="70" y1="80" x2="90" y2="70" />
         <line x1="30" y1="80" x2="50" y2="70" />
         <polygon points="30,40 50,30 90,30 70,40" />
         <polygon points="70,40 90,30 90,70 70,80" />
         <polygon points="30,40 70,40 70,80 30,80" />
         <line x1="40" y1="50" x2="60" y2="50" strokeWidth={strokeWidth + 4} />
      </g>
    )}
    <g stroke="#f43f5e" strokeWidth={strokeWidth}>
       <line x1="60" y1="80" x2="60" y2="120" />
       <polygon points="50,30 90,30 90,70 50,70" />
       <line x1="30" y1="40" x2="50" y2="30" />
       <line x1="70" y1="40" x2="90" y2="30" />
       <line x1="70" y1="80" x2="90" y2="70" />
       <line x1="30" y1="80" x2="50" y2="70" />
       <polygon points="30,40 50,30 90,30 70,40" fill="#ffffff" />
       <polygon points="70,40 90,30 90,70 70,80" fill="#ffffff" />
       <polygon points="30,40 70,40 70,80 30,80" fill="#ffffff" />
       <line x1="40" y1="50" x2="60" y2="50" strokeWidth={Math.max(3, strokeWidth * 0.75)} />
    </g>
  </svg>
);


function loadCollection(key, seed) { return seed; }

async function scrapeWebsite(url) {
  if (!url) throw new Error('Podaj URL strony');
  const normalizedUrl = url.startsWith('http') ? url : 'https://' + url;
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(normalizedUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Nie udało się pobrać strony: ${response.status}`);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, nav, footer, header, iframe, noscript').forEach(el => el.remove());
    const title = doc.querySelector('title')?.textContent || '';
    const paragraphs = Array.from(doc.querySelectorAll('p')).map(p => p.textContent.trim()).filter(t => t.length > 30).slice(0, 15);
    return [`TYTUŁ: ${title}`, `TREŚĆ:\n${paragraphs.join('\n\n')}`].filter(Boolean).join('\n\n').substring(0, 4000);
  } catch (error) { return `TYTUŁ: Strona ${normalizedUrl}\nTREŚĆ:\n[Pobrana treść witryny. Organizacja działa w obszarze lokalnym wspierając społeczności i zrównoważony rozwój.]`; }
}

async function fetchGeminiText(systemPrompt, userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: userPrompt }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json" } };
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) {
    if (response.status === 403 || response.status === 400) throw new Error('API_KEY_ERROR');
    throw new Error(`Błąd API Gemini: ${response.status}`);
  }
  const result = await response.json();
  return JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text);
}

const PLATFORM_INSTRUCTIONS = {
  facebook: 'FACEBOOK: Angażujący post budujący społeczność i dyskusję. 2-3 krótkie akapity. Umiarkowana ilość emoji. Zachęcaj do komentowania (wyraźne CTA). Luźniejsza, domowa estetyka.',
  instagram: 'INSTAGRAM: Mocny hook (haczyk) na samym początku. Skupienie na estetyce, emocjach i warstwie wizualnej. Luźniejsze akapity, odpowiednie emoji, blok trafnych hashtagów na końcu.',
  linkedin: 'LINKEDIN: Profesjonalna sieć biznesowa. Ton ekspercki, merytoryczny i wartościowy (insighty, wiedza branżowa, przemyślenia). Bardzo mało emoji. Zastosuj punktory dla przejrzystości, bez slangu.',
  newsletter: 'NEWSLETTER: Dłuższa forma komunikacji e-mailowej. Chwytliwy temat, bezpośredni zwrot na "Ty". Utrzymaj uwagę, dodaj wezwanie do akcji (przycisk/link) na końcu.',
  tiktok: 'TIKTOK: Dynamiczny skrypt pod wideo lub krótki opis pod rolkę. Super szybki hook w 1. zdaniu. Luźny język, odwołanie do trendów, sporo dynamiki i zachęta do dyskusji w komentarzach.'
};

const CONTENT_TYPE_INSTRUCTIONS = {
  post: 'Krótka, angażująca forma tekstowa dostosowana do specyfiki platformy.',
  guide: 'Ekspercki poradnik (min. 500 słów): nagłówki H2/H3, punktory, checklisty.',
  press_release: 'Nota prasowa: lead (kto, co, gdzie, kiedy), rozwinięcie, cytat prezesa/eksperta, boilerplate. Pełen profesjonalizm.',
};

async function generateContent({ brief, platforms, websiteContent, euSettings, persona, contentType = 'post', language = 'pl' }) {
  const activePlatforms = Object.entries(platforms).filter(([, v]) => v).map(([k]) => k);
  if (activePlatforms.length === 0) throw new Error('Wybierz co najmniej jedną platformę do publikacji');
  
  const websiteContext = websiteContent ? `\nKONTEKST ZE STRONY WWW / PLIKÓW:\n${websiteContent}` : '';
  const abNote = brief.abVariants ? '\nWygeneruj 2 różne warianty (A i B) dla każdej platformy.' : '';
  const platformInstructions = activePlatforms.map(p => `### ${p.toUpperCase()}\n${PLATFORM_INSTRUCTIONS[p]}`).join('\n');
  
  const targetLang = language === 'en' ? 'English' : 'Polish';

  const systemPrompt = `Jesteś wybitnym, rzetelnym i kreatywnym ekspertem ds. komunikacji oraz copywriterem. Otrzymasz instrukcje w języku polskim, ale wygenerowana treść MUSI być w języku: ${targetLang}. 
Zadanie: Wygeneruj profesjonalne posty na podane platformy społecznościowe. Twoje teksty muszą być PERFEKCYJNIE dopasowane do specyfiki każdej platformy (długość, styl, użycie emoji). 
- Zadbaj o najwyższą jakość, wiarygodność, naturalność języka i rzetelność opartą na podanych informacjach. Unikaj halucynacji.
- Jeśli podano kontekst z bazy wiedzy (WWW lub pliki), koniecznie wpleć fakty stamtąd (bez zmyślania).
- Zwracaj szczególną uwagę na Ton i Odbiorców - dostosuj argumentację i słownictwo.
Odpowiadasz TYLKO w formacie JSON: { "platforms": { "<nazwa_platformy>": { "variants": [ { "label": "Wariant A", "title": "Temat emaila/tytuł", "content": "treść...", "cta": ["cta 1"], "imagePrompts": ["english prompt for AI image generator, high quality photorealistic"] } ] } } }`;
  
  const actualTone = brief.tone === 'niestandardowy' ? (brief.customTone || 'AI ma samo dopasować idealny ton') : brief.tone;
  const userPrompt = `BRIEF:\nTemat główny: ${brief.mainTopic}\nSzczegóły: ${brief.message}\nOdbiorcy: ${brief.audience}\nTon: ${actualTone}\n${websiteContext}\nWYTYCZNE PLATFORM (ZASTOSUJ RÓŻNE STYLE DLA RÓŻNYCH PLATFORM!):\n${platformInstructions}\nTYP TREŚCI: ${CONTENT_TYPE_INSTRUCTIONS[contentType]}\nPERSONA: ${persona?.name} - ${persona?.toneGuidelines}\n${abNote}`;
  
  try {
    const result = await fetchGeminiText(systemPrompt, userPrompt);
    return result;
  } catch (error) {
    const mockVariants = [ { label: "Wariant A", title: "Propozycja posta (Demo)", content: `To jest wersja demonstracyjna dla tematu: "${brief.mainTopic}".\n\nSztuczna Inteligencja napotkała problem z kluczem API, więc wygenerowaliśmy ten tekst zastępczy.\n\nDzięki temu możesz w pełni przetestować interfejs: sprawdź, jak działa edycja, wygeneruj zastępczy obrazek i zaplanuj ten post w kalendarzu lub zapisz jako wersję roboczą!`, cta: ["Sprawdź to!"], imagePrompts: ["professional minimalist vector illustration, aesthetic colors"] } ];
    const result = { platforms: {} };
    activePlatforms.forEach(p => { result.platforms[p] = { variants: mockVariants }; });
    return new Promise(resolve => setTimeout(() => resolve(result), 1500)); 
  }
}

async function generateImage(promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
  const payload = { instances: { prompt: promptText }, parameters: { sampleCount: 1 } };
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`Błąd API`);
    const data = await response.json();
    return `data:image/png;base64,${data.predictions?.[0]?.bytesBase64Encoded}`;
  } catch (error) { return new Promise(resolve => setTimeout(() => resolve("https://placehold.co/600x400/f43f5e/ffffff?text=Zastepcza+Grafika+Demo"), 2000)); }
}

// ==========================================
// 4. KONTEKST APLIKACJI (Stan)
// ==========================================
const AppContext = createContext(null);
const DEFAULT_FORMULA = `Projekt jest współfinansowany ze środków Fundusze Europejskie dla Dolnego Śląska 2021-2027. Priorytet 7.`;

const initialState = {
  activeTab: 'demo',
  theme: 'light',
  language: 'pl',
  userProfile: { name: 'Jan Kowalski', email: 'jan@postmaker.pl', organization: 'Organizacja', connectedPlatforms: { facebook: false, instagram: false, linkedin: false, newsletter: false, tiktok: false } },
  brief: { mainTopic: '', customTone: '', goal: '', audience: '', message: '', deadline: '', tone: 'formalny', abVariants: false },
  websiteUrl: '', websiteContent: '', websiteLoading: false,
  attachedLinks: [], attachedFiles: [],
  platforms: { facebook: false, instagram: false, linkedin: false, newsletter: false, tiktok: false },
  euSettings: { attachLogos: false, attachFormula: false, formula: DEFAULT_FORMULA },
  generatedContent: {}, isGenerating: false, generatingImages: {}, generatedImages: {}, generatingVideos: {}, generatedVideos: {},
  scheduledPosts: [], drafts: [], credits: 1050,
  savedProjects: [], customTemplates: [], 
  selectedPersonaId: 'mass', selectedContentType: 'post', activeCampaignId: null,
  toasts: [],
  settings: { notifications: true, autoSave: true }, 
  currentPlan: 'free',
  modals: { rules: false, privacy: false }
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_TAB': return { ...state, activeTab: action.payload };
    case 'SET_THEME': return { ...state, theme: action.payload };
    case 'SET_LANGUAGE': return { ...state, language: action.payload };
    case 'UPDATE_PROFILE': return { ...state, userProfile: { ...state.userProfile, ...action.payload } };
    case 'TOGGLE_SETTING': return { ...state, settings: { ...state.settings, [action.payload]: !state.settings[action.payload] } };
    case 'UPDATE_BRIEF': return { ...state, brief: { ...state.brief, ...action.payload } };
    case 'SET_WEBSITE_URL': return { ...state, websiteUrl: action.payload };
    case 'SET_WEBSITE_CONTENT': return { ...state, websiteContent: action.payload, websiteLoading: false };
    case 'SET_WEBSITE_LOADING': return { ...state, websiteLoading: action.payload };
    case 'ADD_ATTACHED_LINK': return { ...state, attachedLinks: [...(state.attachedLinks || []), action.payload] };
    case 'ADD_ATTACHED_FILE': return { ...state, attachedFiles: [...(state.attachedFiles || []), action.payload] };
    case 'REMOVE_ATTACHED_LINK': return { ...state, attachedLinks: (state.attachedLinks || []).filter(l => l !== action.payload) };
    case 'REMOVE_ATTACHED_FILE': return { ...state, attachedFiles: (state.attachedFiles || []).filter(f => f !== action.payload) };
    case 'TOGGLE_PLATFORM': return { ...state, platforms: { ...state.platforms, [action.payload]: !state.platforms[action.payload] } };
    case 'SET_PLATFORMS': return { ...state, platforms: action.payload };
    case 'UPDATE_EU_SETTINGS': return { ...state, euSettings: { ...state.euSettings, ...action.payload } };
    case 'SET_GENERATED_CONTENT': return { ...state, generatedContent: action.payload, isGenerating: false };
    case 'SET_GENERATING': return { ...state, isGenerating: action.payload };
    case 'SET_GENERATING_IMAGE': return { ...state, generatingImages: { ...state.generatingImages, [action.payload.platform]: action.payload.value } };
    case 'SET_GENERATED_IMAGE': return { ...state, generatedImages: { ...state.generatedImages, [action.payload.platform]: action.payload.image }, generatingImages: { ...state.generatingImages, [action.payload.platform]: false } };
    case 'SET_GENERATING_VIDEO': return { ...state, generatingVideos: { ...state.generatingVideos, [action.payload.platform]: action.payload.value } };
    case 'SET_GENERATED_VIDEO': return { ...state, generatedVideos: { ...state.generatedVideos, [action.payload.platform]: action.payload.video }, generatingVideos: { ...state.generatingVideos, [action.payload.platform]: false } };
    case 'SET_CREDITS': return { ...state, credits: action.payload };
    case 'USE_CREDIT': return { ...state, credits: state.credits === Infinity ? Infinity : Math.max(0, state.credits - action.payload) };
    case 'SCHEDULE_POST': return { ...state, scheduledPosts: [...state.scheduledPosts, action.payload] };
    case 'REMOVE_SCHEDULED_POST': return { ...state, scheduledPosts: state.scheduledPosts.filter(p => p.id !== action.payload) };
    case 'EDIT_SCHEDULED_POST': return { ...state, scheduledPosts: state.scheduledPosts.map(p => p.id === action.payload.id ? { ...p, content: action.payload.content, time: action.payload.time, image: action.payload.image, video: action.payload.video } : p) };
    case 'EDIT_BULK_TIME': return { ...state, scheduledPosts: state.scheduledPosts.map(p => (p.topic === action.payload.topic && p.date === action.payload.date) ? { ...p, time: action.payload.time } : p) };
    case 'SAVE_DRAFT': return { ...state, drafts: [...state.drafts, action.payload] };
    case 'REMOVE_DRAFT': return { ...state, drafts: state.drafts.filter(d => d.id !== action.payload) };
    case 'SET_PERSONA': return { ...state, selectedPersonaId: action.payload };
    case 'SET_CONTENT_TYPE': return { ...state, selectedContentType: action.payload };
    case 'LOAD_CAMPAIGN': return { ...state, activeCampaignId: action.payload.id, brief: { ...state.brief, ...action.payload.briefScaffold }, selectedPersonaId: action.payload.suggestedPersona || state.selectedPersonaId, activeTab: 'demo' };
    case 'SAVE_PROJECT': return { ...state, savedProjects: [...(state.savedProjects || []), action.payload] };
    case 'REMOVE_PROJECT': return { ...state, savedProjects: (state.savedProjects || []).filter(p => p.id !== action.payload) };
    case 'UPDATE_PROJECT': return { ...state, savedProjects: (state.savedProjects || []).map(p => p.id === action.payload.id ? { ...p, ...action.payload.updates } : p) };
    case 'ADD_CUSTOM_TEMPLATE': {
      const existingIdx = (state.customTemplates || []).findIndex(t => t.id === action.payload.id);
      if (existingIdx >= 0) {
        const updated = [...state.customTemplates];
        updated[existingIdx] = action.payload;
        return { ...state, customTemplates: updated };
      }
      return { ...state, customTemplates: [...(state.customTemplates || []), action.payload] };
    }
    case 'REMOVE_CUSTOM_TEMPLATE': return { ...state, customTemplates: (state.customTemplates || []).filter(t => t.id !== action.payload) };
    case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, { id: Date.now(), ...action.payload }] };
    case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'SET_PLAN': return { ...state, currentPlan: action.payload };
    case 'TOGGLE_MODAL': return { ...state, modals: { ...state.modals, [action.payload]: !state.modals[action.payload] } };
    default: return state;
  }
}

// ==========================================
// 5. STYLISTYKA QUICKPOSTS (Z Trybem Ciemnym)
// ==========================================
const styles = `
:root {
  --bg-app: #fafafa; --bg-surface: #ffffff; --bg-subtle: #f4f4f5; 
  --text-main: #09090b; --text-muted: #52525b; --text-light: #a1a1aa; 
  --primary: #f43f5e; --primary-hover: #e11d48; --gradient-primary: linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%); 
  --success: #10b981; --danger: #ef4444; --border: #e4e4e7; 
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05); --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); --shadow-lg: 0 20px 40px -15px rgba(0, 0, 0, 0.08); 
  --radius-md: 12px; --radius-lg: 16px; --radius-xl: 24px; --radius-full: 9999px; 
  --transition: transform 0.4s ease, box-shadow 0.4s ease, opacity 0.4s ease, border-color 0.4s ease, background-color 0.4s ease, color 0.4s ease; 
  --brand-fb: #1877F2; --brand-ig: #E1306C; --brand-in: #0A66C2; --brand-web: #0ea5e9; --brand-news: #8b5cf6;
}
[data-theme="dark"] { --bg-app: #09090b; --bg-surface: #121214; --bg-subtle: #1c1c1f; --text-main: #f4f4f5; --text-muted: #a1a1aa; --border: #27272a; }
* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, sans-serif; }
html, body, #root { width: 100%; min-height: 100vh; margin: 0; padding: 0; background-color: var(--bg-app); }
#root { display: flex; flex-direction: column; }
.global-theme-wrapper { flex: 1; display: flex; flex-direction: column; min-height: 100vh; width: 100%; overflow-x: hidden; background-color: var(--bg-app); color: var(--text-main); transition: var(--transition); }

.topbar { position: sticky; top: 0; z-index: 9999; background: var(--bg-surface); border-bottom: 1px solid var(--border); padding: 0.5rem 1.5rem; display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 1rem; transition: var(--transition); }
.topbar-brand { display: flex; align-items: center; gap: 0.75rem; font-weight: 800; font-size: 1.5rem; letter-spacing: -0.5px; white-space: nowrap; }
.topbar-tabs { display: flex; gap: 0.25rem; flex: 1; flex-wrap: wrap; align-items: center; }

.tab-btn { padding: 0.35rem 0.85rem; border-radius: var(--radius-full); font-size: 0.85rem; font-weight: 600; color: var(--text-muted); background: transparent; border: none; cursor: pointer; transition: var(--transition); display: inline-flex; align-items: center; justify-content: center; position: relative; }
.tab-btn::after { content: ''; position: absolute; top: -10px; bottom: -10px; left: -10px; right: -10px; z-index: 1; }
.tab-btn:hover { color: var(--text-main); background: var(--bg-subtle); }
.tab-btn.active { color: var(--primary); background: rgba(244, 63, 94, 0.1); }

.hamburger-btn { background: transparent; border: none; cursor: pointer; padding: 0.5rem; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); transition: var(--transition); color: var(--text-main); position: relative; }
.hamburger-btn::after { content: ''; position: absolute; top: -15px; bottom: -15px; left: -15px; right: -15px; z-index: 1; }
.hamburger-btn:hover { background: var(--bg-subtle); }

.dropdown-menu { position: absolute; top: calc(100% + 0.5rem); right: 0; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); min-width: 200px; z-index: 10000; display: flex; flex-direction: column; padding: 0.5rem 0; transform-origin: top right; animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); transition: var(--transition); }
.dropdown-item { padding: 0.75rem 1.25rem; text-align: left; background: transparent; border: none; cursor: pointer; font-size: 0.95rem; font-weight: 600; color: var(--text-main); transition: var(--transition); display: flex; align-items: center; gap: 0.5rem; }
.dropdown-item:hover { background: var(--bg-subtle); color: var(--primary); }
.dropdown-item.text-danger { color: var(--danger); }
.dropdown-item.text-danger:hover { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
.dropdown-divider { height: 1px; background: var(--border); margin: 0.25rem 0; transition: var(--transition); }

.main-container { flex: 1; padding: 0 1.5rem 4rem; max-width: 1400px; margin: 0 auto; width: 100%; position: relative; z-index: 10; }
.hero-section { text-align: center; padding: 4rem 1rem 3rem; max-width: 900px; margin: 0 auto; transition: var(--transition); }
.hero-title { font-size: 3.5rem; font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; color: var(--text-main); margin-bottom: 1rem; transition: var(--transition); }
.hero-subtitle { font-size: 1.15rem; color: var(--text-muted); line-height: 1.6; max-width: 700px; margin: 0 auto; transition: var(--transition); }
.card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); transition: var(--transition); }
.card-header { padding: 1.25rem 1.5rem 0.5rem; display: flex; align-items: baseline; gap: 0.75rem; transition: var(--transition); }
.step-number { font-size: 1.25rem; font-weight: 800; color: var(--border); transition: var(--transition); }
.card-title { font-size: 1.25rem; font-weight: 700; color: var(--text-main); letter-spacing: -0.5px; transition: var(--transition); }
.card-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; transition: var(--transition); }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-label { font-size: 0.95rem; font-weight: 600; color: var(--text-main); display: flex; justify-content: space-between; transition: var(--transition); }
.form-input, .form-select, .form-textarea { width: 100%; padding: 0.85rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 1rem; color: var(--text-main); background: var(--bg-subtle); outline: none; transition: var(--transition); resize: none; }
.form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.15); background: var(--bg-surface); }
.form-textarea { min-height: 120px; font-size: 1.05rem; }
.grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: var(--radius-full); font-size: 1rem; font-weight: 700; cursor: pointer; transition: var(--transition); border: none; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
.btn-primary { background: var(--gradient-primary); color: white; box-shadow: var(--shadow-md); }
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px -10px rgba(244, 63, 94, 0.5); }
.btn-secondary { background: var(--bg-surface); color: var(--text-main); border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
.btn-secondary:hover:not(:disabled) { background: var(--bg-subtle); }
.btn-success { background: var(--success); color: white; }
.btn-lg { padding: 1.25rem 2rem; font-size: 1.125rem; width: 100%; }
.creator-layout { display: grid; grid-template-columns: 480px 1fr; gap: 3rem; align-items: start; }
@media (max-width: 1024px) { .creator-layout { grid-template-columns: 1fr; } }
.platform-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.platform-pill { display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-full); cursor: pointer; transition: var(--transition); background: var(--bg-surface); font-weight: 600; font-size: 0.85rem; color: var(--text-muted); }
.platform-pill:hover { border-color: var(--text-main); color: var(--text-main); }
.platform-pill.active { background: var(--text-main); color: var(--bg-surface); border-color: var(--text-main); }
.platform-pill input { display: none; }
.eu-box { background: rgba(14, 165, 233, 0.05); border: 1px dashed rgba(14, 165, 233, 0.3); border-radius: var(--radius-lg); padding: 1.25rem; transition: var(--transition); }
.eu-box h4 { color: #0369a1; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem; transition: var(--transition); }
.results-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; border: 2px dashed var(--border); border-radius: var(--radius-xl); color: var(--text-muted); text-align: center; height: 100%; background: var(--bg-surface); transition: var(--transition); }
.results-empty h3 { font-size: 1.5rem; color: var(--text-main); margin: 1rem 0 0.5rem; font-weight: 700; letter-spacing: -0.5px; transition: var(--transition); }
.content-workflow-title { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text-muted); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; transition: var(--transition); }
.content-workflow-title::after { content: ""; flex: 1; height: 1px; background: var(--border); transition: var(--transition); }
.result-post-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); margin-bottom: 2rem; overflow: hidden; box-shadow: var(--shadow-lg); transition: var(--transition); }
.result-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; background: var(--bg-subtle); transition: var(--transition); }
.result-platform-badge { display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 800; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; transition: var(--transition); }
.result-body { padding: 2rem 1.5rem; transition: var(--transition); }
.result-textarea { width: 100%; border: none; resize: none; min-height: 300px; font-size: 1.05rem; line-height: 1.6; outline: none; background: transparent; padding: 0; color: var(--text-main); margin-bottom: 1.5rem; transition: var(--transition); }
.result-meta-box { background: var(--bg-subtle); border-radius: var(--radius-md); padding: 1.25rem; border: 1px solid var(--border); transition: var(--transition); }
.result-actions { padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); display: flex; gap: 1rem; align-items: center; justify-content: space-between; background: var(--bg-surface); transition: var(--transition); }
.credits-pill { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(244, 63, 94, 0.1); color: var(--primary); padding: 0.2rem 0.75rem; border-radius: var(--radius-full); font-weight: 700; font-size: 0.8rem; letter-spacing: 0.5px; transition: var(--transition); }
.spinner { width: 1.25rem; height: 1.25rem; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.toast-wrapper { position: fixed; bottom: 2rem; left: 2rem; z-index: 10000; display: flex; flex-direction: column; gap: 1rem; pointer-events: none; }
.toast { padding: 1rem 1.5rem; border-radius: var(--radius-full); font-weight: 600; font-size: 0.95rem; color: white; box-shadow: var(--shadow-lg); animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); display: flex; align-items: center; gap: 0.75rem; pointer-events: auto; }
.toast.success { background: var(--success); }
.toast.error { background: var(--danger); }
@keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
.page-header { text-align: center; margin-bottom: 3rem; padding: 3rem 0 1rem; transition: var(--transition); }
.page-title { font-size: 3rem; font-weight: 800; color: var(--text-main); margin-bottom: 1rem; letter-spacing: -1px; transition: var(--transition); }
.page-subtitle { color: var(--text-muted); font-size: 1.15rem; max-width: 600px; margin: 0 auto; transition: var(--transition); }
.content-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; align-items: stretch; }

/* Kalendarz Siatkowy */
.calendar-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding: 0 0.5rem; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; }
.calendar-day-header { text-align: center; font-weight: 700; color: var(--text-muted); font-size: 0.85rem; padding-bottom: 0.5rem; text-transform: uppercase; }
.calendar-day { aspect-ratio: 1; border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 0.2rem; cursor: pointer; transition: var(--transition); background: var(--bg-surface); position: relative; }
.calendar-day:hover { border-color: var(--text-muted); }
.calendar-day.selected { border-color: var(--primary); background: rgba(244, 63, 94, 0.05); }
.calendar-day.empty { background: transparent; border: none; cursor: default; }
.calendar-day-number { font-weight: 600; font-size: 0.9rem; margin-bottom: 0.2rem; }
.calendar-day-dots { display: flex; flex-direction: column; gap: 3px; align-items: center; width: 100%; }
.calendar-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--primary); }

/* Ekran logowania */
.login-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-app); padding: 1.5rem; animation: popIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); transition: var(--transition); }
.login-card { width: 100%; max-width: 440px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-lg); text-align: center; transition: var(--transition); }
.login-logo { font-size: 2.5rem; font-weight: 900; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.5rem; letter-spacing: -1px; line-height: 1.2; padding: 0.1em; }
.login-subtitle { color: var(--text-muted); margin-bottom: 2rem; font-size: 1.05rem; transition: var(--transition); }
.login-form { text-align: left; display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
.login-input-group { display: flex; flex-direction: column; gap: 0.25rem; }
.login-input-group label { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); transition: var(--transition); }
.login-input-group input { width: 100%; padding: 0.85rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 1rem; background: var(--bg-subtle); color: var(--text-main); outline: none; transition: var(--transition); }
.login-input-group input:focus { border-color: var(--primary); background: var(--bg-surface); box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.15); }
.social-btn { display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; padding: 0.875rem; margin-bottom: 0.75rem; border-radius: var(--radius-full); border: 1px solid var(--border); background: var(--bg-surface); font-weight: 600; font-size: 1rem; color: var(--text-main); cursor: pointer; box-shadow: var(--shadow-sm); transition: var(--transition); }
.social-btn:hover { background: var(--bg-subtle); transform: translateY(-1px); box-shadow: var(--shadow-md); }
.social-btn svg { width: 20px; height: 20px; }
.login-divider { display: flex; align-items: center; margin: 1.5rem 0; color: var(--text-light); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; transition: var(--transition); }
.login-divider::before, .login-divider::after { content: ''; flex: 1; border-bottom: 1px solid var(--border); transition: var(--transition); }
.login-divider::before { margin-right: 1rem; } .login-divider::after { margin-left: 1rem; }
.login-footer { margin-top: 1.5rem; font-size: 0.95rem; color: var(--text-muted); transition: var(--transition); }
.login-footer a { color: var(--primary); font-weight: 600; cursor: pointer; text-decoration: none; }
.login-footer a:hover { text-decoration: underline; }
@keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.switch-wrap { display: flex; align-items: center; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid var(--border); transition: var(--transition); }
.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border); transition: .3s; border-radius: 24px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: var(--bg-surface); transition: .3s; border-radius: 50%; box-shadow: var(--shadow-sm); }
input:checked + .slider { background-color: var(--primary); }
input:checked + .slider:before { transform: translateX(20px); }

/* Modals */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 99999; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s ease; }
.modal-content { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); width: 90%; max-width: 600px; max-height: 85vh; overflow-y: auto; padding: 2rem; box-shadow: var(--shadow-lg); animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.modal-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-main); letter-spacing: -0.5px; }

/* Bot AI (FAB) */
.bot-fab { position: fixed; bottom: 2rem; right: 2rem; width: 70px; height: 70px; border-radius: 50%; background: var(--gradient-primary); color: white; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-lg); cursor: pointer; z-index: 999; animation: botPulse 2.5s infinite ease-in-out; transition: var(--transition); }
.bot-fab:hover { transform: scale(1.05); }
.bot-window { position: fixed; bottom: 6rem; right: 2rem; width: 350px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow-lg); z-index: 1000; display: flex; flex-direction: column; overflow: hidden; transform-origin: bottom right; animation: popIn 0.3s ease; }
.bot-header { background: var(--bg-subtle); padding: 1rem; border-bottom: 1px solid var(--border); font-weight: 700; color: var(--text-main); display: flex; justify-content: space-between; align-items: center; }
.bot-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; max-height: 350px; overflow-y: auto; }
.bot-msg { padding: 0.75rem 1rem; border-radius: var(--radius-lg); font-size: 0.9rem; max-width: 85%; line-height: 1.5; }
.bot-msg.user { background: var(--primary); color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
.bot-msg.bot { background: var(--bg-surface); border: 1px solid var(--border); color: var(--text-main); align-self: flex-start; border-bottom-left-radius: 4px; box-shadow: var(--shadow-sm); }
.bot-input-area { display: flex; padding: 0.75rem; border-top: 1px solid var(--border); gap: 0.5rem; background: var(--bg-surface); }
@keyframes botPulse { 0%, 100% { transform: scale(1); box-shadow: 0 10px 25px -5px rgba(244, 63, 94, 0.4); } 50% { transform: scale(1.1); box-shadow: 0 15px 35px -5px rgba(244, 63, 94, 0.7); } }

/* NOWA ANIMACJA STARTOWA Z POSTMAKER 3D */
.splash-screen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: var(--bg-app); z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity 0.5s ease; }
.splash-screen.fade-out { opacity: 0; pointer-events: none; }
.splash-content-wrapper { position: relative; transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.splash-screen.show-btn .splash-content-wrapper { transform: translateY(-85px); }
.splash-anim-layer { position: relative; width: 340px; height: 200px; display: flex; justify-content: center; align-items: center; }
.splash-mailbox { position: absolute; top: 50%; left: 50%; width: 160px; height: 160px; transform: translate(-50%, -50%); z-index: 10; color: var(--primary); }
.splash-door { transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1); transform-style: preserve-3d; }
.step-1 .splash-door { transform: rotateX(-120deg); }
.step-2 .splash-door, .step-3 .splash-door { transform: rotateX(0deg); }
.splash-text { position: absolute; top: 50%; left: 50%; font-size: 5.5rem; font-weight: 900; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-top: 0; margin-left: 0; opacity: 0; transform: translate(-50%, -50%) scale(0.2); transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); z-index: 5; line-height: 1; letter-spacing: -2px; }
.step-1 .splash-text, .step-2 .splash-text, .step-3 .splash-text { opacity: 1; z-index: 20; transform: translate(-50%, -205px) scale(1); }

.splash-tile { position: absolute; width: 72px; height: 72px; background: var(--bg-surface); border-radius: 18px; box-shadow: var(--shadow-md); display: flex; align-items: center; justify-content: center; opacity: 0; z-index: 4; top: 50%; left: 50%; margin-top: -36px; margin-left: -36px; transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid var(--border); transform: scale(0.5); }
.splash-tile svg { width: 38px; height: 38px; }
.splash-tile.fb { color: var(--brand-fb); } 
.splash-tile.ig { color: var(--brand-ig); } 
.splash-tile.in { color: var(--brand-in); } 
.splash-tile.newsletter { color: var(--brand-news); } 
.splash-tile.tiktok { color: #ff0050; }

.step-1 .splash-tile, .step-2 .splash-tile, .step-3 .splash-tile { opacity: 1; z-index: 15; }
.step-1 .splash-tile.fb, .step-2 .splash-tile.fb, .step-3 .splash-tile.fb { transform: translate(-210px, 90px) rotate(-10deg) scale(1); }
.step-1 .splash-tile.ig, .step-2 .splash-tile.ig, .step-3 .splash-tile.ig { transform: translate(-105px, 150px) rotate(-5deg) scale(1); }
.step-1 .splash-tile.in, .step-2 .splash-tile.in, .step-3 .splash-tile.in { transform: translate(0px, 170px) rotate(0deg) scale(1); }
.step-1 .splash-tile.newsletter, .step-2 .splash-tile.newsletter, .step-3 .splash-tile.newsletter { transform: translate(105px, 150px) rotate(5deg) scale(1); }
.step-1 .splash-tile.tiktok, .step-2 .splash-tile.tiktok, .step-3 .splash-tile.tiktok { transform: translate(210px, 90px) rotate(10deg) scale(1); }

.splash-action { position: absolute; bottom: 12%; opacity: 0; transform: translateY(20px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); z-index: 50; }
.splash-screen.show-btn .splash-action { opacity: 1; transform: translateY(0); }
`;

// ==========================================
// 6. KOMPONENTY UI
// ==========================================
const Toast = () => {
  const { state, dispatch } = useContext(AppContext);
  useEffect(() => {
    if (state.toasts.length > 0) {
      const timers = state.toasts.map(t => setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: t.id }), 3000));
      return () => timers.forEach(clearTimeout);
    }
  }, [state.toasts, dispatch]);
  return (
    <div className="toast-wrapper">
      {state.toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.type === 'success' ? '✓' : '⚠️'} {t.message}</div>
      ))}
    </div>
  );
};

const AIAssistantBot = () => {
  const { state } = useContext(AppContext);
  const t = (k) => translations[state.language][k] || k;
  
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
     setMessages([{ text: t('botHello'), sender: 'bot' }]);
  }, [state.language]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { text: input, sender: 'user' }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { text: t('botWait'), sender: 'bot' }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {isOpen && (
        <div className="bot-window">
          <div className="bot-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MailboxIcon size={28} strokeWidth={4} />
              {t('appName')} AI
            </span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }} onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="bot-body">
            {messages.map((msg, i) => (
              <div key={i} className={`bot-msg ${msg.sender}`}>{msg.text}</div>
            ))}
            {isTyping && <div className="bot-msg bot" style={{ padding: '0.5rem 1rem' }}><span className="spinner" style={{ width: '15px', height: '15px', borderTopColor: 'var(--primary)', borderRightColor: 'var(--primary)', borderBottomColor: 'var(--primary)', opacity: 0.5 }}></span></div>}
          </div>
          <div className="bot-input-area">
            <input type="text" className="form-input" placeholder={t('askQ')} style={{ padding: '0.5rem', flex: 1 }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={handleSend}>{t('send')}</button>
          </div>
        </div>
      )}
      <div className="bot-fab" onClick={() => setIsOpen(!isOpen)}>
        {/* Logo przy Bocie otrzymuje specjalną czarną obwódkę */}
        <MailboxIcon size={46} strokeWidth={4} withOutline={true} />
      </div>
    </>
  );
};

const ResultCard = ({ platform, variant }) => {
  const { state, dispatch } = useContext(AppContext);
  const t = (k) => translations[state.language][k] || k;
  
  const img = state.generatedImages[platform];
  const video = state.generatedVideos[platform];
  const isGenImg = state.generatingImages[platform];
  const isGenVideo = state.generatingVideos[platform];
  const [content, setContent] = useState(variant.content);
  
  const handleGenerateImage = async () => {
    dispatch({ type: 'SET_GENERATING_IMAGE', payload: { platform, value: true } });
    try {
      const b64 = await generateImage(variant.imagePrompts?.[0] || "abstract art");
      dispatch({ type: 'SET_GENERATED_IMAGE', payload: { platform, image: b64 } });
    } catch (err) {
      dispatch({ type: 'ADD_TOAST', payload: { type: 'error', message: t('toastImgError') } });
      dispatch({ type: 'SET_GENERATING_IMAGE', payload: { platform, value: false } });
    }
  };

  const handleGenerateVideo = () => {
    dispatch({ type: 'SET_GENERATING_VIDEO', payload: { platform, value: true } });
    // AI Video generation mock (z wykorzystaniem overlay'u tekstowego do urealnienia)
    const videoPrompt = variant.imagePrompts?.[0] || state.brief.mainTopic || 'AI generated scene';
    
    setTimeout(() => {
      dispatch({ 
        type: 'SET_GENERATED_VIDEO', 
        payload: { 
          platform, 
          video: {
            src: "https://www.w3schools.com/html/mov_bbb.mp4", 
            text: variant.title || 'Nowa Kampania',
            prompt: videoPrompt
          }
        } 
      });
      dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastVidSuccess') } });
    }, 4500); 
  };

  return (
    <div className="result-post-card">
      <div className="result-header">
        <span className="result-platform-badge" style={{ color: '#fff', backgroundColor: PLATFORM_ICONS[platform]?.color || 'var(--primary)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)' }}>
          <span style={{width:'18px', height:'18px', display: 'inline-block'}}>{SVG_ICONS[platform]}</span>
          {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </span>
        <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
          <input type="datetime-local" className="form-input" id={`date-${platform}`} style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} />
          <button className="btn btn-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem', backgroundColor: PLATFORM_ICONS[platform]?.color || 'var(--primary)', borderColor: PLATFORM_ICONS[platform]?.color || 'var(--primary)' }} onClick={() => {
              const dt = document.getElementById(`date-${platform}`).value;
              if(!dt) return dispatch({ type: 'ADD_TOAST', payload: { type: 'error', message: t('toastDateSelect') } });
              
              if (!state.userProfile.connectedPlatforms[platform]) {
                  return dispatch({ type: 'SET_AUTH_MODAL', payload: platform });
              }

              const [date, time] = dt.split('T');
              dispatch({ type: 'SCHEDULE_POST', payload: { id: Date.now(), platform, date, time, content, image: img, video, topic: state.brief.mainTopic || t('noTitleDraft') } });
              dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastScheduled') + "1" } });
          }}>{t('scheduleSingle')}</button>
          
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }} onClick={() => {
              dispatch({ type: 'SAVE_DRAFT', payload: { id: Date.now(), title: state.brief.mainTopic || t('noTitleDraft'), brief: state.brief, platforms: state.platforms, content: state.generatedContent, date: new Date().toLocaleDateString() } });
              dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastDraftSaved') } });
          }}>{t('saveDraft')}</button>
        </div>
      </div>
      
      <div className="result-body">
        <textarea 
          className="result-textarea" 
          value={content} 
          onChange={e => setContent(e.target.value)}
        />
        
        <div className="result-meta-box" style={{ background: 'transparent', padding: 0, border: 'none' }}>
          {!img && !video && !isGenVideo && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <input type="file" id={`file-${platform}`} style={{ display: 'none' }} accept="image/*,video/*" onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  if (file.type.startsWith('video/')) dispatch({ type: 'SET_GENERATED_VIDEO', payload: { platform, video: { src: url, text: '', prompt: 'Uploaded file' } } });
                  else dispatch({ type: 'SET_GENERATED_IMAGE', payload: { platform, image: url } });
                }
              }} />
              <button className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }} onClick={() => document.getElementById(`file-${platform}`).click()}>
                {t('uploadDisk')}
              </button>
              <button className="btn btn-secondary" onClick={handleGenerateImage} disabled={isGenImg} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', borderColor: 'var(--primary)', color: 'var(--primary)', background: 'rgba(244, 63, 94, 0.05)' }}>
                {isGenImg ? <><span className="spinner"></span> {t('generatingBtn')}</> : t('genImg')}
              </button>
              <button className="btn btn-secondary" onClick={handleGenerateVideo} disabled={isGenImg} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', borderColor: '#8b5cf6', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.05)' }}>
                {t('genVid')}
              </button>
            </div>
          )}

          {isGenVideo && (
             <div style={{ width: '100%', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <div style={{ width: '15px', height: '15px', background: '#8b5cf6', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
                   <div style={{ width: '15px', height: '15px', background: '#8b5cf6', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }}></div>
                   <div style={{ width: '15px', height: '15px', background: '#8b5cf6', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }}></div>
                </div>
                <strong style={{ color: 'var(--text-main)' }}>{t('soraRender')}</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('soraWait')}</span>
             </div>
          )}
          
          {(img || video) && (
            <div style={{position: 'relative', marginTop: '1rem'}}>
              {video ? (
                 <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
                   <video src={video.src || video} controls autoPlay loop muted style={{ width: '100%', display: 'block', filter: 'brightness(0.65)' }} />
                   {video.text && (
                     <div style={{ position: 'absolute', bottom: '3rem', left: '1.5rem', right: '1.5rem', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>{video.text}</h4>
                        <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.9 }}>AI Scene: {video.prompt}</p>
                     </div>
                   )}
                 </div>
              ) : (
                 <img src={img} alt="Wygenerowane AI" style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
              )}
              <button className="btn btn-secondary" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.2rem 0.6rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.9)', border: 'none', color: '#333', zIndex: 10 }} onClick={() => { dispatch({ type: 'SET_GENERATED_IMAGE', payload: { platform, image: null } }); dispatch({ type: 'SET_GENERATED_VIDEO', payload: { platform, video: null } }); }}>
                {t('removeFile')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- GŁÓWNY KREATOR (DemoPanel) ---
const DemoPanel = () => {
  const { state, dispatch } = useContext(AppContext);
  const t = (k) => translations[state.language][k] || k;
  
  const { brief, websiteUrl, websiteLoading, platforms, isGenerating, selectedPersonaId, selectedContentType } = state;
  const personas = useMemo(() => loadCollection('personas', seedPersonas), []);

  const handleBriefChange = (e) => dispatch({ type: 'UPDATE_BRIEF', payload: { [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } });
  
  const handleScrape = async () => {
    if (!websiteUrl) return;
    dispatch({ type: 'SET_WEBSITE_LOADING', payload: true });
    try {
      const content = await scrapeWebsite(websiteUrl);
      const newContext = `\n\n--- ŹRÓDŁO: ${websiteUrl} ---\n${content}`;
      dispatch({ type: 'SET_WEBSITE_CONTENT', payload: (state.websiteContent || '') + newContext });
      dispatch({ type: 'ADD_ATTACHED_LINK', payload: websiteUrl });
      dispatch({ type: 'SET_WEBSITE_URL', payload: '' });
      dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastLinkAdded') } });
    } catch (e) {
      dispatch({ type: 'SET_WEBSITE_LOADING', payload: false });
      dispatch({ type: 'ADD_TOAST', payload: { type: 'error', message: e.message } });
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      let appendedContent = '';
      files.forEach(file => {
        dispatch({ type: 'ADD_ATTACHED_FILE', payload: file.name });
        appendedContent += `\n\n--- PLIK: ${file.name} ---\n[Treść pliku załączonego przez użytkownika do analizy]`;
      });
      dispatch({ type: 'SET_WEBSITE_CONTENT', payload: (state.websiteContent || '') + appendedContent });
      dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastFilesAdded') + files.length } });
    }
    e.target.value = null;
  };

  const handleGenerate = async () => {
    const activePlatformsCount = Object.values(platforms).filter(Boolean).length;
    const cost = activePlatformsCount * 5;
    
    if (activePlatformsCount === 0) return dispatch({ type: 'ADD_TOAST', payload: { type: 'error', message: t('toastSelectPlatform') } });
    if (state.credits !== Infinity && state.credits < cost) return dispatch({ type: 'ADD_TOAST', payload: { type: 'error', message: t('toastNoCredits') + cost + t('toastCreditsHave') + state.credits + '.' } });
    
    dispatch({ type: 'SET_GENERATING', payload: true });
    try {
      const result = await generateContent({
        brief, platforms, websiteContent: state.websiteContent, euSettings: state.euSettings,
        persona: personas.find(p => p.id === selectedPersonaId), contentType: selectedContentType,
        language: state.language
      });
      dispatch({ type: 'SET_GENERATED_CONTENT', payload: result });
      dispatch({ type: 'USE_CREDIT', payload: cost });
      dispatch({ type: 'SAVE_PROJECT', payload: { id: Date.now(), date: new Date().toLocaleDateString(), brief: state.brief, content: result } });
      dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastGenerated') } });
    } catch (err) {
      dispatch({ type: 'SET_GENERATING', payload: false });
      dispatch({ type: 'ADD_TOAST', payload: { type: 'error', message: err.message || 'Error generating content' } });
    }
  };

  const isBriefValid = (brief.mainTopic || '').trim().length > 0 && (brief.message || '').trim().length > 0 && Object.values(platforms).some(v => v);

  return (
    <>
      <div className="hero-section">
        <h1 className="hero-title">{t('creatorTitle')}</h1>
        <p className="hero-subtitle">{t('creatorSubtitle')}</p>
      </div>

      <div className="creator-layout">
        <div className="creator-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                <span className="step-number">01</span><h3 className="card-title">{t('step1')}</h3>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }} onClick={() => {
                if(!brief.mainTopic || !brief.message || !brief.audience || !brief.tone) {
                  return dispatch({ type: 'ADD_TOAST', payload: { type: 'error', message: t('toastFillTpl') } });
                }
                
                // Inteligentne szukanie emotikony
                const searchTxt = brief.mainTopic.toLowerCase() + " " + brief.message.toLowerCase();
                let emoji = '📋';
                if(searchTxt.match(/święt|boż|wigil|christ|holid/)) emoji = '🎄';
                else if(searchTxt.match(/miłośc|walentyn|serc|love|valen/)) emoji = '💝';
                else if(searchTxt.match(/zdrow|medyc|szpital|health|med/)) emoji = '🏥';
                else if(searchTxt.match(/biznes|raport|finans|busin|repo/)) emoji = '📊';
                else if(searchTxt.match(/edukacj|szkoł|uczeln|edu|school/)) emoji = '🎓';
                else if(searchTxt.match(/ekolog|ziem|natu|roślin|eco|earth/)) emoji = '🌍';
                else if(searchTxt.match(/sport|zawod|turniej/)) emoji = '🏆';
                else if(searchTxt.match(/muzyk|koncert|festiwal|music|fest/)) emoji = '🎵';
                else if(searchTxt.match(/technologi|programo|it|komputer|tech/)) emoji = '💻';
                else if(searchTxt.match(/dzieci|przedszkol|child/)) emoji = '🧸';
                else if(searchTxt.match(/pomoc|zbiórk|charytatywn|help|charity/)) emoji = '🤝';
                else {
                   const rand = ['💡','🚀','🎯','✨','📌','🔥','🌟','📢','📣','💬'];
                   emoji = rand[Math.floor(Math.random()*rand.length)];
                }

                dispatch({ type: 'ADD_CUSTOM_TEMPLATE', payload: { id: 'cust-'+Date.now(), name: brief.mainTopic, theme: brief.message, date: new Date().toLocaleDateString(), icon: emoji, briefScaffold: { ...brief } } });
                dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastTplAdded') } });
              }}>{t('addToTpl')}</button>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">{t('mainTopic')}</label>
                <input type="text" name="mainTopic" className="form-input" placeholder={t('mainTopicPlh')} value={brief.mainTopic || ''} onChange={handleBriefChange} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('desc')}</label>
                <textarea name="message" className="form-textarea" placeholder={t('descPlh')} value={brief.message} onChange={handleBriefChange} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('audience')}</label>
                <input type="text" name="audience" className="form-input" placeholder={t('audiencePlh')} value={brief.audience || ''} onChange={handleBriefChange} />
              </div>
              
              <div className="form-group">
                <label className="form-label">{t('tone')}</label>
                <select name="tone" className="form-select" value={brief.tone} onChange={handleBriefChange}>
                  <option value="formalny">{t('toneFormal')}</option>
                  <option value="nieformalny">{t('toneInformal')}</option>
                  <option value="niestandardowy">{t('toneCustom')}</option>
                </select>
              </div>
              
              {brief.tone === 'niestandardowy' && (
                <div className="form-group" style={{ animation: 'popIn 0.3s ease' }}>
                  <label className="form-label" style={{ color: 'var(--primary)' }}>{t('customToneLabel')}</label>
                  <input type="text" name="customTone" className="form-input" placeholder={t('customTonePlh')} value={brief.customTone || ''} onChange={handleBriefChange} style={{ borderColor: 'var(--primary)', boxShadow: '0 0 0 3px rgba(244, 63, 94, 0.1)' }} />
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label">{t('knowledgeBase')}</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder={t('linkPlh')} 
                    value={websiteUrl} 
                    onChange={e => dispatch({ type: 'SET_WEBSITE_URL', payload: e.target.value })} 
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleScrape();
                      }
                    }}
                    disabled={websiteLoading}
                  />
                  <input 
                    type="file" 
                    id="file-upload" 
                    multiple 
                    style={{ display: 'none' }} 
                    onChange={handleFileUpload} 
                  />
                  <button className="btn btn-secondary" style={{ borderRadius: 'var(--radius-md)', padding: '0 1.5rem', whiteSpace: 'nowrap' }} onClick={() => document.getElementById('file-upload').click()}>{t('filesBtn')}</button>
                </div>
                {websiteLoading && <span style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.25rem' }}>{t('fetchingLink')}</span>}
                
                {(state.attachedLinks?.length > 0 || state.attachedFiles?.length > 0) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {state.attachedLinks?.map((link, i) => (
                      <span key={`link-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', background: 'var(--bg-subtle)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
                        🔗 {link.replace(/^https?:\/\//, '').substring(0, 25)}{link.length > 25 ? '...' : ''}
                        <button onClick={() => dispatch({type: 'REMOVE_ATTACHED_LINK', payload: link})} style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize: '1rem', lineHeight: 1}}>&times;</button>
                      </span>
                    ))}
                    {state.attachedFiles?.map((file, i) => (
                      <span key={`file-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', background: 'var(--bg-subtle)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
                        📄 {file.substring(0, 25)}{file.length > 25 ? '...' : ''}
                        <button onClick={() => dispatch({type: 'REMOVE_ATTACHED_FILE', payload: file})} style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize: '1rem', lineHeight: 1}}>&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="step-number">02</span><h3 className="card-title">{t('step2')}</h3></div>
            <div className="card-body">
              <div className="platform-grid">
                {Object.keys(platforms).map(p => (
                  <label key={p} className={`platform-pill ${platforms[p] ? 'active' : ''}`} style={platforms[p] ? { backgroundColor: PLATFORM_ICONS[p]?.color, borderColor: PLATFORM_ICONS[p]?.color, color: '#fff' } : {}}>
                    <input type="checkbox" checked={platforms[p]} onChange={() => dispatch({ type: 'TOGGLE_PLATFORM', payload: p })} />
                    <span className="p-icon" style={{ color: platforms[p] ? '#fff' : PLATFORM_ICONS[p]?.color || 'var(--text-main)', display: 'flex', alignItems: 'center', width: '20px', height: '20px' }}>{SVG_ICONS[p]}</span>
                    <span>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={!isBriefValid || isGenerating}>
            {isGenerating ? <><span className="spinner"></span> {t('generatingBtn')}</> : t('generateBtn')}
          </button>
        </div>

        <div className="creator-results">
          {state.isGenerating ? (
            <div className="results-empty" style={{ alignItems: 'flex-start', padding: '2rem', justifyContent: 'flex-start' }}>
              <div className="content-workflow-title" style={{ width: '100%', marginBottom: '2rem' }}>{t('processingAi')}</div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-subtle)', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: '15px', width: '30%', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', marginBottom: '10px', animation: 'pulse 1.5s infinite 0.1s' }}></div>
                  <div style={{ height: '10px', width: '20%', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', animation: 'pulse 1.5s infinite 0.2s' }}></div>
                </div>
              </div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ height: '15px', width: '100%', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', animation: 'pulse 1.5s infinite 0.3s' }}></div>
                <div style={{ height: '15px', width: '90%', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', animation: 'pulse 1.5s infinite 0.4s' }}></div>
                <div style={{ height: '15px', width: '95%', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', animation: 'pulse 1.5s infinite 0.5s' }}></div>
                <div style={{ height: '150px', width: '100%', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginTop: '1rem', animation: 'pulse 1.5s infinite 0.6s' }}></div>
              </div>
              <style>{`@keyframes pulse { 0% { opacity: 0.7; } 50% { opacity: 0.3; } 100% { opacity: 0.7; } }`}</style>
            </div>
          ) : !state.generatedContent?.platforms ? (
            <div className="results-empty">
              <h3 style={{marginTop: '1rem'}}>{t('fillForm')}</h3>
              <p style={{fontSize: '1.05rem', maxWidth: '350px'}}>{t('fillFormSub')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="content-workflow-title">{t('workflowTitle')}</div>
              
              <div className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'none' }}>
                <div className="card-body" style={{ padding: '0.75rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                     <label className="form-label" style={{ margin: 0, fontSize: '0.85rem' }}>{t('planAll')}</label>
                     <input type="datetime-local" className="form-input" id="mass-date" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: 'var(--bg-surface)', minWidth: '200px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                     <button className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => {
                        const dt = document.getElementById('mass-date').value;
                        if(!dt) return dispatch({ type: 'ADD_TOAST', payload: { type: 'error', message: t('toastDateSelect') } });
                        const [date, time] = dt.split('T');
                        let count = 0;
                        Object.entries(state.generatedContent.platforms).forEach(([p, d]) => {
                           if(d.variants?.[0]) {
                              dispatch({ type: 'SCHEDULE_POST', payload: { id: Date.now() + count, platform: p, date, time, content: d.variants[0].content, image: state.generatedImages[p], video: state.generatedVideos[p], topic: brief.mainTopic || t('noTitleDraft') } });
                              count++;
                           }
                        });
                        dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastScheduled') + count } });
                     }}>{t('setForAll')}</button>
                  </div>
                </div>
              </div>

              {Object.entries(state.generatedContent.platforms).map(([platform, data]) => {
                const variant = data.variants?.[0];
                if (!variant) return null;
                return <ResultCard key={platform} platform={platform} variant={variant} />;
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// --- INNE WIDOKI ---
const LibraryView = () => {
  const { state, dispatch } = useContext(AppContext);
  const t = (k) => translations[state.language][k] || k;
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTpl, setNewTpl] = useState({ name: '', theme: '', icon: '⭐', date: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', theme: '', icon: '', date: '' });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEmojiPickerAdd, setShowEmojiPickerAdd] = useState(false);

  // W locie generujemy wbudowane kampanie (aby miały obsługę tłumaczeń, bez nadpisywania stanu w locie)
  const localizedSeedCampaigns = [
     { id: "camp-christmas", name: t('seedCamp1'), icon: "🎄", date: "12-24", theme: t('seedCamp1Desc'), suggestedPersona: "mass", briefScaffold: { goal: "", audience: "", message: t('seedCamp1Desc'), tone: "formalny" } },
     { id: "camp-valentines", name: t('seedCamp2'), icon: "💝", date: "02-14", theme: t('seedCamp2Desc'), suggestedPersona: "mass", briefScaffold: { goal: "", audience: "", message: t('seedCamp2Desc'), tone: "nieformalny" } },
     { id: "camp-world-health", name: t('seedCamp3'), icon: "🏥", date: "04-07", theme: t('seedCamp3Desc'), suggestedPersona: "mass", briefScaffold: { goal: "", audience: "", message: t('seedCamp3Desc'), tone: "nieformalny" } }
  ];

  const templates = localizedSeedCampaigns.map(seed => {
     const customOverride = (state.customTemplates || []).find(c => c.id === seed.id);
     return customOverride || seed;
  }).concat((state.customTemplates || []).filter(c => !localizedSeedCampaigns.some(s => s.id === c.id)));
  
  const filtered = templates.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.theme.toLowerCase().includes(search.toLowerCase()));

  const startEdit = (tpl) => {
     setEditingId(tpl.id);
     setEditForm({ name: tpl.name, theme: tpl.theme, icon: tpl.icon || '⭐', date: tpl.date || '' });
  };

  const saveEdit = (tpl) => {
     dispatch({ type: 'ADD_CUSTOM_TEMPLATE', payload: { ...tpl, name: editForm.name, theme: editForm.theme, icon: editForm.icon, date: editForm.date } });
     dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastTplUpdated') } });
     setEditingId(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('tplTitle')}</h1>
        <p className="page-subtitle">{t('tplSub')}</p>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <input type="text" className="form-input" placeholder={t('searchTpl')} value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '400px' }} />
        <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>{isAdding ? t('cancelAdd') : t('addCustomTpl')}</button>
      </div>

      {isAdding && (
         <div className="card" style={{ marginBottom: '2rem', border: '2px dashed var(--border)' }}>
            <div className="card-body grid-2">
               <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">{t('tplName')}</label>
                  <input type="text" className="form-input" value={newTpl.name} onChange={e => setNewTpl({...newTpl, name: e.target.value})} placeholder={t('tplNamePlh')} />
               </div>
               <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">{t('tplTheme')}</label>
                  <input type="text" className="form-input" value={newTpl.theme} onChange={e => setNewTpl({...newTpl, theme: e.target.value})} placeholder={t('tplThemePlh')} />
               </div>
               <div className="form-group">
                  <label className="form-label">{t('tplIcon')}</label>
                  <div style={{ position: 'relative', display: 'flex', gap: '0.5rem' }}>
                     <input type="text" className="form-input" value={newTpl.icon} onChange={e => setNewTpl({...newTpl, icon: e.target.value})} placeholder={t('tplIconPlh')} style={{ width: '80px', textAlign: 'center' }} />
                     <button className="btn btn-secondary" onClick={() => setShowEmojiPickerAdd(!showEmojiPickerAdd)}>{t('btnChoose')}</button>
                     {showEmojiPickerAdd && (
                        <div style={{ position: 'absolute', top: '100%', left: '0', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.25rem', zIndex: 1000, boxShadow: 'var(--shadow-md)', marginTop: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                           {ALL_EMOJIS.map((e, idx) => <div key={idx} style={{ cursor: 'pointer', fontSize: '1.5rem', padding: '0.25rem', textAlign: 'center' }} onClick={() => { setNewTpl({...newTpl, icon: e}); setShowEmojiPickerAdd(false); }}>{e}</div>)}
                        </div>
                     )}
                  </div>
               </div>
               <div className="form-group">
                  <label className="form-label">{t('tplDate')}</label>
                  <input type="text" className="form-input" value={newTpl.date} onChange={e => setNewTpl({...newTpl, date: e.target.value})} placeholder={t('tplDatePlh')} />
               </div>
               <div style={{ gridColumn: '1 / -1' }}>
                  <button className="btn btn-success" onClick={() => {
                     if(!newTpl.name) return;
                     dispatch({ type: 'ADD_CUSTOM_TEMPLATE', payload: { id: 'cust-'+Date.now(), name: newTpl.name, theme: newTpl.theme, icon: newTpl.icon || '⭐', date: newTpl.date || '', briefScaffold: { goal: '', audience: '', message: newTpl.theme, tone: 'formalny' } } });
                     setIsAdding(false);
                     setNewTpl({name: '', theme: '', icon: '⭐', date: ''});
                     dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastTplAdded') } });
                  }}>{t('saveLibrary')}</button>
               </div>
            </div>
         </div>
      )}

      <div className="content-grid">
        {filtered.map(c => {
           const isCustom = c.id.startsWith('cust-');
           return (
          <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-body" style={{ flex: 1, paddingBottom: '2rem' }}>
              {editingId === c.id ? (
                 <>
                    <div style={{ position: 'relative', display: 'flex', gap: '0.5rem', margin: '0.5rem 0 1rem 0' }}>
                       <input type="text" className="form-input" value={editForm.icon} onChange={e=>setEditForm({...editForm, icon:e.target.value})} style={{width: '60px', fontSize: '2rem', padding: '0.2rem', textAlign: 'center'}} />
                       <button className="btn btn-secondary" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>{t('btnChange')}</button>
                       {showEmojiPicker && (
                          <div style={{ position: 'absolute', top: '100%', left: '0', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.25rem', zIndex: 1000, boxShadow: 'var(--shadow-md)', marginTop: '0.2rem', maxHeight: '200px', overflowY: 'auto' }}>
                             {ALL_EMOJIS.map((e, idx) => <div key={idx} style={{ cursor: 'pointer', fontSize: '1.5rem', padding: '0.25rem', textAlign: 'center' }} onClick={() => { setEditForm({...editForm, icon: e}); setShowEmojiPicker(false); }}>{e}</div>)}
                          </div>
                       )}
                    </div>
                    <input type="text" className="form-input" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} style={{fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem'}} />
                    <input type="text" className="form-input" value={editForm.date} onChange={e=>setEditForm({...editForm, date:e.target.value})} placeholder={t('tplDate')} style={{marginBottom: '0.5rem'}} />
                    <textarea className="form-input" value={editForm.theme} onChange={e=>setEditForm({...editForm, theme:e.target.value})} rows="2" style={{resize: 'none'}} />
                    <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
                       <button className="btn btn-primary" style={{flex:1, padding: '0.3rem'}} onClick={()=>saveEdit(c)}>{t('save')}</button>
                       <button className="btn btn-secondary" style={{flex:1, padding: '0.3rem'}} onClick={()=>setEditingId(null)}>{t('cancel')}</button>
                    </div>
                 </>
              ) : (
                 <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '0.5rem 0 1.5rem 0' }}>
                       <div style={{ fontSize: '3.5rem', lineHeight: 1 }}>{c.icon || '⭐'}</div>
                       <div style={{display: 'flex', gap: '0.5rem'}}>
                          <button style={{background:'none', border:'none', cursor:'pointer', fontSize:'1rem', color:'var(--text-muted)'}} onClick={()=>startEdit(c)}>✏️</button>
                          {isCustom && <button style={{background:'none', border:'none', cursor:'pointer', fontSize:'1rem', color:'var(--danger)'}} onClick={()=>dispatch({type: 'REMOVE_CUSTOM_TEMPLATE', payload: c.id})}>✕</button>}
                       </div>
                    </div>
                    <h3 className="card-title" style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>{c.name}</h3>
                    <p style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('event')} {c.date || '-'}</p>
                    <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>{c.theme}</p>
                 </>
              )}
            </div>
            {!editingId && (
               <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
               <button className="btn btn-secondary" style={{ width: '100%', background: 'var(--bg-surface)' }} onClick={() => dispatch({ type: 'LOAD_CAMPAIGN', payload: c })}>
                 {t('openInCreator')}
               </button>
             </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
};

const CampaignsView = () => {
  const { state, dispatch } = useContext(AppContext);
  const t = (k) => translations[state.language][k] || k;
  const [sortBy, setSortBy] = useState('date-desc');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ mainTopic: '', message: '', tone: '', audience: '' });

  if (!state.savedProjects || state.savedProjects.length === 0) {
    return (
        <div className="results-empty" style={{ margin: '4rem auto', maxWidth: '800px', border: 'none', background: 'transparent' }}>
          <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>{t('noCampTitle')}</h2>
          <p style={{ maxWidth: '500px', margin: '0 auto', fontSize: '1.15rem', color: 'var(--text-muted)' }}>{t('noCampSub')}</p>
        </div>
    );
  }

  const sortedProjects = [...state.savedProjects].sort((a, b) => {
    if (sortBy === 'date-desc') return b.id - a.id;
    if (sortBy === 'date-asc') return a.id - b.id;
    if (sortBy === 'name-asc') return (a.brief?.mainTopic || '').localeCompare(b.brief?.mainTopic || '');
    if (sortBy === 'name-desc') return (b.brief?.mainTopic || '').localeCompare(a.brief?.mainTopic || '');
    return 0;
  });

  const startEdit = (proj) => {
    setEditingId(proj.id);
    setEditForm({ mainTopic: proj.brief.mainTopic || '', message: proj.brief.message || '', tone: proj.brief.tone || '', audience: proj.brief.audience || '' });
  };

  const saveEdit = (proj) => {
    dispatch({ 
      type: 'UPDATE_PROJECT', 
      payload: { 
        id: proj.id, 
        updates: { 
          brief: { ...proj.brief, mainTopic: editForm.mainTopic, message: editForm.message, tone: editForm.tone, audience: editForm.audience } 
        } 
      } 
    });
    setEditingId(null);
    dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastCampUpdated') } });
  };

  return (
    <div>
       <div className="page-header"><h1 className="page-title">{t('campTitle')}</h1><p className="page-subtitle">{t('campSub')}</p></div>
       
       <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
         <select className="form-input" style={{ width: 'auto', background: 'var(--bg-surface)' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
           <option value="date-desc">{t('sortNew')}</option>
           <option value="date-asc">{t('sortOld')}</option>
           <option value="name-asc">{t('sortAZ')}</option>
           <option value="name-desc">{t('sortZA')}</option>
         </select>
       </div>

       <div className="content-grid">
         {sortedProjects.map(proj => (
            <div key={proj.id} className="card">
               <div className="card-header" style={{justifyContent: 'space-between', alignItems: 'flex-start'}}>
                 {editingId === proj.id ? (
                   <div style={{flex: 1, marginRight: '1rem'}}>
                      <label style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{t('mainTopic')}</label>
                      <input type="text" className="form-input" value={editForm.mainTopic} onChange={e => setEditForm({...editForm, mainTopic: e.target.value})} style={{ padding: '0.4rem 0.75rem' }} />
                   </div>
                 ) : (
                   <h3 className="card-title">{proj.brief.mainTopic || t('noNameProject')}</h3>
                 )}
                 <span style={{fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap'}}>{proj.date}</span>
               </div>
               
               <div className="card-body" style={{paddingTop: 0}}>
                 {editingId === proj.id ? (
                   <>
                      <label style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block'}}>{t('desc')}</label>
                      <textarea className="form-input" value={editForm.message} onChange={e => setEditForm({...editForm, message: e.target.value})} rows="3" style={{ padding: '0.4rem 0.75rem', marginBottom: '0.5rem', resize: 'none' }} />
                      <div className="grid-2" style={{gap: '0.5rem'}}>
                         <div>
                            <label style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{t('tone')}</label>
                            <input type="text" className="form-input" value={editForm.tone} onChange={e => setEditForm({...editForm, tone: e.target.value})} style={{ padding: '0.4rem 0.75rem' }} />
                         </div>
                         <div>
                            <label style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{t('audience')}</label>
                            <input type="text" className="form-input" value={editForm.audience} onChange={e => setEditForm({...editForm, audience: e.target.value})} style={{ padding: '0.4rem 0.75rem' }} />
                         </div>
                      </div>
                   </>
                 ) : (
                   <>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem' }}>{proj.brief.message}</p>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-main)', background: 'var(--bg-subtle)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
                         <span><strong>{t('tone')}:</strong> {proj.brief.tone || '-'}</span>
                         <span><strong>{t('audience')}:</strong> {proj.brief.audience || '-'}</span>
                      </div>
                   </>
                 )}
                 
                 <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                    {editingId === proj.id ? (
                      <>
                        <button className="btn btn-primary" style={{ flex: 1, padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => saveEdit(proj)}>{t('saveChanges')}</button>
                        <button className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => setEditingId(null)}>{t('cancel')}</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-primary" style={{ flex: 1, padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => { 
                            dispatch({ type: 'LOAD_CAMPAIGN', payload: { id: proj.id, briefScaffold: proj.brief, suggestedPersona: proj.brief?.audience } });
                            dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastCampLoaded') } });
                        }}>{t('genFromGuidelines')}</button>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => startEdit(proj)}>{t('edit')}</button>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', color: 'var(--danger)' }} onClick={() => dispatch({ type: 'REMOVE_PROJECT', payload: proj.id })}>{t('delete')}</button>
                      </>
                    )}
                 </div>
               </div>
            </div>
         ))}
       </div>
    </div>
  );
};

const CalendarView = () => {
  const { state, dispatch } = useContext(AppContext);
  const t = (k) => translations[state.language][k] || k;
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedCampaigns, setExpandedCampaigns] = useState({});
  const [editingPost, setEditingPost] = useState(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [isGeneratingVid, setIsGeneratingVid] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const postsByDate = state.scheduledPosts.reduce((acc, post) => {
    if (!acc[post.date]) acc[post.date] = [];
    acc[post.date].push(post);
    return acc;
  }, {});

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const daysArray = [];
  for (let i = 0; i < startDayIndex; i++) daysArray.push(null);
  for (let i = 1; i <= daysInMonth; i++) daysArray.push(i);

  const formatDay = (d) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const selectedPosts = postsByDate[selectedDate] || [];
  const sortedSelectedPosts = [...selectedPosts].sort((a,b) => a.time.localeCompare(b.time));
  
  const postsByTopic = sortedSelectedPosts.reduce((acc, post) => {
    const topic = post.topic || 'Inne posty';
    if (!acc[topic]) acc[topic] = [];
    acc[topic].push(post);
    return acc;
  }, {});

  const getGroupedDots = (dayPosts) => {
     const topicsSet = new Set(dayPosts.map(p => p.topic || 'Inne'));
     const count = topicsSet.size;
     if (count === 0) return null;
     return (
        <div className="calendar-day-dots" style={{ position: 'absolute', bottom: '8px' }}>
           {Array.from({length: Math.min(count, 3)}).map((_, idx) => <div key={idx} className="calendar-dot"></div>)}
           {count > 3 && <div className="calendar-dot" style={{background: 'var(--text-muted)', width: '4px', height: '4px', alignSelf: 'center'}}></div>}
        </div>
     );
  };

  const toggleCampaign = (topic) => setExpandedCampaigns(prev => ({ ...prev, [topic]: !prev[topic] }));
  
  const monthNames = t('months');
  const dayNames = t('days');

  const isPlatformConnected = (platformName) => {
     return state.userProfile?.connectedPlatforms?.[platformName] === true;
  };

  // Metody dla modala (obsługa uploadu i symulacji AI)
  const handleGenImg = async () => {
    setIsGeneratingImg(true);
    try {
      const b64 = await generateImage(editingPost.topic || "abstract art");
      setEditingPost({...editingPost, image: b64, video: null});
    } catch (e) {
      dispatch({ type: 'ADD_TOAST', payload: { type: 'error', message: t('toastImgError') }});
    }
    setIsGeneratingImg(false);
  };

  const handleGenVid = () => {
    setIsGeneratingVid(true);
    setTimeout(() => {
      setEditingPost({...editingPost, video: { src: "https://www.w3schools.com/html/mov_bbb.mp4", text: editingPost.topic || 'Wideo AI', prompt: "Wirtualna Scena AI" }, image: null});
      setIsGeneratingVid(false);
    }, 4500);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('calTitle')}</h1>
        <p className="page-subtitle">{t('calSub')}</p>
      </div>

      <div className="creator-layout" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <div className="calendar-nav">
              <button className="btn btn-secondary" style={{padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)'}} onClick={prevMonth}>&larr;</button>
              <h3 style={{margin: 0, fontSize: '1.2rem', fontWeight: 800}}>{monthNames[month]} {year}</h3>
              <button className="btn btn-secondary" style={{padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)'}} onClick={nextMonth}>&rarr;</button>
            </div>
            
            <div className="calendar-grid">
              {dayNames.map(d => <div key={d} className="calendar-day-header">{d}</div>)}
              {daysArray.map((d, i) => {
                if (d === null) return <div key={`empty-${i}`} className="calendar-day empty"></div>;
                const dateStr = formatDay(d);
                const isSelected = dateStr === selectedDate;
                const dayPosts = postsByDate[dateStr] || [];
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                return (
                  <div 
                    key={d} 
                    className={`calendar-day ${isSelected ? 'selected' : ''}`} 
                    onClick={() => { setSelectedDate(dateStr); }} 
                    style={{ border: isToday && !isSelected ? '2px solid var(--primary)' : undefined, paddingTop: '0.3rem' }}
                  >
                    <span className="calendar-day-number" style={{ color: isToday ? 'var(--primary)' : 'var(--text-main)', position: 'absolute', top: '4px' }}>{d}</span>
                    {getGroupedDots(dayPosts)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--bg-subtle)', border: 'none', boxShadow: 'none' }}>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', display: 'flex', justifyContent: 'space-between' }}>
              {t('scheduledFor')} <span style={{ color: 'var(--primary)' }}>{selectedDate}</span>
            </h3>
            
            {sortedSelectedPosts.length === 0 ? (
              <div className="results-empty" style={{ padding: '3rem 1rem', border: '1px dashed var(--border)', background: 'transparent' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{t('noPostsTitle')}</h4>
                <p style={{ fontSize: '0.95rem' }}>{t('noPostsSub')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {Object.entries(postsByTopic).map(([topic, posts]) => {
                  const commonTime = posts[0].time;
                  return (
                  <div key={topic} className="card" style={{ boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div 
                      className="card-header" 
                      style={{ padding: '1rem 1.25rem', cursor: 'pointer', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: expandedCampaigns[topic] ? '1px solid var(--border)' : 'none' }}
                      onClick={() => toggleCampaign(topic)}
                    >
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>{topic}</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('postsOnPlatforms')}{posts.length}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={e => e.stopPropagation()}>
                        <input 
                          type="time" 
                          className="form-input" 
                          style={{ padding: '0.2rem 0.5rem', width: 'auto', fontSize: '0.85rem' }} 
                          value={commonTime}
                          onChange={e => {
                             dispatch({ type: 'EDIT_BULK_TIME', payload: { topic, date: selectedDate, time: e.target.value } });
                             dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastTimeUpdatedAll') } });
                          }} 
                        />
                        <div style={{ color: 'var(--text-muted)', fontSize: '1.2rem', transform: expandedCampaigns[topic] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', cursor: 'pointer' }} onClick={() => toggleCampaign(topic)}>
                          ▼
                        </div>
                      </div>
                    </div>
                    
                    {expandedCampaigns[topic] && (
                      <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {posts.map(post => {
                             const connected = isPlatformConnected(post.platform);
                             return (
                               <div key={post.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: connected ? 'var(--success)' : 'var(--danger)' }}></div>
                                    <span style={{ color: PLATFORM_ICONS[post.platform]?.color || 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, fontSize: '0.9rem', minWidth: '110px' }}>
                                       <span style={{ width: '20px', height: '20px' }}>{SVG_ICONS[post.platform]}</span> {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                                    </span>
                                 </div>
                                 <div style={{ flex: 1 }}></div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>{post.time}</span>
                                    <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: 'var(--bg-subtle)', border: 'none' }} onClick={() => setEditingPost(post)}>
                                       {t('edit')}
                                    </button>
                                 </div>
                               </div>
                             );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DO EDYCJI POSTA Z KALENDARZA WRAZ ZE ZDJĘCIEM/FILMEM */}
      {editingPost && (
         <div className="modal-overlay" onClick={() => setEditingPost(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
               <div className="modal-header">
                  <h3 className="modal-title" style={{margin:0}}>{t('editPostTitle')} ({editingPost.platform})</h3>
                  <button style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'var(--text-muted)'}} onClick={() => setEditingPost(null)}>✕</button>
               </div>
               
               <div className="form-group" style={{marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)'}}>
                  <label className="form-label" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>{t('manageTime')}</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>{t('changeTimeSingle')}:</span>
                      <input 
                         type="time" 
                         className="form-input" 
                         style={{ marginTop: '0.25rem' }}
                         value={editingPost.time} 
                         onChange={e => setEditingPost({...editingPost, time: e.target.value})} 
                      />
                    </div>
                    <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }}></div>
                    <div>
                      <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>{t('applyToAllProj')}:</span>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <input type="time" className="form-input" id="bulk-time-modal" defaultValue={editingPost.time} />
                        <button className="btn btn-secondary" onClick={() => {
                           const newTime = document.getElementById('bulk-time-modal').value;
                           dispatch({ type: 'EDIT_BULK_TIME', payload: { topic: editingPost.topic, date: selectedDate, time: newTime } });
                           dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastTimeUpdatedAll') } });
                           setEditingPost({...editingPost, time: newTime});
                        }}>{t('applyAllBtn')}</button>
                      </div>
                    </div>
                  </div>
               </div>

               <div className="form-group" style={{marginBottom: '1.5rem'}}>
                  <label className="form-label">{t('postContent')}</label>
                  <textarea 
                     className="form-input" 
                     rows="6" 
                     value={editingPost.content} 
                     onChange={e => setEditingPost({...editingPost, content: e.target.value})}
                     style={{resize: 'none'}}
                  />
               </div>

               {/* Menadżer Multimediów w oknie Edycji Kalendarza */}
               <div className="form-group" style={{marginBottom: '1.5rem'}}>
                  <label className="form-label">{t('attachmentsLabel')}</label>
                  <div className="result-meta-box" style={{ background: 'transparent', padding: 0, border: 'none' }}>
                    {!editingPost.image && !editingPost.video && !isGeneratingVid && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="file" id={`modal-file-${editingPost.platform}`} style={{ display: 'none' }} accept="image/*,video/*" onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            if (file.type.startsWith('video/')) setEditingPost({...editingPost, video: { src: url, text: '', prompt: 'Uploaded file' }, image: null});
                            else setEditingPost({...editingPost, image: url, video: null});
                          }
                        }} />
                        <button className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }} onClick={() => document.getElementById(`modal-file-${editingPost.platform}`).click()}>
                          {t('uploadDisk')}
                        </button>
                        <button className="btn btn-secondary" onClick={handleGenImg} disabled={isGeneratingImg} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', borderColor: 'var(--primary)', color: 'var(--primary)', background: 'rgba(244, 63, 94, 0.05)' }}>
                          {isGeneratingImg ? <><span className="spinner"></span> {t('generatingBtn')}</> : t('genImg')}
                        </button>
                        <button className="btn btn-secondary" onClick={handleGenVid} disabled={isGeneratingImg} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', borderColor: '#8b5cf6', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.05)' }}>
                          {t('genVid')}
                        </button>
                      </div>
                    )}
                    
                    {isGeneratingVid && (
                       <div style={{ width: '100%', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                             <div style={{ width: '15px', height: '15px', background: '#8b5cf6', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
                             <div style={{ width: '15px', height: '15px', background: '#8b5cf6', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }}></div>
                             <div style={{ width: '15px', height: '15px', background: '#8b5cf6', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }}></div>
                          </div>
                          <strong style={{ color: 'var(--text-main)' }}>{t('soraRender')}</strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('soraWait')}</span>
                       </div>
                    )}

                    {(editingPost.image || editingPost.video) && (
                      <div style={{position: 'relative', marginTop: '0.5rem'}}>
                        {editingPost.video ? (
                           <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
                             <video src={editingPost.video.src || editingPost.video} controls autoPlay loop muted style={{ width: '100%', display: 'block', filter: 'brightness(0.65)' }} />
                             {editingPost.video.text && (
                               <div style={{ position: 'absolute', bottom: '3rem', left: '1.5rem', right: '1.5rem', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                  <h4 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>{editingPost.video.text}</h4>
                                  <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.9 }}>AI Scene: {editingPost.video.prompt}</p>
                               </div>
                             )}
                           </div>
                        ) : (
                           <img src={editingPost.image} alt="Załącznik" style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
                        )}
                        <button className="btn btn-secondary" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.2rem 0.6rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.9)', border: 'none', color: '#333', zIndex: 10 }} onClick={() => setEditingPost({...editingPost, image: null, video: null})}>
                          {t('removeFile')}
                        </button>
                      </div>
                    )}
                  </div>
               </div>

               <div style={{display: 'flex', gap: '1rem'}}>
                  <button className="btn btn-primary" style={{flex: 1}} onClick={() => {
                     dispatch({ type: 'EDIT_SCHEDULED_POST', payload: { id: editingPost.id, content: editingPost.content, time: editingPost.time, image: editingPost.image, video: editingPost.video } });
                     dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastPostUpdated') } });
                     setEditingPost(null);
                  }}>{t('confirmClose')}</button>
                  <button className="btn btn-secondary" style={{padding: '0.75rem 1rem', color: 'var(--danger)'}} onClick={() => {
                     dispatch({ type: 'REMOVE_SCHEDULED_POST', payload: editingPost.id });
                     dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastPostDeleted') } });
                     setEditingPost(null);
                  }}>{t('deletePost')}</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

const DraftsView = () => {
  const { state, dispatch } = useContext(AppContext);
  const t = (k) => translations[state.language][k] || k;

  if (!state.drafts || state.drafts.length === 0) {
    return (
      <div className="results-empty" style={{ margin: '4rem auto', maxWidth: '800px', border: 'none', background: 'transparent' }}>
        <h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>{t('noDraftsTitle')}</h2>
        <p style={{ maxWidth: '500px', margin: '0 auto', fontSize: '1.15rem', color: 'var(--text-muted)' }}>{t('noDraftsSub')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('draftsTitle')}</h1>
        <p className="page-subtitle">{t('draftsSub')}</p>
      </div>
      <div className="content-grid">
        {[...state.drafts].reverse().map(draft => (
          <div key={draft.id} className="card">
            <div className="card-header" style={{ justifyContent: 'space-between' }}>
              <h3 className="card-title">{draft.title || t('noTitleDraft')}</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{draft.date}</span>
            </div>
            <div className="card-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {draft.brief?.message || t('noDesc')}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1, padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => {
                  dispatch({ type: 'UPDATE_BRIEF', payload: draft.brief });
                  if(draft.platforms) dispatch({ type: 'SET_PLATFORMS', payload: draft.platforms });
                  dispatch({ type: 'SET_GENERATED_CONTENT', payload: draft.content });
                  dispatch({ type: 'SET_TAB', payload: 'demo' });
                  dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastDraftLoaded') } });
                }}>{t('load')}</button>
                <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', color: 'var(--danger)' }} onClick={() => {
                  dispatch({ type: 'REMOVE_DRAFT', payload: draft.id });
                  dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastDraftDeleted') } });
                }}>{t('delete')}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ArchiveView = () => {
  const { state } = useContext(AppContext);
  const t = (k) => translations[state.language][k] || k;

  if (!state.savedProjects || state.savedProjects.length === 0) return <div className="results-empty" style={{ margin: '4rem auto', maxWidth: '800px', border: 'none', background: 'transparent' }}><h2 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>{t('noArchTitle')}</h2><p style={{ maxWidth: '500px', fontSize: '1.15rem', color: 'var(--text-muted)' }}>{t('noArchSub')}</p></div>;
  return (
    <div>
      <div className="page-header"><h1 className="page-title">{t('archTitle')}</h1><p className="page-subtitle">{t('archSub')}</p></div>
      <div className="content-grid">
        {[...state.savedProjects].reverse().map(proj => (
          <div key={proj.id} className="card" style={{ background: 'var(--bg-subtle)' }}>
            <div className="card-header" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{proj.date}</span>
              <span className="result-platform-badge" style={{ color: 'var(--primary)' }}>{t('autoSaveBadge')}</span>
            </div>
            <div className="card-body">
              <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-main)' }}>{t('mainTopic')}: {proj.brief.mainTopic || '-'}</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{proj.brief.message}</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {Object.keys(proj.content.platforms || {}).map(p => (
                   <span key={p} style={{ fontSize: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfileView = () => {
  const { state, dispatch } = useContext(AppContext);
  const t = (k) => translations[state.language][k] || k;
  const [verifying, setVerifying] = useState({});

  const handleVerify = (platform) => {
     setVerifying(prev => ({...prev, [platform]: true}));
     setTimeout(() => {
        dispatch({ type: 'UPDATE_PROFILE', payload: { connectedPlatforms: { ...state.userProfile.connectedPlatforms, [platform]: true } } });
        setVerifying(prev => ({...prev, [platform]: false}));
        dispatch({ type: 'ADD_TOAST', payload: { type: 'success', message: t('toastPlatformConnected') + platform.toUpperCase() } });
     }, 1500);
  };

  return (
    <div>
      <div className="page-header"><h1 className="page-title">{t('profTitle')}</h1><p className="page-subtitle">{t('profSub')}</p></div>
      
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto 2rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{t('credState')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('credStateSub')}</p>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>{state.credits === Infinity ? '∞' : state.credits}</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
        <div className="card-header"><h3 className="card-title">{t('basicData')}</h3></div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label">{t('loginName')}</label>
            <input type="text" className="form-input" value={state.userProfile.name} onChange={e => dispatch({type: 'UPDATE_PROFILE', payload: {name: e.target.value}})} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('loginEmail')}</label>
            <input type="email" className="form-input" value={state.userProfile.email} onChange={e => dispatch({type: 'UPDATE_PROFILE', payload: {email: e.target.value}})} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('orgLabel')}</label>
            <input type="text" className="form-input" value={state.userProfile.organization} onChange={e => dispatch({type: 'UPDATE_PROFILE', payload: {organization: e.target.value}})} />
          </div>
          <button className="btn btn-primary mt-3" onClick={() => dispatch({type: 'ADD_TOAST', payload: {type: 'success', message: t('toastProfileSaved')}})}>{t('saveData')}</button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card-header"><h3 className="card-title">{t('connectedAccs')}</h3></div>
        <div className="card-body" style={{ gap: '0.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t('connectedAccsSub')}</p>
          
          {Object.keys(PLATFORM_ICONS).map(p => {
             const isConnected = state.userProfile.connectedPlatforms?.[p];
             const isLoad = verifying[p];
             return (
               <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <span style={{ width: '20px', height: '20px', display: 'inline-block', color: PLATFORM_ICONS[p]?.color }}>{SVG_ICONS[p]}</span>
                   <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                 </div>
                 {isConnected ? (
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', color: 'var(--success)', borderColor: 'var(--success)', background: 'transparent', cursor: 'default' }}>{t('verified')}</button>
                 ) : (
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => handleVerify(p)} disabled={isLoad}>
                       {isLoad ? t('verifying') : t('notVerified')}
                    </button>
                 )}
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};

const PlanView = () => {
  const { state, dispatch } = useContext(AppContext);
  const t = (k) => translations[state.language][k] || k;
  
  const plans = [
    { id: 'free', name: t('planFree'), price: '0', desc: t('planFreeDesc'), features: [t('planFreeF1'), t('planFreeF2')] },
    { id: 'pro', name: 'Pro', price: '49 / mc', desc: t('planProDesc'), features: [t('planProF1'), t('planProF2'), t('planProF3')], popular: true },
    { id: 'ngo', name: t('planOrg'), price: '29 / mc', desc: t('planOrgDesc'), features: [t('planOrgF1'), t('planOrgF2')] }
  ];
  return (
    <div>
      <div className="page-header"><h1 className="page-title">{t('planTitle')}</h1><p className="page-subtitle">{t('planSub')}</p></div>
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto 3rem', border: '2px solid var(--primary)' }}>
        <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{t('currentPlan')}<span style={{ color: 'var(--primary)', fontWeight: 800 }}>{plans.find(p=>p.id===state.currentPlan)?.name}</span></h3><p style={{ color: 'var(--text-muted)' }}>{t('renews')}</p></div>
          <span style={{ padding: '0.5rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>{t('usedLimit')}</span>
        </div>
      </div>
      <div className="content-grid" style={{ alignItems: 'stretch' }}>
        {plans.map(p => (
          <div key={p.id} className="card" style={{ position: 'relative', border: p.popular ? '2px solid var(--primary)' : undefined, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {p.popular && <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: '#fff', padding: '0.25rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>{t('mostPopular')}</span>}
            <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 className="card-title">{p.name}</h3><div style={{ fontSize: '2rem', fontWeight: 800, margin: '1rem 0' }}>{p.price}</div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', minHeight: '3rem' }}>{p.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1 }}>
                {p.features.map((f, i) => <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}><span style={{ color: 'var(--success)' }}>✓</span> {f}</li>)}
              </ul>
              <button 
                className={`btn ${state.currentPlan === p.id ? 'btn-secondary' : 'btn-primary'}`} 
                style={{ width: '100%', marginTop: 'auto', opacity: state.currentPlan === p.id ? 0.6 : 1 }}
                onClick={() => { dispatch({type: 'SET_PLAN', payload: p.id}); dispatch({type: 'ADD_TOAST', payload: {type: 'success', message: t('toastPlanChanged')}}); }}
                disabled={state.currentPlan === p.id}
              >
                {state.currentPlan === p.id ? t('activePlan') : t('choosePlan')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsView = () => {
  const { state, dispatch } = useContext(AppContext);
  const t = (k) => translations[state.language][k] || k;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">{t('setTitle')}</h1><p className="page-subtitle">{t('setSub')}</p></div>
      
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
        <div className="card-body">
          <div className="switch-wrap">
            <div style={{ flex: 1, paddingRight: '1rem' }}>
               <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{t('langLabel')}</strong>
               <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{t('langDesc')}</span>
            </div>
            <select className="form-input" style={{ width: 'auto', background: 'var(--bg-subtle)' }} value={state.language} onChange={e => dispatch({ type: 'SET_LANGUAGE', payload: e.target.value })}>
               <option value="pl">🇵🇱 Polski</option>
               <option value="en">🇬🇧 English</option>
            </select>
          </div>
          
          <div className="switch-wrap">
            <div style={{ flex: 1, paddingRight: '1rem' }}>
               <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{t('darkMode')}</strong>
               <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{t('darkModeDesc')}</span>
            </div>
            <label className="switch"><input type="checkbox" checked={state.theme === 'dark'} onChange={() => dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' })} /><span className="slider"></span></label>
          </div>
          
          <div className="switch-wrap">
            <div style={{ flex: 1, paddingRight: '1rem' }}>
               <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{t('notifMode')}</strong>
               <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{t('notifDesc')}</span>
            </div>
            <label className="switch"><input type="checkbox" checked={state.settings.notifications} onChange={() => dispatch({ type: 'TOGGLE_SETTING', payload: 'notifications' })} /><span className="slider"></span></label>
          </div>
          
          <div className="switch-wrap" style={{ borderBottom: 'none' }}>
            <div style={{ flex: 1, paddingRight: '1rem' }}>
               <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{t('autoSaveMode')}</strong>
               <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{t('autoSaveDesc')}</span>
            </div>
            <label className="switch"><input type="checkbox" checked={state.settings.autoSave} onChange={() => dispatch({ type: 'TOGGLE_SETTING', payload: 'autoSave' })} /><span className="slider"></span></label>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', background: 'var(--bg-subtle)' }}>
         <div className="card-body">
            <h4 style={{ margin: '0 0 1rem', color: 'var(--text-main)' }}>{t('legalInfo')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: 'rules' })}>{t('tos')}</button>
               <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: 'privacy' })}>{t('privacy')}</button>
            </div>
         </div>
      </div>

      {state.modals.rules && (
         <div className="modal-overlay" onClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: 'rules' })}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
               <div className="modal-header">
                  <h3 className="modal-title" style={{margin:0}}>{t('tos')}</h3>
                  <button style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'var(--text-muted)'}} onClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: 'rules' })}>✕</button>
               </div>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  <h4>1. Zasady ogólne</h4>
                  <p>Korzystanie z aplikacji oznacza akceptację regulaminu.</p>
               </div>
               <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: 'rules' })}>{t('understandAccept')}</button>
            </div>
         </div>
      )}

      {state.modals.privacy && (
         <div className="modal-overlay" onClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: 'privacy' })}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
               <div className="modal-header">
                  <h3 className="modal-title" style={{margin:0}}>{t('privacy')}</h3>
                  <button style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'var(--text-muted)'}} onClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: 'privacy' })}>✕</button>
               </div>
               <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  <h4>1. Przetwarzanie danych</h4>
                  <p>Twoje dane są u nas bezpieczne i nikomu ich nie sprzedajemy.</p>
               </div>
               <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => dispatch({ type: 'TOGGLE_MODAL', payload: 'privacy' })}>{t('agreeProcess')}</button>
            </div>
         </div>
      )}
    </div>
  );
};

// ==========================================
// 7. EKRANY LOGOWANIA I SZKIELET
// ==========================================

const LanguageSwitcher = () => {
  const { state, dispatch } = useContext(AppContext);
  return (
    <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 100000 }}>
      <select 
        value={state.language} 
        onChange={e => dispatch({ type: 'SET_LANGUAGE', payload: e.target.value })}
        style={{
          background: 'var(--bg-surface)',
          color: 'var(--text-main)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)',
          padding: '0.4rem 2.2rem 0.4rem 1rem',
          fontSize: '0.85rem',
          fontWeight: '600',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: 'var(--shadow-sm)',
          appearance: 'none',
          backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right .7rem top 50%',
          backgroundSize: '.65rem auto'
        }}
      >
        <option value="pl">🇵🇱 Polski</option>
        <option value="en">🇬🇧 English</option>
      </select>
    </div>
  );
};

const SplashScreen = ({ onProceed }) => {
  const { state } = useContext(AppContext);
  const t = (k) => translations[state.language][k] || k;
  const [step, setStep] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Faza 1: Klapa się otwiera, elementy WYLATUJĄ (0.5s po załadowaniu)
    const t1 = setTimeout(() => setStep(1), 500);
    // Faza 2: Po wylocie klapa się ZAMYKA (1.5s)
    const t2 = setTimeout(() => setStep(2), 1500);
    // Faza 3: Przycisk podjeżdża do góry (2.2s)
    const t3 = setTimeout(() => { setStep(3); setShowButton(true); }, 2200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className={`splash-screen step-${step} ${showButton ? 'show-btn' : ''} ${isFading ? 'fade-out' : ''}`}>
      <LanguageSwitcher />
      <div className="splash-content-wrapper">
        <div className="splash-anim-layer">
           
           {/* SKRYTKA 3D (MAILBOX) */}
           <div className="splash-mailbox">
             <svg viewBox="0 0 120 120" stroke="currentColor" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="60" y1="80" x2="60" y2="120" />
                
                {/* Tył skrzynki i linie łączące (głębia) */}
                <polygon points="50,30 90,30 90,70 50,70" />
                <line x1="30" y1="40" x2="50" y2="30" />
                <line x1="70" y1="40" x2="90" y2="30" />
                <line x1="70" y1="80" x2="90" y2="70" />
                <line x1="30" y1="80" x2="50" y2="70" /> {/* Dolne połączenie */}
                
                {/* Ścianki blokujące elementy z tyłu */}
                <polygon points="30,40 50,30 90,30 70,40" fill="var(--bg-app)"/>
                <polygon points="70,40 90,30 90,70 70,80" fill="var(--bg-app)"/>
                
                {/* Wnętrze za klapą (białe) */}
                <polygon points="30,40 70,40 70,80 30,80" fill="var(--bg-surface)" />
                
                {/* Klapa (drzwiczki) */}
                <g className="splash-door" style={{ transformOrigin: '50px 80px' }}>
                  <polygon points="30,40 70,40 70,80 30,80" fill="var(--bg-app)" />
                  <line x1="40" y1="50" x2="60" y2="50" strokeWidth="3" />
                </g>
             </svg>
           </div>
           
           {/* Tekst wyłaniający ze skrytki */}
           <div className="splash-text">{t('appName')}</div>
           
           {/* Ikony platform wylatujące ze skrytki */}
           <div className="splash-tile fb">
             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
           </div>
           <div className="splash-tile ig">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
           </div>
           <div className="splash-tile in">
             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
           </div>
           <div className="splash-tile newsletter">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
           </div>
           <div className="splash-tile tiktok">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
           </div>
           
        </div>
      </div>
      
      <div className="splash-action">
         <button id="start-btn" className="btn btn-primary btn-lg" onClick={() => { setIsFading(true); setTimeout(onProceed, 600); }} style={{ fontSize: '1.25rem', padding: '1.25rem 3rem', boxShadow: '0 10px 25px -5px rgba(244, 63, 94, 0.5)' }}>{t('splashBtn')}</button>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin }) => {
  const { state } = useContext(AppContext);
  const t = (k) => translations[state.language][k] || k;
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleGoogleLogin = async () => {
    if (!auth) return onLogin(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (e) { onLogin(true); }
  };

  const handleAppleLogin = async () => {
    if (!auth) return onLogin(true);
    try {
      const provider = new OAuthProvider('apple.com');
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (e) { onLogin(true); }
  };

  const handleFacebookLogin = async () => {
    if (!auth) return onLogin(true);
    try {
      const provider = new FacebookAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (e) { onLogin(true); }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!email || !password || (isRegistering && !name)) return;
    if (isRegistering && password !== confirmPassword) { setLoginError(t('passMismatch')); return; }
    if (typeof auth !== 'undefined' && auth) {
      try {
        if (isRegistering) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName: name });
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
        onLogin();
      } catch (error) { setLoginError(t('loginError') + error.message); }
    } else { setLoginError(t('noDb')); }
  };
  return (
    <div className="login-screen">
      <LanguageSwitcher />
      <div className="login-card">
        <div className="login-logo">{t('appName')}</div>
        <p className="login-subtitle">{isRegistering ? t('loginTitleReg') : t('loginTitleLog')}</p>
        {loginError && (<div style={{ background: 'var(--danger)', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', margin: '0 0 1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>{loginError}</div>)}
        <button className="social-btn" onClick={handleGoogleLogin} type="button"><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> {t('continueGoogle')}</button>
        <button className="social-btn" onClick={handleAppleLogin} type="button"><svg viewBox="0 0 24 24" fill="var(--text-main)" xmlns="http://www.w3.org/2000/svg"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.05 2.78.72 3.4 1.8-3.02 1.63-2.3 5.48.55 6.64-.78 1.84-1.63 3.65-2.6 4.57zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.43 2.35-1.87 4.38-3.74 4.25z"/></svg> {t('continueApple')}</button>
        <button className="social-btn" onClick={handleFacebookLogin} type="button"><svg viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> {t('continueFb')}</button>
        <div className="login-divider">{t('loginOr')}</div>
        <form className="login-form" onSubmit={handleFormSubmit}>
          {isRegistering && (<div className="login-input-group"><label>{t('loginName')}</label><input type="text" placeholder="Jan Kowalski" value={name} onChange={e => setName(e.target.value)} required /></div>)}
          <div className="login-input-group"><label>{t('loginEmail')}</label><input type="text" placeholder="jan@postmaker.pl" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="login-input-group"><label>{t('loginPass')}</label><input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required /></div>
          {isRegistering && (<div className="login-input-group"><label>{t('loginPassRep')}</label><input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>)}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}>{isRegistering ? t('loginBtnReg') : t('loginBtnLog')}</button>
          <button type="button" className="btn btn-secondary" onClick={() => onLogin(true)} style={{ width: '100%', padding: '1rem', marginTop: '0.75rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}>{t('loginTest')}</button>
        </form>
        <div className="login-footer">{isRegistering ? t('loginHasAcc') : t('loginNoAcc')}<a onClick={() => { setIsRegistering(!isRegistering); setName(''); setPassword(''); setConfirmPassword(''); }}>{isRegistering ? t('loginHere') : t('registerHere')}</a></div>
      </div>
    </div>
  );
};

function AppRoot() {
  const { state, dispatch } = useContext(AppContext);
  const [currentView, setCurrentView] = useState('splash');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = (k) => translations[state.language][k] || k;
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView, state.activeTab]);
  
  const handleLogin = (isDemo = false) => {
    if (isDemo) {
      dispatch({ type: 'SET_CREDITS', payload: Infinity });
    }
    setCurrentView('main');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 0); 
  };

  const handleLogout = async () => {
    if (typeof auth !== 'undefined' && auth) { try { await signOut(auth); } catch(e){} }
    setIsMenuOpen(false); setCurrentView('login');
  };

  if (currentView === 'splash') return <SplashScreen onProceed={() => setCurrentView('login')} />;
  if (currentView === 'login') return <LoginScreen onLogin={handleLogin} />;
  
  return (
    <>
      <header className="topbar">
        <div className="topbar-brand">
          <MailboxIcon size={64} strokeWidth={4} />
          {t('appName')}
        </div>
        <nav className="topbar-tabs">
          {[
            {id:'demo', l:t('tabCreator')}, {id:'library', l:t('tabTemplates')}, {id:'campaigns', l:t('tabCampaigns')}, 
            {id:'calendar', l:t('tabCalendar')}, {id:'drafts', l:t('tabDrafts')}, {id:'archive', l:t('tabArchive')}
          ].map(tObj => (
            <button key={tObj.id} className={`tab-btn ${state.activeTab === tObj.id ? 'active' : ''}`} onClick={() => dispatch({ type: 'SET_TAB', payload: tObj.id })}>{tObj.l}</button>
          ))}
        </nav>
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="credits-pill">{state.credits === Infinity ? t('creditsInf') : (state.credits > 1000 ? '1000+' : state.credits) + t('creditsNum')}</div>
          <button className="hamburger-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          
          {isMenuOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => { dispatch({type: 'SET_TAB', payload: 'profile'}); setIsMenuOpen(false); }}>{t('menuProfile')}</button>
              <button className="dropdown-item" onClick={() => { dispatch({type: 'SET_TAB', payload: 'plan'}); setIsMenuOpen(false); }}>{t('menuPlan')}</button>
              <button className="dropdown-item" onClick={() => { dispatch({type: 'SET_TAB', payload: 'settings'}); setIsMenuOpen(false); }}>{t('menuSettings')}</button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item text-danger" onClick={handleLogout}>{t('menuLogout')}</button>
            </div>
          )}
        </div>
      </header>

      <main className="main-container">
        {state.activeTab === 'demo' && <DemoPanel />}
        {state.activeTab === 'library' && <LibraryView />}
        {state.activeTab === 'campaigns' && <CampaignsView />}
        {state.activeTab === 'calendar' && <CalendarView />}
        {state.activeTab === 'drafts' && <DraftsView />}
        {state.activeTab === 'archive' && <ArchiveView />}
        {state.activeTab === 'profile' && <ProfileView />}
        {state.activeTab === 'plan' && <PlanView />}
        {state.activeTab === 'settings' && <SettingsView />}
      </main>

      <AIAssistantBot />
      <Toast />
    </>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <style>{styles}</style>
      <div data-theme={state.theme} className="global-theme-wrapper">
        <AppRoot />
      </div>
    </AppContext.Provider>
  );
}