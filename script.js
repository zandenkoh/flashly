// Initialize Supabase
const supabaseUrl = 'https://grgcynxsmanqfsgkiytu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZ2N5bnhzbWFucWZzZ2tpeXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDkxMDQsImV4cCI6MjA4NjEyNTEwNH0.rlTuj58kCkZqb_nIGQhCeBkvFeY04FtFx-SLpwXp-Yg';
const sb = window.supabase.createClient(supabaseUrl, supabaseKey);

// Log to help debug the "No API key" issue
console.log("Supabase Client Init - URL:", supabaseUrl);
if (!supabaseKey) {
    console.error("Supabase Key is MISSING!");
} else {
    console.log("Supabase Key detected (length):", supabaseKey.length);
}

// State Management
const state = {
    user: null,
    decks: [],
    currentDeck: null,
    cards: [],
    tags: [], // Cache user tags
    studyQueue: [],
    currentCardIndex: 0,
    isFlipped: false,
    studySessionConfig: null, // { type: 'standard' | 'custom', filters: {} }
    channels: {
        decks: null,
        cards: null
    },
    // Game State
    game: {
        active: false,
        mode: null, // 'match' | 'gravity'
        score: 0,
        timer: null,
        items: [], // Game items
    },
    // Groups State
    groups: [],
    currentGroup: null,
    groupDecks: [],
    groupMembers: [],
    savedDecks: [],
    lastView: 'today-view',
    deckOrigin: 'decks-view', // Track for back navigation from deck view
    studyOrigin: null, // Track for back navigation from study view
    groupOrigin: 'groups-view', // Track for back navigation from group view
    gameOrigin: 'deck-view', // Track for back navigation from game view
    selectionMode: false,
    selectedCardIds: new Set(),
    subjects: [], // New state for subjects
    deckTab: 'my',
    communityDecks: [],
    settings: {
        theme: 'light',
        reducedMotion: false,
        compactSidebar: false,
        dailyLimit: 20,
        defaultSeparator: '|',
        autoFlip: false,
        showProgress: true
    },
    isGuest: false,
    channels: {
        main: null
    },
    sessionRatings: [] // Track ratings in current session: { cardId: string, rating: number }
};

const DEFAULT_TAGS = [
    { name: 'Important', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />' },
    { name: 'Hard', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />' },
    { name: 'Math', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />' },
    { name: 'Science', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.327 24.327 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />' },
    { name: 'Coding', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />' },
    { name: 'Todo', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />' }
];

// DOM Elements
const authView = document.getElementById('auth-view');
const authModal = document.getElementById('auth-modal');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const modalOverlay = document.getElementById('modal-overlay');
const mainLayout = document.getElementById('main-layout');
const todayView = document.getElementById('today-view');
const decksView = document.getElementById('decks-view');
const groupsView = document.getElementById('groups-view');
const insightsView = document.getElementById('insights-view');
const communityView = document.getElementById('community-view');
const deckView = document.getElementById('deck-view');
const studyView = document.getElementById('study-view');
const studySummaryView = document.getElementById('study-summary-view');
const gameView = document.getElementById('game-view');

const groupDetailView = document.getElementById('group-detail-view');



function switchView(viewId) {
    // Hide all views first
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));

    // Clear card list when leaving deck-view to prevent cards persisting across tabs
    if (state.lastView === 'deck-view' && viewId !== 'deck-view') {
        const cardList = document.getElementById('card-list');
        if (cardList) cardList.innerHTML = '';
    }

    // Show target view
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
        state.lastView = viewId;
    }

    // Smooth scroll to top when switching views
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Creating a safety mechanism: stop any game
    stopGame();

    // Exit fullscreen if needed
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
    }

    // Close mobile sidebar on navigation
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('active');
}

// --- Auth Logic ---

async function checkUser() {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        state.user = session.user;
        state.isGuest = false;
        showApp();
    } else {
        state.isGuest = false; // Not a guest yet, just on landing
        showAuth();
        detectLinksEarly();
    }

    // Check for admin/uploader access
    if (state.user && state.user.email === 'kohzanden@gmail.com') {
        const addBtn = document.getElementById('add-note-btn');
        if (addBtn) addBtn.classList.remove('hidden');
    }

    sb.auth.onAuthStateChange((_event, session) => {
        state.user = session ? session.user : null;
        if (state.user) {
            showApp();
        } else {
            showAuth();
        }
    });
}

// Auth Toggle
let authMode = 'login';

function updateAuthUI() {
    document.getElementById('auth-submit').textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
    document.getElementById('auth-toggle-text').textContent = authMode === 'login' ? "Don't have an account?" : "Already have an account?";
    document.getElementById('auth-toggle-link').textContent = authMode === 'login' ? 'Sign Up' : 'Sign In';

    authTitle.textContent = authMode === 'login' ? 'Welcome Back' : 'Create Account';
    authSubtitle.textContent = authMode === 'login' ? 'Log in to your Flashly account' : 'Start your learning journey today';
}

document.getElementById('auth-toggle-link').addEventListener('click', (e) => {
    e.preventDefault();
    authMode = authMode === 'login' ? 'signup' : 'login';
    updateAuthUI();
});

// Auth Toggle Logic (Event Delegation)
document.addEventListener('click', (e) => {
    const loginBtn = e.target.closest('.btn-login-toggle');
    const signupBtn = e.target.closest('.btn-signup-toggle');

    if (loginBtn) {
        authMode = 'login';
        updateAuthUI();
        authModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        if (document.getElementById('guest-preview-modal')) {
            document.getElementById('guest-preview-modal').classList.add('hidden');
        }
        if (typeof modalOverlay !== 'undefined') modalOverlay.classList.add('hidden');
    }

    if (signupBtn) {
        authMode = 'signup';
        updateAuthUI();
        authModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        if (document.getElementById('guest-preview-modal')) {
            document.getElementById('guest-preview-modal').classList.add('hidden');
        }
        if (typeof modalOverlay !== 'undefined') modalOverlay.classList.add('hidden');
    }
});

document.querySelector('.auth-modal-close').onclick = () => {
    authModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
};

authModal.onclick = (e) => {
    if (e.target === authModal) {
        authModal.classList.add('hidden');
        document.body.classList.remove('modal-open');
    }
};

// Auth Form Submit
document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('auth-submit');
    const originalText = btn.textContent;

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Processing...';

    const { error } = authMode === 'login'
        ? await sb.auth.signInWithPassword({ email, password })
        : await sb.auth.signUp({ email, password });

    if (error) {
        showToast(error.message, 'error');
        btn.disabled = false;
        btn.textContent = originalText;
    } else if (authMode === 'signup') {
        showToast('Check your email for verification!', 'info');
        btn.disabled = false;
        btn.textContent = originalText;
    } else {
        // Success - show loading animation and reload
        const loader = document.getElementById('loading-overlay');
        if (loader) loader.classList.remove('hidden');

        // Brief delay to let the user see the "Syncing" state
        setTimeout(() => {
            window.location.reload();
        }, 800);
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    await sb.auth.signOut();
    window.location.reload();
});

function showAuth() {
    authView.classList.remove('hidden');
    mainLayout.classList.add('hidden');
    authModal.classList.add('hidden');
}

function showApp() {
    authView.classList.add('hidden');
    mainLayout.classList.remove('hidden');

    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logout-btn');
    const sidebar = document.querySelector('.sidebar');

    if (state.isGuest) {
        if (sidebar) sidebar.classList.add('guest-mode');
        if (userDisplay) userDisplay.innerHTML = `<button class="btn btn-primary btn-sm btn-login-toggle" style="width: 100%;">Sign In</button>`;
        if (logoutBtn) logoutBtn.classList.add('hidden');

        // Force guest-friendly view for first timers
        if (!state.user && (state.lastView === 'today-view' || !state.lastView)) {
            updateNav('nav-community');
            switchView('community-view');
            loadCommunityDecks();
        }
    } else {
        if (sidebar) sidebar.classList.remove('guest-mode');
        if (userDisplay) userDisplay.textContent = state.user.email;
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        setupRealtime();
        loadTags(); // Pre-load tags
        loadTodayView(); // New Homepage
        fetchUserProfile(); // Fetch custom username
        handleDeepLinks(); // Check for ?join= or ?deck= codes

        // Set active nav
        if (state.lastView === 'today-view' || !state.lastView) {
            updateNav('nav-today');
        }
    }

    // Mobile UI Init
    initMobileUI();
}

function initMobileUI() {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const closeSidebar = document.getElementById('close-sidebar-btn');
    const settingsMenuToggle = document.getElementById('mobile-settings-menu-toggle');
    const settingsSidebar = document.querySelector('.settings-sidebar');

    if (menuToggle && sidebar) {
        menuToggle.onclick = () => sidebar.classList.add('active');
    }

    if (closeSidebar && sidebar) {
        closeSidebar.onclick = () => sidebar.classList.remove('active');
    }

    if (settingsMenuToggle && settingsSidebar) {
        settingsMenuToggle.onclick = () => {
            settingsSidebar.classList.toggle('active');
        };
    }

    // Close settings sidebar when a tab is clicked
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        const oldClick = btn.onclick;
        btn.onclick = (e) => {
            if (oldClick) oldClick(e);
            if (window.innerWidth <= 768) {
                settingsSidebar.classList.remove('active');
            }
        };
    });
}

async function handleDeepLinks() {
    if (!state.user) return;
    const url = new URL(window.location.href);
    let dirty = false;

    // --- 1. Handle Join Code ---
    const joinCode = url.searchParams.get('join');
    if (joinCode) {
        url.searchParams.delete('join');
        dirty = true;

        const { data: group } = await sb.from('groups').select('id, name').eq('invite_code', joinCode).maybeSingle();
        if (!group) {
            showToast('Invalid Invite Link', 'error');
        } else {
            const { error } = await sb.from('group_members').insert([{ group_id: group.id, user_id: state.user.id }]);
            if (error) {
                if (error.code === '23505') showToast(`Already in ${group.name}`, 'info');
                else showToast(error.message, 'error');
            } else {
                showToast(`Joined ${group.name}!`, 'success');
                updateNav('nav-groups');
                switchView('groups-view');
                loadGroups();
            }
        }
    }

    // --- 2. Handle Deck Link ---
    const deckId = url.searchParams.get('deck');
    if (deckId) {
        url.searchParams.delete('deck');
        dirty = true;

        const { data: deck, error } = await sb.from('decks').select('*').eq('id', deckId).maybeSingle();
        if (error || !deck) {
            showToast('Deck not found or unavailable', 'error');
        } else {
            openDeck(deck);
        }
    }

    if (dirty) {
        window.history.replaceState({}, document.title, url.toString());
    }
}

async function detectLinksEarly() {
    const url = new URL(window.location.href);
    const joinCode = url.searchParams.get('join');
    const deckId = url.searchParams.get('deck');

    if (!joinCode && !deckId) return;

    if (joinCode) {
        const { data: group } = await sb.from('groups').select('id, name').eq('invite_code', joinCode).maybeSingle();
        if (group) showGuestPreview('group', group);
    } else if (deckId) {
        const { data: deck } = await sb.from('decks').select('id, title, description').eq('id', deckId).maybeSingle();
        if (deck) showGuestPreview('deck', deck);
    }
}

function showGuestPreview(type, data) {
    const modal = document.getElementById('guest-preview-modal');
    const title = document.getElementById('guest-preview-title');
    const subtitle = document.getElementById('guest-preview-subtitle');
    const meta = document.getElementById('guest-preview-meta');
    const icon = document.getElementById('guest-preview-icon');

    if (type === 'group') {
        title.textContent = "Join this Group";
        subtitle.textContent = "You've been invited to join a collaborative learning group on Flashly.";
        meta.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="font-bold text-lg">${escapeHtml(data.name)}</div>
            </div>
            <div class="text-xs text-secondary mt-2">Sign in to see members and shared decks.</div>
        `;
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 40px; height: 40px;"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /> </svg>`;
    } else {
        title.textContent = "Access this Deck";
        subtitle.textContent = "Master this deck with our optimized spaced repetition system.";
        meta.innerHTML = `
            <div class="font-bold text-lg">${escapeHtml(data.title)}</div>
            ${data.description ? `<div class="text-xs text-secondary mt-2">${escapeHtml(data.description)}</div>` : ''}
        `;
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 40px; height: 40px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>`;
    }

    modal.classList.remove('hidden');
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.body.classList.add('modal-open');
}

async function fetchUserProfile() {
    // Try to fetch all settings, but handle cases where columns might be missing (400 error)
    const { data, error } = await sb.from('profiles')
        .select('username, theme, reduced_motion, compact_sidebar, daily_limit, default_separator, auto_flip, show_progress')
        .eq('id', state.user.id)
        .maybeSingle();

    if (error && (error.code === 'PGRST100' || error.status === 400 || error.message.includes('column'))) {
        console.warn("Appearance columns missing in DB, falling back to local storage.");
        const { data: basicData } = await sb.from('profiles').select('username').eq('id', state.user.id).single();
        if (basicData) {
            state.user.username = basicData.username;
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) userDisplay.textContent = basicData.username;
        }
        loadLocalSettings();
    } else if (data) {
        if (data.username) {
            state.user.username = data.username;
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) userDisplay.textContent = data.username;
        }

        // Load settings into state
        state.settings.theme = data.theme || localStorage.getItem('flashly-theme') || 'light';
        state.settings.reducedMotion = data.reduced_motion ?? (localStorage.getItem('flashly-rm') === 'true');
        state.settings.compactSidebar = data.compact_sidebar ?? (localStorage.getItem('flashly-cs') === 'true');

        // Study prefs
        state.settings.dailyLimit = data.daily_limit || parseInt(localStorage.getItem('flashly-daily-limit')) || 20;
        state.settings.defaultSeparator = data.default_separator || localStorage.getItem('flashly-separator') || '|';
        state.settings.autoFlip = data.auto_flip ?? (localStorage.getItem('flashly-auto-flip') === 'true');
        state.settings.showProgress = data.show_progress ?? (localStorage.getItem('flashly-show-progress') !== 'false');

        // Sync to local storage
        syncToLocal();

        // Apply settings
        applyTheme(state.settings.theme, false);
        applyInterfaceSettings();
    } else {
        // No profile found or other error, load from local
        loadLocalSettings();
    }
}

function loadLocalSettings() {
    state.settings.theme = localStorage.getItem('flashly-theme') || 'light';
    state.settings.reducedMotion = localStorage.getItem('flashly-rm') === 'true';
    state.settings.compactSidebar = localStorage.getItem('flashly-cs') === 'true';

    // Study prefs
    state.settings.dailyLimit = parseInt(localStorage.getItem('flashly-daily-limit')) || 20;
    state.settings.defaultSeparator = localStorage.getItem('flashly-separator') || '|';
    state.settings.autoFlip = localStorage.getItem('flashly-auto-flip') === 'true';
    state.settings.showProgress = localStorage.getItem('flashly-show-progress') !== 'false';

    applyTheme(state.settings.theme, false);
    applyInterfaceSettings();
}

function syncToLocal() {
    localStorage.setItem('flashly-theme', state.settings.theme);
    localStorage.setItem('flashly-rm', state.settings.reducedMotion);
    localStorage.setItem('flashly-cs', state.settings.compactSidebar);

    // Study prefs
    localStorage.setItem('flashly-daily-limit', state.settings.dailyLimit);
    localStorage.setItem('flashly-separator', state.settings.defaultSeparator);
    localStorage.setItem('flashly-auto-flip', state.settings.autoFlip);
    localStorage.setItem('flashly-show-progress', state.settings.showProgress);
}

function applyInterfaceSettings() {
    document.body.classList.toggle('reduced-motion', state.settings.reducedMotion);
    document.body.classList.toggle('compact-sidebar', state.settings.compactSidebar);

    // Update setting modal switches if open
    const rmCheck = document.getElementById('settings-reduced-motion');
    const csCheck = document.getElementById('settings-compact-sidebar');
    if (rmCheck) rmCheck.checked = state.settings.reducedMotion;
    if (csCheck) csCheck.checked = state.settings.compactSidebar;
}


// --- Navigation ---

document.getElementById('nav-today').addEventListener('click', () => {
    if (state.isGuest) {
        authMode = 'login';
        updateAuthUI();
        authModal.classList.remove('hidden');
        return;
    }
    updateNav('nav-today');
    switchView('today-view');
    loadTodayView();
});

document.getElementById('nav-decks').addEventListener('click', () => {
    if (state.isGuest) {
        authMode = 'login';
        updateAuthUI();
        authModal.classList.remove('hidden');
        return;
    }
    updateNav('nav-decks');
    switchView('decks-view');
    loadDecksView();
});

const myDecksTab = document.getElementById('my-decks-tab');
const sharedDecksTab = document.getElementById('shared-decks-tab');

if (myDecksTab) {
    myDecksTab.addEventListener('click', () => {
        state.deckTab = 'my';
        myDecksTab.classList.add('active');
        sharedDecksTab.classList.remove('active');
        loadDecksView();
    });
}

if (sharedDecksTab) {
    sharedDecksTab.addEventListener('click', () => {
        state.deckTab = 'shared';
        sharedDecksTab.classList.add('active');
        myDecksTab.classList.remove('active');
        loadDecksView();
    });
}

document.getElementById('nav-insights').addEventListener('click', () => {
    if (state.isGuest) {
        authMode = 'login';
        updateAuthUI();
        authModal.classList.remove('hidden');
        return;
    }
    updateNav('nav-insights');
    switchView('insights-view');
    loadStats(); // Combined stats and insights loading
});

document.getElementById('nav-community').addEventListener('click', () => {
    updateNav('nav-community');
    switchView('community-view'); // You need to add community-view back to HTML or rename one
    loadCommunityDecks();
});

document.getElementById('nav-groups').addEventListener('click', () => {
    if (state.isGuest) {
        authMode = 'login';
        updateAuthUI();
        authModal.classList.remove('hidden');
        return;
    }
    updateNav('nav-groups');
    switchView('groups-view'); // Make sure this ID exists in HTML, or reuse decks-view logic if similar
    loadGroups();
});

document.getElementById('nav-notes').addEventListener('click', () => {
    updateNav('nav-notes');
    switchView('notes-view');
    loadNotesView();
});



// Settings
document.getElementById('nav-settings').addEventListener('click', () => {
    if (state.isGuest) {
        authMode = 'login';
        updateAuthUI();
        authModal.classList.remove('hidden');
        return;
    }
    initSettingsModal();
    openModal('settings-modal');
});

function initSettingsModal() {
    // Populate Account Fields
    document.getElementById('settings-username').value = state.user.username || '';
    document.getElementById('settings-display-name').textContent = state.user.username || 'User';
    document.getElementById('settings-display-email').textContent = state.user.email;
    document.getElementById('settings-email-readonly').value = state.user.email;

    // Set Avatar Initials
    const initials = (state.user.username || state.user.email || 'U').substring(0, 1).toUpperCase();
    document.getElementById('settings-profile-avatar').textContent = initials;

    // Load Stats in Settings
    loadSettingsStats();

    // Default to first tab
    switchSettingsTab('settings-account');

    // Update appearance UI to match current state
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('data-theme') === state.settings.theme);
    });
    document.getElementById('settings-reduced-motion').checked = state.settings.reducedMotion;
    document.getElementById('settings-compact-sidebar').checked = state.settings.compactSidebar;

    // Study Preferences
    const dailyLimitInput = document.getElementById('settings-daily-limit');
    if (dailyLimitInput) dailyLimitInput.value = state.settings.dailyLimit;

    const separatorInput = document.getElementById('settings-default-separator');
    if (separatorInput) separatorInput.value = state.settings.defaultSeparator;

    const autoFlipInput = document.getElementById('settings-auto-flip');
    if (autoFlipInput) autoFlipInput.checked = state.settings.autoFlip;

    const showProgressInput = document.getElementById('settings-show-progress');
    if (showProgressInput) showProgressInput.checked = state.settings.showProgress;
}

async function loadSettingsStats() {
    // 1. Mastery
    const { data: cards } = await sb.from('cards').select('id, deck_id');
    const { data: logs } = await sb.from('study_logs').select('rating, review_time').eq('user_id', state.user.id);

    let mastered = 0;
    if (logs) {
        // Simple mastery count: cards with last rating >= 3
        const cardRatings = new Map();
        logs.forEach(log => {
            // We'd need to sort by time to get LATEST rating, but let's approximate for now
            if (!cardRatings.has(log.card_id) || new Date(log.review_time) > new Date(cardRatings.get(log.card_id).time)) {
                cardRatings.set(log.card_id, { rating: log.rating, time: log.review_time });
            }
        });
        cardRatings.forEach(val => { if (val.rating >= 3) mastered++; });
    }

    document.getElementById('settings-stat-mastered').textContent = mastered;

    // 2. Streak (reuse today view logic if moved to a helper, but I'll recalculate here)
    const dates = logs ? [...new Set(logs.map(l => new Date(l.review_time).toDateString()))] : [];
    let streak = 0;
    if (dates.length > 0) {
        let checkDate = new Date();
        while (true) {
            const checkStr = checkDate.toDateString();
            if (dates.includes(checkStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                if (streak === 0 && checkDate.toDateString() === new Date().toDateString()) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                }
                break;
            }
        }
    }
    document.getElementById('settings-stat-streak').textContent = `${streak} days`;

    // 3. Reviews
    document.getElementById('settings-stat-reviews').textContent = logs ? logs.length : 0;

    // 4. Decks
    document.getElementById('settings-stat-decks').textContent = state.decks.length;

    // 5. Member Since
    const joinDate = state.user.created_at ? new Date(state.user.created_at) : new Date();
    document.getElementById('settings-member-since').textContent = joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Render Mini Charts
    renderSettingsCharts(mastered, streak, logs ? logs.length : 0, state.decks.length, logs || []);
}

const settingsChartInstances = [];

function renderSettingsCharts(mastered, streak, reviews, decks, logs) {
    // Cleanup old charts
    settingsChartInstances.forEach(chart => chart.destroy());
    settingsChartInstances.length = 0;

    const masteryEl = document.getElementById('chart-mastery');
    const streakEl = document.getElementById('chart-streak');
    const reviewsEl = document.getElementById('chart-reviews');
    const decksEl = document.getElementById('chart-decks');

    if (!masteryEl || !streakEl || !reviewsEl || !decksEl) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Helper to create gradient
    function createGradient(ctx, colorStart, colorEnd) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        return gradient;
    }

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
            x: { display: false, offset: false, grid: { display: false } },
            y: { display: false, min: 0, grid: { display: false } }
        },
        layout: { padding: 0 },
        elements: {
            point: { radius: 0, hitRadius: 0, hoverRadius: 0 },
            line: { borderWidth: 0 } // filled only look
        }
    };

    // 1. Mastery Chart (Smooth Area)
    const ctxMastery = masteryEl.getContext('2d');
    const gradMastery = createGradient(ctxMastery, 'rgba(37, 99, 235, 0.5)', 'rgba(37, 99, 235, 0.05)');

    settingsChartInstances.push(new Chart(ctxMastery, {
        type: 'line',
        data: {
            labels: [1, 2, 3, 4, 5, 6, 7],
            datasets: [{
                data: [mastered * 0.4, mastered * 0.5, mastered * 0.6, mastered * 0.75, mastered * 0.85, mastered * 0.95, mastered],
                borderColor: '#2563eb',
                borderWidth: 2,
                tension: 0.5,
                fill: true,
                backgroundColor: gradMastery
            }]
        },
        options: commonOptions
    }));

    // 2. Streak Chart (Stepped Area for "consistent" feel)
    const ctxStreak = streakEl.getContext('2d');
    const gradStreak = createGradient(ctxStreak, 'rgba(34, 197, 94, 0.5)', 'rgba(34, 197, 94, 0.05)');

    settingsChartInstances.push(new Chart(ctxStreak, {
        type: 'line', // Changed to line for better width filling
        data: {
            labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            datasets: [{
                data: [streak > 0 ? 1 : 0, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Fake "solid" look if active
                borderColor: '#22c55e',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                backgroundColor: gradStreak
            }]
        },
        options: commonOptions
    }));

    // 3. Reviews Chart (Activity Waves)
    const ctxReviews = reviewsEl.getContext('2d');
    const gradReviews = createGradient(ctxReviews, 'rgba(245, 158, 11, 0.5)', 'rgba(245, 158, 11, 0.05)');

    // Generate some wave-like data
    const reviewData = Array.from({ length: 10 }, (_, i) => reviews * (0.3 + Math.random() * 0.7));
    reviewData[9] = reviews; // End on current

    settingsChartInstances.push(new Chart(ctxReviews, {
        type: 'line',
        data: {
            labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            datasets: [{
                data: reviewData,
                borderColor: '#f59e0b',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                backgroundColor: gradReviews
            }]
        },
        options: commonOptions
    }));

    // 4. Decks Chart (Growth Curve)
    const ctxDecks = decksEl.getContext('2d');
    const gradDecks = createGradient(ctxDecks, 'rgba(139, 92, 246, 0.5)', 'rgba(139, 92, 246, 0.05)');

    settingsChartInstances.push(new Chart(ctxDecks, {
        type: 'line',
        data: {
            labels: [1, 2, 3, 4, 5],
            datasets: [{
                data: [Math.max(0, decks - 2), Math.max(0, decks - 1.5), Math.max(0, decks - 1), Math.max(0, decks - 0.5), decks],
                borderColor: '#8b5cf6',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                backgroundColor: gradDecks
            }]
        },
        options: commonOptions
    }));
}

// Settings Tab Logic
document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.onclick = () => {
        const tabId = btn.getAttribute('data-tab');
        if (tabId) switchSettingsTab(tabId);
    };
});

function switchSettingsTab(tabId) {
    // Update Sidebar
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Update View
    document.querySelectorAll('.settings-tab-view').forEach(view => {
        view.classList.toggle('hidden', view.id !== tabId);
    });
}

// Theme Selection Logic
document.querySelectorAll('.theme-option').forEach(option => {
    option.onclick = () => {
        document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        const theme = option.getAttribute('data-theme');
        applyTheme(theme);
    };
});

async function applyTheme(theme, save = true) {
    state.settings.theme = theme;

    // Handle "system" theme
    let effectiveTheme = theme;
    if (theme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', effectiveTheme);

    // Watch for system theme changes if set to "system"
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handleSystemThemeChange);
        if (theme === 'system') {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleSystemThemeChange);
        }
    }

    // Update active state in modal
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('data-theme') === theme);
    });

    if (save && state.user) {
        syncToLocal();
        const { error } = await sb.from('profiles').upsert({
            id: state.user.id,
            theme: theme
        });
        // Silent fail for DB but keep local
        if (error) console.warn("Failed to persist theme to DB:", error.message);
        showToast(`Theme set to ${theme}`, 'info');
    }
}

// Interface Setting Listeners
document.getElementById('settings-reduced-motion').onchange = async (e) => {
    state.settings.reducedMotion = e.target.checked;
    syncToLocal();
    applyInterfaceSettings();
    if (state.user) {
        const { error } = await sb.from('profiles').upsert({ id: state.user.id, reduced_motion: state.settings.reducedMotion });
        if (error) console.warn("Failed to persist motion setting to DB");
    }
};

document.getElementById('settings-compact-sidebar').onchange = async (e) => {
    state.settings.compactSidebar = e.target.checked;
    syncToLocal();
    applyInterfaceSettings();
    if (state.user) {
        const { error } = await sb.from('profiles').upsert({ id: state.user.id, compact_sidebar: state.settings.compactSidebar });
        if (error) console.warn("Failed to persist sidebar setting to DB");
    }
};

// Study Settings Listeners
document.getElementById('settings-daily-limit').onchange = async (e) => {
    let val = parseInt(e.target.value);
    if (val < 1) val = 1;
    if (val > 1000) val = 1000;
    state.settings.dailyLimit = val;
    syncToLocal();
    if (state.user) {
        const { error } = await sb.from('profiles').upsert({ id: state.user.id, daily_limit: val });
        if (error) console.warn("Failed to persist daily limit");
    }
};

document.getElementById('settings-default-separator').onchange = async (e) => {
    state.settings.defaultSeparator = e.target.value;
    syncToLocal();
    if (state.user) {
        const { error } = await sb.from('profiles').upsert({ id: state.user.id, default_separator: e.target.value });
        if (error) console.warn("Failed to persist separator");
    }
};

document.getElementById('settings-auto-flip').onchange = async (e) => {
    state.settings.autoFlip = e.target.checked;
    syncToLocal();
    if (state.user) {
        const { error } = await sb.from('profiles').upsert({ id: state.user.id, auto_flip: state.settings.autoFlip });
        if (error) console.warn("Failed to persist auto-flip");
    }
};

document.getElementById('settings-show-progress').onchange = async (e) => {
    state.settings.showProgress = e.target.checked;
    syncToLocal();
    if (state.user) {
        const { error } = await sb.from('profiles').upsert({ id: state.user.id, show_progress: state.settings.showProgress });
        if (error) console.warn("Failed to persist show-progress");
    }
};

function handleSystemThemeChange() {
    if (state.settings.theme === 'system') {
        applyTheme('system', false);
    }
}

document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = document.getElementById('settings-username').value;
    const btn = e.target.querySelector('button[type="submit"]');
    if (!btn) return; // safety
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Saving...';

    const { error } = await sb.from('profiles').upsert({ id: state.user.id, username: newUsername });

    btn.disabled = false;
    btn.textContent = originalText;

    if (error) {
        if (error.code === '23505') showToast('Username already taken', 'error');
        else showToast(error.message, 'error');
    } else {
        state.user.username = newUsername;
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) userDisplay.textContent = newUsername;
        document.getElementById('settings-display-name').textContent = newUsername;
        showToast('Profile updated successfully');
        // Update avatar
        document.getElementById('settings-profile-avatar').textContent = newUsername.charAt(0).toUpperCase();
    }
});


document.getElementById('back-to-dashboard').addEventListener('click', () => {
    // Return to where we came from
    const target = state.deckOrigin || 'decks-view';
    state.currentDeck = null;
    switchView(target);

    if (target === 'decks-view') loadDecksView();
    else if (target === 'today-view') loadTodayView();
    else if (target === 'community-view') loadCommunityDecks();
    else if (target === 'group-detail-view' && state.currentGroup) loadGroupDetails(state.currentGroup.id);
    else if (target === 'groups-view') loadGroups();
});

async function deleteDeck(deckId) {
    const { error } = await sb.from('decks').delete().eq('id', deckId);
    if (error) {
        showToast(error.message, 'error');
    } else {
        showToast('Deck deleted');
        closeModal();
        switchView('decks-view');
        loadDecksView();
    }
}

document.getElementById('delete-deck-btn').addEventListener('click', async () => {
    if (!state.currentDeck) return;
    if (confirm(`Are you sure you want to delete "${state.currentDeck.title}"?`)) {
        await deleteDeck(state.currentDeck.id);
    }
});

function updateNav(activeId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(activeId).classList.add('active');
}

// --- Realtime ---

function setupRealtime() {
    cleanupRealtime();

    const channel = sb.channel('main-realtime');

    channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'decks' }, (payload) => {
            console.log('Realtime change [decks]:', payload);
            if (state.lastView === 'decks-view') loadDecksView(true);
            if (state.lastView === 'today-view') loadTodayView();
            if (state.lastView === 'groups-view') loadGroups();
            if (state.lastView === 'group-detail-view' && state.currentGroup) loadGroupDetails(state.currentGroup.id);
            if (state.lastView === 'deck-view' && state.currentDeck && (payload.new?.id === state.currentDeck.id || payload.old?.id === state.currentDeck.id)) {
                if (payload.eventType === 'UPDATE') {
                    state.currentDeck.title = payload.new.title;
                    state.currentDeck.description = payload.new.description;
                    const titleEl = document.getElementById('current-deck-title');
                    if (titleEl) titleEl.textContent = payload.new.title;
                    const descEl = document.getElementById('current-deck-description');
                    if (descEl) descEl.textContent = payload.new.description || '';
                } else if (payload.eventType === 'DELETE') {
                    showToast('This deck has been deleted', 'info');
                    switchView(state.deckOrigin || 'decks-view');
                    loadDecksView(true);
                }
            }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, (payload) => {
            console.log('Realtime change [cards]:', payload);
            if (state.lastView === 'deck-view' && state.currentDeck && (payload.new?.deck_id === state.currentDeck.id || payload.old?.deck_id === state.currentDeck.id)) {
                openDeck(state.currentDeck);
            }
            if (state.lastView === 'today-view') loadTodayView();
            if (state.lastView === 'decks-view') loadDecksView(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, (payload) => {
            if (state.lastView === 'decks-view') loadDecksView(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'study_logs' }, (payload) => {
            if (state.lastView === 'today-view') loadTodayView();
            if (state.lastView === 'insights-view') loadStats();
            if (state.lastView === 'deck-view' && state.currentDeck) openDeck(state.currentDeck);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, (payload) => {
            if (state.lastView === 'groups-view') loadGroups();
            if (state.lastView === 'group-detail-view' && state.currentGroup && payload.new?.id === state.currentGroup.id) {
                if (payload.eventType === 'UPDATE') {
                    document.getElementById('group-detail-title').textContent = payload.new.name;
                    document.getElementById('group-invite-code').textContent = payload.new.invite_code || '---------';
                }
            }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, (payload) => {
            if (state.lastView === 'groups-view') loadGroups();
            if (state.lastView === 'group-detail-view' && state.currentGroup && (payload.new?.group_id === state.currentGroup.id || payload.old?.group_id === state.currentGroup.id)) {
                loadGroupDetails(state.currentGroup.id);
            }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
            if (payload.new?.id === state.user?.id) {
                fetchUserProfile();
            }
        })
        .subscribe();

    state.channels.main = channel;
}

function cleanupRealtime() {
    if (state.channels.main) sb.removeChannel(state.channels.main);
}


// --- Tags Management ---

async function loadTags() {
    const { data } = await sb.from('tags').select('*').order('name');
    if (data) state.tags = data;
}

// Ensure tags exist, return IDs. Takes array of string names.
async function resolveTags(tagNames) {
    if (!tagNames || tagNames.length === 0) return [];

    const resolvedIds = [];
    const uniqueNames = [...new Set(tagNames.map(t => t.trim().toLowerCase()).filter(t => t))];

    for (const name of uniqueNames) {
        let tag = state.tags.find(t => t.name === name);
        if (!tag) {
            // Create new tag
            const { data, error } = await sb.from('tags').insert([{ user_id: state.user.id, name }]).select().single();
            if (data) {
                state.tags.push(data);
                tag = data;
            }
        }
        if (tag) resolvedIds.push(tag.id);
    }
    return resolvedIds;
}

// --- Dashboard (Decks) ---

// --- TODAY View ---

async function loadTodayView() {
    // 1. Greeting
    const hour = new Date().getHours();
    const greetingEl = document.getElementById('today-greeting');
    if (greetingEl) {
        if (hour < 12) greetingEl.textContent = 'Good morning, ready to learn?';
        else if (hour < 18) greetingEl.textContent = 'Good afternoon, keep it up!';
        else greetingEl.textContent = 'Good evening, time for a review?';
    }

    const dateEl = document.getElementById('today-date');
    if (dateEl) {
        const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', dateOptions);
    }

    // 2. Fetch Due Cards count across ALL deck
    // We need to fetch all cards for user? Or just count.
    // Optimization: Call a stored procedure if possible, or select count.
    // For now, client-side filtering of decks -> cards might be heavy but simple.
    // Better: Fetch cards with due_at <= now()

    const now = new Date().toISOString();
    const { count, error } = await sb
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .lte('due_at', now); // due_at <= now
    // RLS ensures we only see our cards (or decks we have access to?)
    // Actually, cards table should have RLS.

    if (!error) {
        document.getElementById('today-due-count').textContent = count || 0;
    }

    // 3. Streak (Mock logic since we don't have daily activity log easily accessible without complex query)
    // We can check study_logs for distinct days.
    // 3. Streak & Mastery & Retention using Study Logs
    // We fetch a reasonable amount of recent logs to calculate these metrics.
    const { data: logs } = await sb.from('study_logs')
        .select('review_time, rating')
        .eq('user_id', state.user.id)
        .order('review_time', { ascending: false })
        .limit(2000); // Fetch enough history for decent stats

    let streak = 0;
    let totalScore = 0;
    let totalReviews = 0;
    let goodEasyCount = 0;

    if (logs && logs.length > 0) {
        // --- Calculate Streak ---
        const dates = [...new Set(logs.map(l => new Date(l.review_time).toDateString()))];
        let checkDate = new Date();
        while (true) {
            const checkStr = checkDate.toDateString();
            if (dates.includes(checkStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // Check if we missed today but have yesterday (streak still active for yesterday)
                if (streak === 0 && checkDate.toDateString() === new Date().toDateString()) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                }
                break;
            }
        }

        // --- Calculate Stats ---
        logs.forEach(l => {
            totalScore += (l.rating || 0);
            totalReviews++;
            if (l.rating >= 3) goodEasyCount++;
        });
    }
    document.getElementById('streak-count').textContent = streak;

    // --- Mastery Calculation (Matches Group View Logic) ---
    // Mastery = Average Rating % (Score / MaxPossibleScore)
    // Max Possible Score = Reviews * 4
    const mastery = totalReviews > 0 ? Math.round((totalScore / (totalReviews * 4)) * 100) : 0;

    document.getElementById('mastery-percent').textContent = `${mastery}%`;
    document.getElementById('mastery-bar').style.width = `${mastery}%`;

    const masteryLabel = document.getElementById('mastery-label');
    if (masteryLabel) {
        if (mastery < 10) masteryLabel.textContent = 'Novice';
        else if (mastery < 40) masteryLabel.textContent = 'Apprentice';
        else if (mastery < 80) masteryLabel.textContent = 'Expert';
        else masteryLabel.textContent = 'Master';
    }

    // --- Retention Calculation (Good+Easy / Total) ---
    const retention = totalReviews > 0 ? Math.round((goodEasyCount / totalReviews) * 100) : 0;
    const retentionText = document.getElementById('retention-text');
    if (retentionText) {
        retentionText.textContent = retention + '%';
        retentionText.style.color = 'var(--text-primary)';
    }

    drawRetentionDonut(retention);



    // 5. Smart Recommendations (Focus Decks)
    await loadFocusDecks();
}

async function loadFocusDecks() {
    // Logic: Find decks with cards due now or soon. Sort by "Urgency" (Earliest Due).
    // Fetch all cards due <= now
    // We already have decks in state, let's use that if populated, else fetch.
    // Ideally we assume loadDecksView might not have run yet if we land on Today.
    // So let's fetch decks + card counts.

    // Efficient approach:
    // 1. Fetch decks.
    // 2. For each deck, count due cards. (Or use a view/RPC, but let's do client-side agg for now if decks < 100)

    const { data: decks } = await sb.from('decks').select('id, title, user_id, subject_id');
    if (!decks) return;

    const { data: cards } = await sb.from('cards')
        .select('deck_id, due_at')
        .lte('due_at', new Date().toISOString());

    const deckStats = {};
    if (cards) {
        cards.forEach(c => {
            if (!deckStats[c.deck_id]) deckStats[c.deck_id] = { count: 0, earliest: c.due_at };
            deckStats[c.deck_id].count++;
            if (c.due_at < deckStats[c.deck_id].earliest) deckStats[c.deck_id].earliest = c.due_at;
        });
    }

    // Filter decks with due cards
    const focusDecks = decks.filter(d => deckStats[d.id] && deckStats[d.id].count > 0);

    // Sort: Earliest due date first, then count desc
    focusDecks.sort((a, b) => {
        const statsA = deckStats[a.id];
        const statsB = deckStats[b.id];
        if (new Date(statsA.earliest) - new Date(statsB.earliest) !== 0) return new Date(statsA.earliest) - new Date(statsB.earliest);
        return statsB.count - statsA.count;
    });

    // Take top 3
    const top3 = focusDecks.slice(0, 3);

    // Render
    const container = document.getElementById('today-focus-grid'); // Need to ensure this exists in HTML or index.html
    // If not exists (it likely doesn't in original), we should check or inject.
    // Let's assume we might need to add it to HTML. 
    // Wait, I didn't check `index.html` for `today-focus-grid`. 
    // Use `today-view` content.

    // Only proceed if we can find a place to put it. 
    // Existing HTML has a basic layout. Let's append or replace a "Quick Start" section if it exists.
    // Or simpler: Just log for now if element missing? No, user wants features.
    // I will use `available-decks-list` if it exists, or create a container.
    // Actually, looking at `index.html` (mentally), `today-view` usually has stats. 
    // I'll try to find a suitable container or append to `today-view`.

    let focusContainer = document.getElementById('today-focus-section');
    if (!focusContainer) {
        // Create it after options-grid
        const view = document.getElementById('today-view');
        focusContainer = document.createElement('div');
        focusContainer.id = 'today-focus-section';
        focusContainer.className = 'mt-30';
        focusContainer.innerHTML = `<h3 class="text-lg font-semibold mb-4">Ready to Learn</h3><div id="today-focus-grid" class="grid-container"></div>`;
        view.appendChild(focusContainer);
    }

    const grid = document.getElementById('today-focus-grid');
    grid.innerHTML = '';

    if (top3.length === 0) {
        grid.innerHTML = `<p class="text-dim col-span-full">All caught up! Great job.</p>`;
        return;
    }

    top3.forEach(deck => {
        const stats = deckStats[deck.id];
        const div = document.createElement('div');
        div.className = 'dashboard-card';
        div.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <span class="badge badge-due">${stats.count} Due</span>
            </div>
            <h4 class="font-semibold text-lg mb-1">${escapeHtml(deck.title)}</h4>
            <p class="text-sm text-dim mb-4">Next review: Now</p>
            <button class="btn btn-primary btn-sm w-full">Study Now</button>
        `;
        div.onclick = () => {
            state.currentDeck = deck; // Need full deck obj? We have simplified one. 
            // Better to fetch full deck or just navigate to deck view then study.
            // Let's navigate to deck view to be safe.
            state.lastView = 'today-view'; // Return here?
            openDeck(deck);
        };
        grid.appendChild(div);
    });
}

function drawRetentionDonut(percent) {
    const canvas = document.getElementById('retention-donut');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Handle High DPI
    const dpr = window.devicePixelRatio || 1;
    const size = 120;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const radius = size / 2;
    const lineWidth = 10;
    const center = size / 2;

    ctx.clearRect(0, 0, size, size);

    // Background circle
    ctx.beginPath();
    ctx.arc(center, center, radius - lineWidth, 0, 2 * Math.PI);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Progress arc
    if (percent > 0) {
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (2 * Math.PI * (percent / 100));

        // Create gradient for better look
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, '#2563eb');
        gradient.addColorStop(1, '#3b82f6'); // A slightly different blue

        ctx.beginPath();
        ctx.arc(center, center, radius - lineWidth, startAngle, endAngle);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    // Percentage text in middle (if we want to draw it on canvas too, but HTML is better)
    // The HTML element #retention-text is already centered via CSS.
}

// Utility for subject colors
function getSubjectColor(name) {
    if (!name) return 'linear-gradient(135deg, #64748b, #475569)'; // Gray for no subject

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert to HSL
    // Hue: 0-360
    // Saturation: 60-80% for vibrant but not neon
    // Lightness: 25-40% for dark enough for white text
    const h = Math.abs(hash % 360);
    const s = 65 + (Math.abs(hash % 15));
    const l = 30 + (Math.abs(hash % 10));

    return `hsl(${h}, ${s}%, ${l}%)`;
}

document.getElementById('start-today-review-btn').addEventListener('click', () => {
    // Start session with all due cards
    state.studySessionConfig = { type: 'standard' };
    startStudySession(); // Logic needs to handle "All Decks" if null currentDeck
});


// --- Decks View (List Layout) ---

async function loadDecksView(force = false) {
    if (state.decks.length > 0 && !force) {
        renderDecksViewWithSubjects();
        return;
    }

    const { data: decks, error } = await sb.from('decks').select('*').order('created_at', { ascending: false });

    if (error) return showToast(error.message, 'error');

    // Fetch stats for decks
    const stats = {};
    const { data: cards } = await sb.from('cards').select('id, deck_id, due_at, interval_days');

    // Fetch logs to calculate mastery
    const { data: logs } = await sb.from('study_logs')
        .select('card_id, rating')
        .eq('user_id', state.user.id)
        .order('review_time', { ascending: false })
        .limit(5000);

    const cardMastery = new Map();
    if (logs) {
        const seen = new Set();
        logs.forEach(log => {
            if (!seen.has(log.card_id)) {
                seen.add(log.card_id);
                if (log.rating >= 3) cardMastery.set(log.card_id, true);
            }
        });
    }

    const now = new Date();
    if (cards) {
        cards.forEach(card => {
            if (!stats[card.deck_id]) stats[card.deck_id] = { total: 0, due: 0, new: 0, mature: 0 };
            stats[card.deck_id].total++;
            const due = card.due_at ? new Date(card.due_at) : null;
            const interval = Number(card.interval_days || 0);
            if (interval === 0) stats[card.deck_id].new++;
            if (interval > 0 && (due && due <= now)) stats[card.deck_id].due++;
            if (cardMastery.get(card.id)) stats[card.deck_id].mature++;
        });
    }

    state.decks = (decks || []).map(d => ({ ...d, stats: stats[d.id] || { total: 0, due: 0, new: 0, mature: 0 } }));

    // Fetch Subjects
    const { data: subjects } = await sb.from('subjects').select('*').order('name');
    state.subjects = subjects || [];

    renderDecksViewWithSubjects();
}

function renderDecksViewWithSubjects() {
    const list = document.getElementById('deck-list');
    list.innerHTML = '';

    const filteredDecks = state.deckTab === 'shared'
        ? state.decks.filter(d => d.user_id !== state.user.id)
        : state.decks.filter(d => d.user_id === state.user.id);

    // Default message when no decks exist in 'My Decks'
    if (state.deckTab === 'my' && filteredDecks.length === 0 && state.subjects.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div style="width: 100%; text-align: center; margin: 100px 0">
                    <h3>No Decks Yet</h3>
                    <p>Create your first deck or subject to start organizing your learning.</p>
                    <button class="btn btn-primary mt-4" onclick="document.getElementById('create-deck-btn').click()">Create Deck</button>
                </div>  
            </div>
        `;
        return;
    }

    if (state.deckTab === 'shared' && filteredDecks.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div style="width: 100%; text-align: center; margin: 100px 0">
                    <h3>No Shared Decks</h3>
                    <p>Decks shared with you will appear here.</p>
                </div>  
            </div>
        `;
        return;
    }

    // 1. Render Subjects (including empty ones if in 'my' tab)
    state.subjects.forEach(subject => {
        const subjectDecks = filteredDecks.filter(d => d.subject_id === subject.id);

        const subjectSection = document.createElement('div');
        subjectSection.className = 'subject-section';

        // Add drag target for subjects
        if (state.deckTab === 'my') {
            subjectSection.ondragover = (e) => {
                e.preventDefault();
                subjectSection.classList.add('drag-over');
            };
            subjectSection.ondragleave = () => subjectSection.classList.remove('drag-over');
            subjectSection.ondrop = async (e) => {
                e.preventDefault();
                subjectSection.classList.remove('drag-over');
                const deckId = e.dataTransfer.getData('deckId');
                if (deckId) {
                    await updateDeckSubject(deckId, subject.id);
                }
            };
        }

        subjectSection.innerHTML = `
            <div class="subject-header">
                <div class="subject-title-group">
                    <button class="btn-icon-only-sm" onclick="toggleSubject('${subject.id}')">
                        <svg id="chevron-${subject.id}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="icon-sm transition-transform">
                            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                        </svg>
                    </button>
                    <span class="subject-name">${escapeHtml(subject.name)}</span>
                    <span class="subject-count">${subjectDecks.length}</span>
                </div>
                ${state.deckTab === 'my' ? `
                <div class="subject-actions">
                     <button class="btn-icon-only-sm context-trigger" onclick="openSubjectContext(event, '${subject.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                        </svg>
                    </button>
                </div>` : ''}
            </div>
            <div id="subject-content-${subject.id}" class="subject-content"></div>
        `;
        list.appendChild(subjectSection);
        const contentDiv = subjectSection.querySelector(`#subject-content-${subject.id}`);
        subjectDecks.forEach(deck => renderDeckRow(deck, contentDiv));

        // If empty and in 'my' tab, show a small hint
        if (subjectDecks.length === 0 && state.deckTab === 'my') {
            const hint = document.createElement('div');
            hint.className = 'subject-empty-hint';
            hint.textContent = 'Drop decks here';
            contentDiv.appendChild(hint);
        }
    });

    // 2. Render Uncategorized Decks
    const uncategorized = filteredDecks.filter(d => !d.subject_id);
    if (uncategorized.length > 0 || state.deckTab === 'my') {
        const uncategorizedSection = document.createElement('div');
        uncategorizedSection.className = 'subject-section';

        // Add drag target for uncategorized
        if (state.deckTab === 'my') {
            uncategorizedSection.ondragover = (e) => {
                e.preventDefault();
                uncategorizedSection.classList.add('drag-over');
            };
            uncategorizedSection.ondragleave = () => uncategorizedSection.classList.remove('drag-over');
            uncategorizedSection.ondrop = async (e) => {
                e.preventDefault();
                uncategorizedSection.classList.remove('drag-over');
                const deckId = e.dataTransfer.getData('deckId');
                if (deckId) {
                    await updateDeckSubject(deckId, null);
                }
            };
        }

        uncategorizedSection.innerHTML = `
             <div class="subject-header">
                <span class="subject-name" style="margin-left: 2rem;">Uncategorized Decks</span>
                <span class="subject-count">${uncategorized.length}</span>
            </div>
            <div class="subject-content"></div>
        `;
        list.appendChild(uncategorizedSection);
        const contentDiv = uncategorizedSection.querySelector('.subject-content');
        uncategorized.forEach(deck => renderDeckRow(deck, contentDiv));
    }
}

function renderDeckRow(deck, container) {
    const stats = deck.stats || { total: 0, due: 0 };
    const row = document.createElement('div');
    row.className = 'deck-row';

    // Add draggable attributes
    if (state.deckTab === 'my') {
        row.setAttribute('draggable', 'true');
        row.ondragstart = (e) => {
            e.dataTransfer.setData('deckId', deck.id);
            row.classList.add('dragging');
        };
        row.ondragend = () => row.classList.remove('dragging');
    }

    row.innerHTML = `
        <div class="deck-info">
            <span class="deck-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="icon-sm">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
            </span>
            <div class="deck-text">
                <div class="deck-title">${escapeHtml(deck.title)}</div>
                <div class="deck-meta">${stats.total} cards • ${deck.is_public ? 'Public' : 'Private'}</div>
            </div>
        </div>
        <div class="deck-status">
            ${stats.due > 0 ? `<span class="badge badge-due">${stats.due} Due</span>` : `<span class="badge badge-success">All Done</span>`}
        </div>
        <div class="deck-actions-cell" onclick="event.stopPropagation()">
            <button class="btn btn-icon-only context-trigger" onclick="openDeckContext(event, '${deck.id}')" style="width: 24px; height: 24px; padding: 0;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="icon-sm">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
            </button>
        </div>
    `;
    row.onclick = () => {
        state.lastView = 'decks-view';
        openDeck(deck);
    };
    container.appendChild(row);
}

// Subject Actions
window.createSubject = () => {
    document.getElementById('new-subject-name').value = '';
    openModal('create-subject-modal');
};

document.getElementById('create-subject-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-subject-name').value;
    const { error } = await sb.from('subjects').insert([{ user_id: state.user.id, name }]);
    if (error) showToast(error.message, 'error');
    else {
        showToast('Subject created');
        closeModal();
        loadDecksView(true);
    }
});

window.toggleSubject = (id) => {
    const content = document.getElementById(`subject-content-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);
    if (content) {
        content.classList.toggle('hidden');
        if (chevron) {
            chevron.style.transform = content.classList.contains('hidden') ? 'rotate(-90deg)' : 'rotate(0deg)';
        }
    }
}

// Context Menu Logic
window.openDeckContext = (e, deckId) => {
    e.stopPropagation();
    const deck = state.decks.find(d => d.id === deckId);
    if (!deck) return;

    const options = [
        { label: 'Study', action: () => { state.currentDeck = deck; state.studySessionConfig = { type: 'standard' }; startStudySession(); } },
        { label: 'Edit', action: () => openDeck(deck) },
        { label: 'Rename', action: () => renameDeck(deck) },
        { label: 'Move to Subject', action: () => moveDeckToSubject(deck) },
        { label: 'Delete', danger: true, action: () => deleteDeckQuick(deck) }
    ];
    renderContextMenu(e.clientX, e.clientY, options);
};

window.openSubjectContext = (e, subjectId) => {
    e.stopPropagation();
    const subject = state.subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const options = [
        { label: 'Rename', action: () => renameSubject(subject) },
        { label: 'Delete', danger: true, action: () => deleteSubject(subject) }
    ];
    renderContextMenu(e.clientX, e.clientY, options);
};

function renderContextMenu(x, y, options) {
    // Remove existing
    const existing = document.querySelector('.context-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.top = `${y}px`;
    menu.style.left = `${x}px`;

    options.forEach(opt => {
        const item = document.createElement('div');
        item.className = `context-menu-item ${opt.danger ? 'text-danger' : ''}`;
        item.textContent = opt.label;
        item.onclick = () => {
            opt.action();
            menu.remove();
        };
        menu.appendChild(item);
    });

    document.body.appendChild(menu);

    // Adjust if offscreen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = `${window.innerWidth - rect.width - 10}px`;
    if (rect.bottom > window.innerHeight) menu.style.top = `${window.innerHeight - rect.height - 10}px`;

    // Close on click outside
    setTimeout(() => {
        const closeListener = () => {
            menu.remove();
            document.removeEventListener('click', closeListener);
        };
        document.addEventListener('click', closeListener);
    }, 100);
}
async function updateDeckSubject(deckId, subjectId) {
    const { error } = await sb.from('decks').update({ subject_id: subjectId }).eq('id', deckId);
    if (error) showToast(error.message, 'error');
    else {
        showToast('Deck moved');
        loadDecksView(true);
    }
}


function moveDeckToSubject(deck) {
    // Populate select
    const select = document.getElementById('move-deck-subject-select');
    select.innerHTML = '<option value="">Uncategorized</option>';
    state.subjects.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.textContent = s.name;
        if (deck.subject_id === s.id) option.selected = true;
        select.appendChild(option);
    });

    document.getElementById('move-deck-id').value = deck.id;
    openModal('move-deck-modal');
}

document.getElementById('move-deck-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const deckId = document.getElementById('move-deck-id').value;
    const subjectId = document.getElementById('move-deck-subject-select').value || null;

    const { error } = await sb.from('decks').update({ subject_id: subjectId }).eq('id', deckId);
    if (error) showToast(error.message, 'error');
    else {
        showToast('Deck moved');
        closeModal();
        loadDecksView(true);
    }
});

async function deleteDeckQuick(deck) {
    if (confirm(`Delete "${deck.title}"?`)) {
        await sb.from('decks').delete().eq('id', deck.id);
        loadDecksView(true);
    }
}

window.renameSubject = (subject) => {
    document.getElementById('rename-modal-title').textContent = 'Rename Subject';
    document.getElementById('rename-item-id').value = subject.id;
    document.getElementById('rename-item-type').value = 'subject';
    document.getElementById('rename-input').value = subject.name;

    // Hide description
    const descGroup = document.getElementById('rename-description-group');
    if (descGroup) {
        descGroup.classList.add('hidden');
    }

    openModal('rename-modal');
};

window.renameDeck = (deck) => {
    document.getElementById('deck-settings-id').value = deck.id;
    document.getElementById('deck-settings-title').value = deck.title;
    document.getElementById('deck-settings-description').value = deck.description || '';

    // Setup Delete Button in Modal
    const deleteBtn = document.getElementById('modal-delete-deck-btn');
    if (deleteBtn) {
        deleteBtn.onclick = () => {
            if (confirm(`Are you sure you want to delete "${deck.title}"? This cannot be undone.`)) {
                deleteDeck(deck.id);
            }
        };
    }

    openModal('deck-settings-modal');
}

document.getElementById('deck-settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('deck-settings-id').value;
    const title = document.getElementById('deck-settings-title').value.trim();
    const description = document.getElementById('deck-settings-description').value.trim();

    if (!title) return;

    try {
        const { error } = await sb.from('decks').update({ title, description }).eq('id', id);
        if (error) throw error;

        showToast('Deck settings saved', 'success');
        closeModal();

        // Refresh State & UI
        await loadDecks();
        if (state.currentDeck && state.currentDeck.id === id) {
            state.currentDeck.title = title;
            state.currentDeck.description = description;
            renderDeckView(state.currentDeck);
        }
    } catch (err) {
        console.error(err);
        showToast('Error saving settings', 'error');
    }
});

document.getElementById('rename-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('rename-item-id').value;
    const type = document.getElementById('rename-item-type').value;
    const name = document.getElementById('rename-input').value.trim();
    const description = document.getElementById('rename-description-input').value;

    if (!name) return;

    if (type === 'subject') {
        const { error } = await sb.from('subjects').update({ name }).eq('id', id);
        if (error) showToast(error.message, 'error');
        else { showToast('Subject renamed'); loadDecksView(true); }
    } else if (type === 'deck') {
        const { error } = await sb.from('decks').update({ title: name, description }).eq('id', id);
        if (error) showToast(error.message, 'error');
        else {
            showToast('Deck updated');

            // If we are currently viewing this deck, update the title and description in the UI
            if (state.currentDeck && state.currentDeck.id === id) {
                state.currentDeck.title = name;
                state.currentDeck.description = description;
                const titleEl = document.getElementById('current-deck-title');
                if (titleEl) titleEl.textContent = name;
                const descEl = document.getElementById('current-deck-description');
                if (descEl) descEl.textContent = description;

                // If we also have a separate detailed description area or if description is used elsewhere
                // Ensure it propagates.
            }

            loadDecksView(true);
        }
    }
    closeModal();
});

async function deleteSubject(subject) {
    if (confirm(`Delete subject "${subject.name}"? Decks will be uncategorized.`)) {
        await sb.from('subjects').delete().eq('id', subject.id);
        loadDecksView(true);
    }

}

// --- Insights View ---

// Removed redundant loadInsights and renderInsightsCharts as they were conflicting with loadStats


function renderHeatmapPlaceholder() {
    const container = document.getElementById('calendar-heatmap');
    if (!container) return;
    container.innerHTML = '';
    // Simple block grid for visual effect
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(53, 1fr)'; // Weeks
    container.style.gap = '2px';

    // Mock data: 365 days
    for (let i = 0; i < 365; i++) {
        const div = document.createElement('div');
        div.style.width = '100%';
        div.style.paddingBottom = '100%'; // Square
        div.style.borderRadius = '2px';

        // Random usage
        const intensity = Math.random();
        let color = '#eff6ff'; // empty
        if (intensity > 0.9) color = '#1e3a8a'; // heavy
        else if (intensity > 0.7) color = '#3b82f6';
        else if (intensity > 0.4) color = '#93c5fd';
        else if (intensity > 0.2) color = '#dbeafe';

        div.style.backgroundColor = color;
        container.appendChild(div);
    }
}

// Redundant mock functions removed. loadStats handles all chart rendering.


function renderDecks() {
    const grid = document.getElementById('deck-grid');
    grid.innerHTML = '';

    if (state.decks.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-secondary);">No decks found.</div>';
        return;
    }

    state.decks.forEach(deck => {
        const stats = deck.stats || { total: 0, due: 0, new: 0, mature: 0 };
        const mastery = stats.total > 0 ? Math.round((stats.mature / stats.total) * 100) : 0;

        // Find group name if it belongs to one
        const group = state.groups.find(g => g.id === deck.group_id);

        const div = document.createElement('div');
        div.className = 'deck-card';
        div.innerHTML = `
            <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div class="deck-title" style="margin-bottom:0">${escapeHtml(deck.title)}</div>
                ${group ? `<span class="group-pill" style="font-size: 0.65rem; background: #eff6ff; color: var(--primary); border: 1px solid #dbeafe; padding: 2px 6px; border-radius: 4px;">${escapeHtml(group.name)}</span>` : ''}
            </div>
            <div class="deck-desc">${escapeHtml(deck.description || '')}</div>
            <div style="margin-top: 1rem;">
                ${deck.is_public ? '<span class="badge" style="background:var(--success);color:white;font-size:0.7em">Public</span>' : ''}
            </div>
            <div class="deck-stats">
                <div style="flex:1">
                    <div style="font-weight:600; font-size:1.1rem">${stats.total}</div>
                    <div style="font-size:0.75rem;color:var(--text-secondary)">Cards</div>
                </div>
                <div style="flex:1">
                    <div class="stat-due" style="font-size:1.1rem">${stats.due}</div>
                    <div style="font-size:0.75rem;color:var(--text-secondary)">Due</div>
                </div>
                <div style="flex:1">
                    <div style="font-weight:600; font-size:1.1rem; color:var(--primary)">${mastery || 0}%</div>
                    <div style="font-size:0.75rem;color:var(--text-secondary)">Mastery</div>
                </div>
            </div>
        `;
        div.onclick = () => {
            state.lastView = 'decks-view';
            openDeck(deck);
        };
        grid.appendChild(div);
    });

    // Render Saved/Shortcut Decks
    if (state.savedDecks && state.savedDecks.length > 0) {
        // Separator
        const sep = document.createElement('div');
        sep.style.gridColumn = '1/-1';
        sep.style.marginTop = '1rem';
        sep.innerHTML = '<h3>Saved Decks</h3>';
        grid.appendChild(sep);

        state.savedDecks.forEach(deck => {
            const div = document.createElement('div');
            div.className = 'deck-card';
            div.style.borderColor = 'var(--primary)'; // Visual distinction
            div.innerHTML = `
                <div>
                    <div class="deck-title">${escapeHtml(deck.title)}</div>
                     <div class="deck-desc">${escapeHtml(deck.description || '')}</div>
                     <span class="badge" style="background:var(--secondary);color:white;font-size:0.7em">Shortcut</span>
                </div>
            `;
            div.onclick = () => openDeck(deck);
            grid.appendChild(div);
        });
    }
}

document.getElementById('create-deck-btn').addEventListener('click', () => openModal('create-deck-modal'));
document.getElementById('create-deck-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('new-deck-title').value;
    const description = document.getElementById('new-deck-desc').value;

    const payload = {
        user_id: state.user.id,
        title,
        description,
        is_public: false
    };

    if (state.creatingDecForGroup) {
        payload.group_id = state.creatingDecForGroup;
        // Verify we are still in that view?
    }

    const { error } = await sb.from('decks').insert([payload]);
    if (error) showToast(error.message, 'error');
    else {
        closeModal();
        showToast('Deck created');
        if (state.creatingDecForGroup) {
            loadGroupDetails(state.creatingDecForGroup);
            state.creatingDecForGroup = null; // Reset
        } else {
            loadDecksView(true);
        }
    }
});


// --- Deck Details & Cards ---

async function openDeck(deck) {
    // Only update origin if coming from a main view, not internal views (like refresh or back from study)
    const validOrigins = ['decks-view', 'community-view', 'groups-view', 'group-detail-view', 'today-view'];
    if (validOrigins.includes(state.lastView)) {
        state.deckOrigin = state.lastView;
    }

    state.currentDeck = deck;
    document.getElementById('current-deck-title').textContent = deck.title;
    const descEl = document.getElementById('current-deck-description');
    if (descEl) descEl.textContent = deck.description || '';

    const publicBadge = document.getElementById('deck-public-badge');

    if (deck.is_public) {
        publicBadge.classList.remove('hidden');
    } else {
        publicBadge.classList.add('hidden');
    }

    switchView('deck-view');

    // Set Stats
    const stats = deck.stats || { total: 0, due: 0, new: 0, mature: 0 };
    const mastery = stats.total > 0 ? Math.round((stats.mature / stats.total) * 100) : 0;

    const masteryPercentEl = document.getElementById('deck-mastery-percent');
    if (masteryPercentEl) masteryPercentEl.textContent = `${mastery}%`;

    const circleFill = document.getElementById('deck-mastery-circle-fill');
    if (circleFill) {
        const circumference = 283; // Approx 2 * pi * 45
        const offset = circumference - (mastery / 100) * circumference;
        circleFill.style.strokeDashoffset = offset;
    }

    const dueEl = document.getElementById('deck-due-count');
    if (dueEl) dueEl.textContent = stats.due || 0;

    const newEl = document.getElementById('deck-new-count');
    if (newEl) newEl.textContent = stats.new || 0;

    const totalEl = document.getElementById('deck-total-count');
    if (totalEl) totalEl.textContent = stats.total || 0;

    // UI Robustness: Toggle visibility of editor-only features
    const isOwner = state.user && deck.user_id === state.user.id;

    // Header Actions Visibility
    const utilityActions = document.querySelector('.deck-utility-actions');
    if (utilityActions) {
        utilityActions.style.display = 'flex'; // Always flex if public or owner

        const shareBtn = document.getElementById('toggle-public-btn');
        const settingsBtn = document.getElementById('deck-settings-btn');
        const deleteBtn = document.getElementById('delete-deck-btn');
        const canEdit = isOwner || (deck.group_id && canEditGroupDeck(deck));
        if (shareBtn) {
            shareBtn.style.display = canEdit ? 'flex' : 'none';
            shareBtn.onclick = () => openShareModal(deck);
        }
        if (settingsBtn) {
            settingsBtn.style.display = canEdit ? 'flex' : 'none';
            settingsBtn.onclick = () => renameDeck(deck);
        }
        if (deleteBtn) deleteBtn.style.display = canEdit ? 'flex' : 'none';

        // Import for non-owners
        const importUtilityBtn = document.getElementById('import-to-my-decks-btn');
        if (importUtilityBtn) {
            importUtilityBtn.classList.toggle('hidden', isOwner);
            importUtilityBtn.style.display = isOwner ? 'none' : 'flex';
            importUtilityBtn.onclick = () => importDeck(deck.id);
        }
    }

    // 2. "Add Card" button handling
    const addCardBtn = document.getElementById('add-card-btn');
    if (addCardBtn) addCardBtn.style.display = (isOwner || (deck.group_id && canEditGroupDeck(deck))) ? 'inline-flex' : 'none';

    // 3. Import Section (CSV)
    const importSection = document.querySelector('.import-section');
    if (importSection) importSection.style.display = (isOwner || (deck.group_id && canEditGroupDeck(deck))) ? 'flex' : 'none';

    // Add/Remove Study-from-Community Import button (bottom row)
    let importBtn = document.getElementById('community-import-btn');
    const actionRow = document.querySelector('.deck-action-row');

    if (!isOwner) {
        if (!importBtn && actionRow) {
            importBtn = document.createElement('button');
            importBtn.id = 'community-import-btn';
            importBtn.className = 'btn btn-secondary action-secondary';
            importBtn.style.height = '48px';
            importBtn.innerHTML = 'Import to My Decks';
            importBtn.onclick = () => importDeck(deck.id);
            actionRow.appendChild(importBtn);
        }
    } else {
        if (importBtn) importBtn.remove();
    }

    updateSaveDeckButton(deck);
    loadCards(deck.id);
}

async function importDeck(deckId) {
    if (state.isGuest) {
        // Fetch deck for preview modal
        const { data: deck } = await sb.from('decks').select('id, title, description').eq('id', deckId).maybeSingle();
        if (deck) showGuestPreview('deck', deck);
        return;
    }
    showToast('Importing deck...', 'info');

    // 1. Fetch deck and cards
    const { data: deck, error: deckError } = await sb.from('decks').select('*').eq('id', deckId).single();
    if (deckError) return showToast(deckError.message, 'error');

    const { data: cards, error: cardsError } = await sb.from('cards').select('*').eq('deck_id', deckId);
    if (cardsError) return showToast(cardsError.message, 'error');

    // 2. Create new deck
    const { data: newDeck, error: newDeckError } = await sb.from('decks').insert([{
        user_id: state.user.id,
        title: `${deck.title} (Imported)`,
        description: deck.description,
        is_public: false
    }]).select().single();

    if (newDeckError) return showToast(newDeckError.message, 'error');

    // 3. Insert cards
    if (cards && cards.length > 0) {
        const cardsToInsert = cards.map(c => ({
            deck_id: newDeck.id,
            front: c.front,
            back: c.back,
            due_at: new Date()
        }));
        const { error: insertError } = await sb.from('cards').insert(cardsToInsert);
        if (insertError) showToast(insertError.message, 'error');
    }

    showToast('Deck imported successfully!');
    if (state.deckTab !== 'my') {
        state.deckTab = 'my';
        const myDecksTab = document.getElementById('my-decks-tab');
        const sharedDecksTab = document.getElementById('shared-decks-tab');
        if (myDecksTab) myDecksTab.classList.add('active');
        if (sharedDecksTab) sharedDecksTab.classList.remove('active');
    }
    loadDecksView();
}

function canEditGroupDeck(deck) {
    // If deck belongs to a group, check if user is admin
    if (!deck.group_id) return false;
    const membership = state.groups.find(g => g.id === deck.group_id); // This might be stale if logic strictly separates lists
    // Simple check: if currentGroup is set and matches
    if (state.currentGroup && state.currentGroup.id === deck.group_id) {
        const memberRec = state.groupMembers.find(m => m.user_id === state.user.id);
        return memberRec && memberRec.role === 'admin';
    }
    return false;
}

async function updateSaveDeckButton(deck) {
    let saveBtn = document.getElementById('save-deck-btn');
    const mainActions = document.querySelector('.deck-main-actions');

    // Check if valid to save: Not my deck, and not already saved
    // "My deck" logic: user_id matches. 
    if (deck.user_id === state.user.id) {
        if (saveBtn) saveBtn.remove();
        return;
    }

    // Check if already saved
    const { data } = await sb.from('saved_decks').select('*').eq('user_id', state.user.id).eq('deck_id', deck.id).maybeSingle();
    const isSaved = !!data;

    if (!saveBtn && mainActions) {
        saveBtn = document.createElement('button');
        saveBtn.id = 'save-deck-btn';
        saveBtn.className = 'btn btn-outline';
        mainActions.prepend(saveBtn);
    }

    if (saveBtn) {
        saveBtn.innerHTML = isSaved ?
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-sm"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> Saved` :
            `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg> Shortcut`;

        saveBtn.onclick = async () => {
            if (isSaved) {
                await sb.from('saved_decks').delete().eq('user_id', state.user.id).eq('deck_id', deck.id);
                showToast('Shortcut removed');
            } else {
                await sb.from('saved_decks').insert([{ user_id: state.user.id, deck_id: deck.id }]);
                showToast('Deck saved to dashboard');
            }
            updateSaveDeckButton(deck); // Toggle
        };
    }
}

// Search state
let cardSearchQuery = '';

document.getElementById('card-search-input').addEventListener('input', (e) => {
    cardSearchQuery = e.target.value.toLowerCase();
    renderCardList();
});

async function loadCards(deckId) {
    // Reset selection mode when loading a new deck
    state.selectionMode = false;
    state.selectedCardIds.clear();
    updateBulkActionsUI();

    // Join with card_tags to get tags
    const { data: cards, error } = await sb
        .from('cards')
        .select(`*, card_tags ( tag_id, tags ( name ) )`)
        .eq('deck_id', deckId)
        .order('created_at', { ascending: false });

    if (error) return showToast(error.message, 'error');
    state.cards = cards;
    renderCardList();
}

function renderCardList() {
    const list = document.getElementById('card-list');
    list.innerHTML = '';

    // Sort strategy
    const sortVal = document.getElementById('card-sort-select').value;
    const sorted = [...state.cards].sort((a, b) => {
        if (sortVal === 'newest') return new Date(b.created_at) - new Date(a.created_at);
        if (sortVal === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
        if (sortVal === 'az') return a.front.localeCompare(b.front);
        if (sortVal === 'za') return b.front.localeCompare(a.front);
        return 0;
    });

    const filtered = sorted.filter(c => {
        if (!cardSearchQuery) return true;
        const front = c.front.toLowerCase();
        const back = c.back.toLowerCase();
        const tags = c.card_tags.map(ct => ct.tags.name.toLowerCase()).join(' ');
        return front.includes(cardSearchQuery) || back.includes(cardSearchQuery) || tags.includes(cardSearchQuery);
    });

    if (filtered.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--text-secondary)">No cards found matching your search.</p>';
        return;
    }

    filtered.forEach(card => {
        const isOwner = state.user && card.deck_id && state.decks.some(d => d.id === card.deck_id);
        const isSelected = state.selectedCardIds.has(card.id);

        const item = document.createElement('div');
        item.className = `flashcard-item card-style ${state.selectionMode ? 'selecting' : ''}`;
        if (state.selectionMode) {
            item.onclick = () => toggleCardSelection(card.id);
        }

        item.innerHTML = `
            ${state.selectionMode ? `
                <input type="checkbox" class="selection-checkbox" ${isSelected ? 'checked' : ''} 
                    onclick="event.stopPropagation(); toggleCardSelection('${card.id}')">
            ` : ''}
            <div class="card-content-preview">
                <div class="card-front-preview">${renderContent(card.front)}</div>
                <div class="card-back-preview">${renderContent(card.back)}</div>
                <div class="card-tags-preview" id="tags-${card.id}"></div>
                ${isOwner && !state.selectionMode ? `
                <button class="card-tag-btn" onclick="openTagContext(event, '${card.id}')" title="Add Tag">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
                    </svg>
                </button>
                ` : ''}
            </div>
            ${isOwner && !state.selectionMode ? `
            <div class="card-actions">
                <button class="btn btn-text" onclick="event.stopPropagation(); editCard('${card.id}')">Edit</button>
                <button class="btn btn-danger-outline" onclick="event.stopPropagation(); deleteCard('${card.id}')">Delete</button>
            </div>
            ` : ''}
        `;
        list.appendChild(item);
        renderCardTags(card);
    });
    renderMath(list);
}

// Sorting and Selection
document.getElementById('card-sort-select').onchange = () => renderCardList();

document.getElementById('toggle-select-mode-btn').onclick = () => {
    state.selectionMode = !state.selectionMode;
    state.selectedCardIds.clear();
    document.getElementById('toggle-select-mode-btn').textContent = state.selectionMode ? 'Cancel' : 'Select';

    const bulkBar = document.getElementById('bulk-actions-bar');
    if (state.selectionMode) bulkBar.classList.remove('hidden');
    else bulkBar.classList.add('hidden');

    updateBulkActionsUI();
    renderCardList();
};

function toggleCardSelection(cardId) {
    if (state.selectedCardIds.has(cardId)) {
        state.selectedCardIds.delete(cardId);
    } else {
        state.selectedCardIds.add(cardId);
    }
    updateBulkActionsUI();
    renderCardList();
}

document.getElementById('select-all-checkbox').onchange = (e) => {
    if (e.target.checked) {
        state.cards.forEach(c => state.selectedCardIds.add(c.id));
    } else {
        state.selectedCardIds.clear();
    }
    updateBulkActionsUI();
    renderCardList();
};

function updateBulkActionsUI() {
    const count = state.selectedCardIds.size;
    document.getElementById('selected-count').textContent = `${count} cards selected`;
    document.getElementById('select-all-checkbox').checked = count === state.cards.length && count > 0;
    document.getElementById('bulk-delete-btn').disabled = count === 0;
}

document.getElementById('bulk-delete-btn').onclick = async () => {
    const count = state.selectedCardIds.size;
    if (!confirm(`Are you sure you want to delete ${count} selected cards?`)) return;

    const idsToDelete = Array.from(state.selectedCardIds);
    const { error } = await sb.from('cards').delete().in('id', idsToDelete);

    if (error) {
        showToast(error.message, 'error');
    } else {
        showToast(`${count} cards deleted`);
        state.selectionMode = false;
        state.selectedCardIds.clear();
        document.getElementById('toggle-select-mode-btn').textContent = 'Select';
        document.getElementById('bulk-actions-bar').classList.add('hidden');
        loadCards(state.currentDeck.id);
    }
};

// --- Tag Context Menu ---

window.openTagContext = (e, cardId) => {
    e.stopPropagation();
    // Remove existing
    const existing = document.querySelector('.tag-popover');
    if (existing) existing.remove();

    const popover = document.createElement('div');
    popover.className = 'tag-popover';

    // Header
    const header = document.createElement('div');
    header.className = 'popover-header';
    header.innerHTML = `<span>Add Tag</span><span class="popover-close">&times;</span>`;
    header.querySelector('.popover-close').onclick = () => popover.remove();
    popover.appendChild(header);

    // Input
    const input = document.createElement('input');
    input.className = 'popover-input';
    input.placeholder = 'Type tag & press enter...';
    input.onkeyup = (ev) => {
        if (ev.key === 'Enter' && input.value.trim()) {
            addTagFromContext(cardId, input.value.trim());
            popover.remove();
        }
    };
    popover.appendChild(input);

    // Default Tags Grid
    const grid = document.createElement('div');
    grid.className = 'default-tags-grid';
    DEFAULT_TAGS.forEach(tag => {
        const item = document.createElement('div');
        item.className = 'default-tag-item';
        item.onclick = () => {
            addTagFromContext(cardId, tag.name);
            popover.remove();
        };
        item.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="default-tag-icon">
                ${tag.icon}
            </svg>
            <span class="default-tag-label">${tag.name}</span>
        `;
        grid.appendChild(item);
    });
    popover.appendChild(grid);

    // Positioning
    const rect = e.target.getBoundingClientRect();
    popover.style.top = `${window.scrollY + rect.bottom + 5}px`;
    popover.style.left = `${window.scrollX + rect.left - 240}px`; // Align somewhat to left
    // Adjust if off screen
    if (rect.left - 240 < 0) popover.style.left = `${window.scrollX + 10}px`;

    document.body.appendChild(popover);

    // Focus input
    setTimeout(() => input.focus(), 50);

    // Close on click outside
    const closeListener = (ev) => {
        if (!popover.contains(ev.target) && ev.target !== e.target && !e.target.contains(ev.target)) {
            popover.remove();
            document.removeEventListener('click', closeListener);
        }
    };
    setTimeout(() => document.addEventListener('click', closeListener), 100);
}

async function addTagFromContext(cardId, tagName) {
    const tagIds = await resolveTags([tagName]);
    if (tagIds.length > 0) {
        const tagId = tagIds[0];
        const card = state.cards.find(c => c.id === cardId);
        const exists = card.card_tags.some(ct => ct.tag_id === tagId);

        if (!exists) {
            const { error } = await sb.from('card_tags').insert([{ card_id: cardId, tag_id: tagId }]);
            if (!error) {
                const newTag = state.tags.find(t => t.id === tagId);
                card.card_tags.push({ tag_id: tagId, tags: { name: newTag.name } });
                renderCardTags(card);
                showToast(`Tagged: ${tagName}`);
            }
        } else {
            showToast('Tag already exists', 'info');
        }
    }
}

function renderCardTags(card) {
    const tagContainer = document.getElementById(`tags-${card.id}`);
    if (!tagContainer) return;
    const tagNames = card.card_tags ? card.card_tags.map(ct => ct.tags.name) : [];
    tagContainer.innerHTML = tagNames.map(t => `<span class="tag-pill">${escapeHtml(t)}</span>`).join('');
}

// -- Card CRUD with Tags --

document.getElementById('add-card-btn').addEventListener('click', () => {
    document.getElementById('card-id').value = '';
    document.getElementById('card-form').reset();
    openModal('card-modal');
});

window.editCard = (id) => {
    const card = state.cards.find(c => c.id === id);
    if (!card) return;
    document.getElementById('card-id').value = card.id;
    document.getElementById('card-front-input').value = card.front;
    document.getElementById('card-back-input').value = card.back;

    const tags = card.card_tags.map(ct => ct.tags.name).join(', ');
    document.getElementById('card-tags-input').value = tags;

    openModal('card-modal');
};

document.getElementById('card-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('card-id').value;
    const front = document.getElementById('card-front-input').value;
    const back = document.getElementById('card-back-input').value;
    const tagsInput = document.getElementById('card-tags-input').value;

    const tagNames = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    const tagIds = await resolveTags(tagNames);

    let cardId = id;
    if (id) {
        await sb.from('cards').update({ front, back }).eq('id', id);
    } else {
        const { data } = await sb.from('cards').insert([{
            deck_id: state.currentDeck.id, front, back, due_at: new Date()
        }]).select().single();
        if (data) cardId = data.id;
    }

    if (cardId) {
        // Sync tags: Delete existing, Insert new
        await sb.from('card_tags').delete().eq('card_id', cardId);
        if (tagIds.length > 0) {
            const tagInserts = tagIds.map(tid => ({ card_id: cardId, tag_id: tid }));
            await sb.from('card_tags').insert(tagInserts);
        }
        showToast('Card saved');
        closeModal();
        loadCards(state.currentDeck.id);
    }
});

window.deleteCard = async (id) => {
    if (!confirm('Delete this card?')) return;
    const { error } = await sb.from('cards').delete().eq('id', id);
    if (error) showToast(error.message, 'error');
    else {
        showToast('Card deleted');
        state.cards = state.cards.filter(c => c.id !== id);
        renderCardList();
    }
};

// --- CSV Import ---
document.getElementById('csv-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !state.currentDeck) return;

    Papa.parse(file, {
        complete: async (results) => {
            const rows = results.data.filter(row => row.length >= 2 && row[0].trim());
            if (rows.length === 0) {
                showToast('No valid data found in CSV', 'error');
                return;
            }

            const cardsToInsert = rows.map(row => ({
                deck_id: state.currentDeck.id,
                front: row[0].trim(),
                back: row[1].trim(),
                due_at: new Date()
            }));

            const { error } = await sb.from('cards').insert(cardsToInsert);
            if (error) showToast(error.message, 'error');
            else {
                showToast(`Imported ${cardsToInsert.length} cards`);
                loadCards(state.currentDeck.id);
                if (state.currentView === 'deck-view') openDeck(state.currentDeck); // Refresh header
            }
            e.target.value = ''; // Reset input
        },
        error: (err) => {
            showToast('Error parsing CSV: ' + err.message, 'error');
        }
    });
});

// --- Add to Group Shortcut ---
document.getElementById('add-to-group-btn').onclick = async () => {
    if (!state.currentDeck) return;

    // Ensure groups are loaded
    await loadGroups();

    const select = document.getElementById('add-to-group-select');
    select.innerHTML = '<option value="">Select a Group...</option>';
    if (state.groups && state.groups.length > 0) {
        state.groups.forEach(g => {
            select.innerHTML += `<option value="${g.id}">${escapeHtml(g.name)}</option>`;
        });
    } else {
        select.innerHTML = '<option value="">No groups found. Create one first!</option>';
    }
    document.getElementById('add-to-group-deck-id').value = state.currentDeck.id;
    document.getElementById('share-modal').classList.add('hidden'); // Hide share modal
    openModal('add-to-group-modal');
};

document.getElementById('add-to-group-form').onsubmit = async (e) => {
    e.preventDefault();
    const deckId = document.getElementById('add-to-group-deck-id').value;
    const groupId = document.getElementById('add-to-group-select').value;
    if (!groupId) return;

    const { error } = await sb.from('decks').update({ group_id: groupId }).eq('id', deckId);
    if (error) {
        showToast(error.message, 'error');
    } else {
        showToast('Deck added to group shortcut');
        closeModal();
        // Refresh deck state
        if (state.currentDeck && state.currentDeck.id === deckId) {
            state.currentDeck.group_id = groupId;
            openDeck(state.currentDeck);
        }
    }
};

// Public toggle is now handled within the share modal


// --- Custom Study ---

const customStudyBtn = document.getElementById('custom-study-btn');
if (customStudyBtn) {
    customStudyBtn.addEventListener('click', () => {
        if (state.isGuest) {
            showGuestPreview('deck', state.currentDeck);
            return;
        }
        // Populate tag filter
        const select = document.getElementById('custom-study-tag-filter');
        select.innerHTML = '<option value="">All Tags</option>';
        state.tags.forEach(t => {
            select.innerHTML += `<option value="${t.id}">${escapeHtml(t.name)}</option>`;
        });
        openModal('custom-study-modal');
    });
}

document.getElementById('custom-study-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const tagId = document.getElementById('custom-study-tag-filter').value;
    const limit = parseInt(document.getElementById('custom-study-limit').value);

    state.studySessionConfig = { type: 'custom', tagId, limit };
    closeModal();
    startStudySession();
});

document.getElementById('study-deck-btn').addEventListener('click', () => {
    if (state.isGuest) {
        if (state.currentDeck) {
            showGuestPreview('deck', state.currentDeck);
        }
        return;
    }
    state.studySessionConfig = { type: 'standard' };
    startStudySession();
});

document.getElementById('shuffle-study-btn').onclick = () => {
    // Shuffle only cards that haven't been shown yet + current one
    if (state.studyQueue.length <= state.currentCardIndex + 1) {
        showToast('Not enough cards to shuffle', 'info');
        return;
    }

    // We shuffle from current index to end
    const remaining = state.studyQueue.slice(state.currentCardIndex);
    for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }

    state.studyQueue.splice(state.currentCardIndex, remaining.length, ...remaining);
    showNextCard();
    showToast('Queue shuffled');
};

const fullscreenBtn = document.getElementById('fullscreen-study-btn');
if (fullscreenBtn) {
    fullscreenBtn.onclick = () => {
        const studyView = document.getElementById('study-view');
        if (!document.fullscreenElement) {
            if (studyView.requestFullscreen) {
                studyView.requestFullscreen().catch(err => {
                    showToast(`Error attempting to enable full-screen mode: ${err.message}`, 'error');
                });
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };
}


// --- Study Logic ---

async function startStudySession(restart = false) {
    if (!restart) {
        state.studyOrigin = state.lastView;
        // Default Settings if not set
        if (!state.studySettings) {
            state.studySettings = {
                trackProgress: true,
                studyStarred: false,
                cardSide: 'front', // front, back
                showBoth: false
            };
        }
    }

    let allCards = [];
    if (state.currentDeck) {
        allCards = state.cards;
    } else {
        const { data } = await sb.from('cards').select(`*, card_tags(tag_id)`).order('due_at');
        if (data) allCards = data;

        if (state.studySessionConfig && state.studySessionConfig.type === 'standard') {
            const now = new Date();
            allCards = allCards.filter(c => !c.due_at || new Date(c.due_at) <= now || c.interval_days === 0);
        }
    }

    // Apply Settings Filters (Starred)
    // Note: 'Starred' is not a DB field yet, so we ship this feature as "available in UI but no op" or we filter if we had it.
    // For now, if studyStarred is true, we might filter by a tag 'Starred' if it exists, or just warn.
    // Let's assume there is no 'starred' field yet.

    let queue = [];
    const config = state.studySessionConfig || { type: 'standard' };

    if (config.type === 'custom') {
        queue = allCards;
        if (config.tagId) {
            queue = queue.filter(c => c.card_tags.some(ct => ct.tag_id === config.tagId));
        }
        if (config.limit) {
            queue = queue.slice(0, config.limit);
        }
    } else {
        const now = new Date();
        queue = allCards.filter(c => !c.due_at || new Date(c.due_at) <= now || c.interval_days === 0);
        queue.sort((a, b) => new Date(a.due_at || 0) - new Date(b.due_at || 0));

        const limit = state.settings.dailyLimit || 20;
        if (queue.length > limit) {
            queue = queue.slice(0, limit);
        }
    }

    if (queue.length === 0) {
        showToast('No cards match your study criteria!', 'success');
        return;
    }

    state.studyQueue = queue;
    state.currentCardIndex = 0;
    state.sessionRatings = []; // Reset ratings for new session

    // Update Header Info
    if (state.currentDeck) {
        document.getElementById('study-deck-title').textContent = state.currentDeck.title;
        document.getElementById('study-deck-title').onclick = () => {
            if (confirm("Exit study session?")) exitStudyMode();
        };
    }

    // Init UI toggles
    document.getElementById('study-track-progress-toggle').checked = state.studySettings.trackProgress;
    document.getElementById('setting-track-progress').checked = state.studySettings.trackProgress;
    document.getElementById('setting-study-starred').checked = state.studySettings.studyStarred;
    document.getElementById('setting-card-side').value = state.studySettings.cardSide;
    document.getElementById('setting-show-both').checked = state.studySettings.showBoth;

    switchView('study-view');
    showNextCard(false);
}



async function showNextCard(animate = true) {
    if (state.currentCardIndex >= state.studyQueue.length) {
        finishStudySession();
        return;
    }

    const flashcard = document.getElementById('active-flashcard');

    // Fade out transition
    if (animate && !state.settings.reducedMotion) {
        flashcard.classList.add('fading-out');
        await new Promise(r => setTimeout(r, 300));
    }

    const card = state.studyQueue[state.currentCardIndex];
    const side = state.studySettings.cardSide; // front or back
    const showBoth = state.studySettings.showBoth;

    const frontEl = document.getElementById('study-front');
    const backEl = document.getElementById('study-back');

    if (side === 'back') {
        frontEl.textContent = card.back;
        backEl.textContent = card.front;
    } else {
        frontEl.textContent = card.front;
        backEl.textContent = card.back;
    }

    if (showBoth) {
        // If show both, we can append the other side to the front
        frontEl.innerHTML = `<div>${renderContent(side === 'back' ? card.back : card.front)}</div>
                             <hr style="margin: 1rem 0; border: 0; border-top: 1px dashed var(--border);">
                             <div>${renderContent(side === 'back' ? card.front : card.back)}</div>`;
        backEl.textContent = ""; // Empty back if shown on front? Or just duplicate.
    } else {
        frontEl.textContent = side === 'back' ? card.back : card.front;
        renderMath(frontEl);
        renderMath(backEl);
    }

    // Update Progress Text
    document.getElementById('study-progress-text').textContent = `${state.currentCardIndex + 1} / ${state.studyQueue.length}`;

    // Update Progress Bar
    const pct = ((state.currentCardIndex) / state.studyQueue.length) * 100;
    document.getElementById('study-progress-bar').style.width = `${pct}%`;

    // Make state reset instant
    flashcard.style.transition = 'none';
    flashcard.classList.remove('is-flipped');
    state.isFlipped = false;
    void flashcard.offsetWidth; // force reflow
    flashcard.style.transition = '';

    // Hide controls initially
    toggleStudyControls(false);

    // Fade in animation
    if (animate && !state.settings.reducedMotion) {
        flashcard.classList.remove('fading-out');
        flashcard.classList.add('anim-in');
        setTimeout(() => flashcard.classList.remove('anim-in'), 400);
    }

    if (state.game.timer) clearTimeout(state.game.timer);
    if (state.settings.autoFlip) {
        state.game.timer = setTimeout(() => {
            if (!state.isFlipped) flipCard();
        }, 5000);
    }
}

function prevCard() {
    if (state.currentCardIndex > 0) {
        state.currentCardIndex--;
        showNextCard();
    } else {
        showToast('This is the first card', 'info');
    }
}


// Flip/Rate Interactions (Reuse existing logic mostly)
const activeFlashcard = document.getElementById('active-flashcard');
if (activeFlashcard) {
    activeFlashcard.addEventListener('click', flipCard);
}

document.body.addEventListener('keydown', (e) => {
    if (!document.getElementById('study-view').classList.contains('hidden')) {
        if (e.code === 'Space' || e.code === 'Enter') {
            if (!state.isFlipped) flipCard();
        } else if (state.isFlipped && ['1', '2', '3', '4'].includes(e.key)) {
            rateCard(parseInt(e.key));
        }
    }
});


function flipCard() {
    if (state.game.timer) clearTimeout(state.game.timer);
    const cardElement = document.getElementById('active-flashcard');

    if (state.isFlipped) {
        cardElement.classList.remove('is-flipped');
        state.isFlipped = false;
        toggleStudyControls(false);
    } else {
        cardElement.classList.add('is-flipped');
        state.isFlipped = true;
        // Show appropriate controls after a small delay for animation
        setTimeout(() => toggleStudyControls(true), 200);
    }
}

function toggleStudyControls(show) {
    const controls = document.getElementById('study-controls');
    const noTrackControls = document.getElementById('study-controls-no-track');

    if (show) {
        if (state.studySettings.trackProgress) {
            controls.classList.remove('hidden');
            noTrackControls.classList.add('hidden');
        } else {
            controls.classList.add('hidden');
            noTrackControls.classList.remove('hidden');
        }
    } else {
        controls.classList.add('hidden');
        noTrackControls.classList.add('hidden');
    }
}

const prevBtn = document.getElementById('study-prev-btn');
if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        prevCard();
    });
}


// Settings Handlers
const settingsBtn = document.getElementById('study-settings-btn');
if (settingsBtn) {
    settingsBtn.onclick = () => {
        openModal('study-settings-modal');
    };
}


const trackToggle = document.getElementById('study-track-progress-toggle');
if (trackToggle) {
    trackToggle.onchange = (e) => {
        state.studySettings.trackProgress = e.target.checked;
        const subToggle = document.getElementById('setting-track-progress');
        if (subToggle) subToggle.checked = e.target.checked;
        if (state.isFlipped) {
            toggleStudyControls(e.target.checked);
        }
    };
}


const sTrackProgress = document.getElementById('setting-track-progress');
if (sTrackProgress) {
    sTrackProgress.onchange = (e) => {
        state.studySettings.trackProgress = e.target.checked;
        const mainToggle = document.getElementById('study-track-progress-toggle');
        if (mainToggle) mainToggle.checked = e.target.checked;
    };
}

const sStudyStarred = document.getElementById('setting-study-starred');
if (sStudyStarred) {
    sStudyStarred.onchange = (e) => {
        state.studySettings.studyStarred = e.target.checked;
    };
}

const sCardSide = document.getElementById('setting-card-side');
if (sCardSide) {
    sCardSide.onchange = (e) => {
        state.studySettings.cardSide = e.target.value;
        showNextCard();
    };
}

const sShowBoth = document.getElementById('setting-show-both');
if (sShowBoth) {
    sShowBoth.onchange = (e) => {
        state.studySettings.showBoth = e.target.checked;
        showNextCard();
    };
}


const restartBtn = document.getElementById('restart-flashcards-btn');
if (restartBtn) {
    restartBtn.onclick = () => {
        closeModal();
        if (confirm("Restart this study session?")) {
            startStudySession(true);
        }
    };
}

const questionsBtn = document.getElementById('study-questions-btn');
if (questionsBtn) {
    questionsBtn.onclick = () => {
        showToast("Question mode coming soon!", "info");
    };
}



document.querySelectorAll('.btn-rate').forEach(btn => {
    btn.addEventListener('click', () => rateCard(parseInt(btn.dataset.rating)));
});

async function rateCard(rating) {
    const card = state.studyQueue[state.currentCardIndex];
    const isOwner = state.user && state.decks.some(d => d.id === card.deck_id);

    // Track locally for session summary
    state.sessionRatings.push({ cardId: card.id, rating: rating, card: card });

    // Save progress log for any logged in user
    if (state.user) {
        sb.from('study_logs').insert([{
            user_id: state.user.id,
            card_id: card.id,
            deck_id: card.deck_id,
            rating: rating,
            review_time: new Date()
        }]).then(({ error }) => { if (error) console.error(error); });
    }

    // SRS Calc (Simple)
    let { interval_days, ease_factor, reviews_count } = card;
    interval_days = Number(interval_days);
    ease_factor = Number(ease_factor);
    reviews_count = Number(reviews_count) + 1;

    if (rating === 1) { // Again
        interval_days = 0.01; // ~15 mins
        ease_factor = Math.max(1.3, ease_factor - 0.2);
    } else if (rating === 2) { // Hard
        interval_days = (interval_days === 0) ? 1 : Math.max(1, interval_days * 1.2);
        ease_factor = Math.max(1.3, ease_factor - 0.15);
    } else if (rating === 3) { // Good
        interval_days = (interval_days === 0) ? 1 : interval_days * ease_factor;
    } else if (rating === 4) { // Easy
        interval_days = (interval_days === 0) ? 4 : interval_days * ease_factor * 1.3;
        ease_factor += 0.15;
    }

    const due_at = new Date();
    due_at.setMinutes(due_at.getMinutes() + (interval_days * 24 * 60));

    // Update DB if owner
    if (isOwner) {
        await sb.from('cards').update({
            interval_days, ease_factor, reviews_count,
            last_reviewed: new Date(),
            due_at: due_at
        }).eq('id', card.id);
    }

    // Update local card object for accurate summary stats
    card.interval_days = interval_days;
    card.ease_factor = ease_factor;
    card.reviews_count = reviews_count;
    card.last_reviewed = new Date();
    card.due_at = due_at;

    state.currentCardIndex++;
    showNextCard();
}

async function finishStudySession() {
    switchView('study-summary-view');
    document.getElementById('summary-count').textContent = state.studyQueue.length;
    document.getElementById('study-progress-bar').style.width = '100%';
    document.getElementById('study-progress-text').textContent = `${state.studyQueue.length} / ${state.studyQueue.length}`;

    // Calculate session stats for suggestions
    const hardCards = state.sessionRatings.filter(r => r.rating <= 2);
    const goodCards = state.sessionRatings.filter(r => r.rating >= 3);

    // Update counts in UI
    const hardCountEl = document.getElementById('hard-cards-count');
    const goodCountEl = document.getElementById('good-cards-count');
    if (hardCountEl) hardCountEl.textContent = hardCards.length;
    if (goodCountEl) goodCountEl.textContent = goodCards.length;

    // Suggestion logic
    const retryHardBtn = document.getElementById('retry-hard-cards-btn');
    const retryGoodBtn = document.getElementById('retry-good-cards-btn');

    if (retryHardBtn) {
        retryHardBtn.classList.toggle('hidden', hardCards.length === 0);
        retryHardBtn.onclick = () => {
            state.studyQueue = hardCards.map(r => r.card);
            state.currentCardIndex = 0;
            state.sessionRatings = [];
            switchView('study-view');
            showNextCard(false);
        };
    }

    if (retryGoodBtn) {
        retryGoodBtn.classList.toggle('hidden', goodCards.length === 0);
        retryGoodBtn.onclick = () => {
            state.studyQueue = goodCards.map(r => r.card);
            state.currentCardIndex = 0;
            state.sessionRatings = [];
            switchView('study-view');
            showNextCard(false);
        };
    }

    const newSessionBtn = document.getElementById('new-study-session-btn');
    if (newSessionBtn) {
        newSessionBtn.onclick = () => startStudySession(true);
    }

    // Extended Stats
    if (state.currentDeck) {
        const total = state.cards.length;
        // Count from all cards in state (not just studied ones)
        const mastered = state.cards.filter(c => c.interval_days >= 3).length;
        const learning = total - mastered;

        const masteryEl = document.getElementById('summary-deck-progress');
        if (masteryEl) masteryEl.textContent = total > 0 ? Math.round((mastered / total) * 100) + '%' : '0%';

        const learnCountEl = document.getElementById('summary-learning-count');
        const knownCountEl = document.getElementById('summary-known-count');
        if (learnCountEl) learnCountEl.textContent = `${learning} / ${total}`;
        if (knownCountEl) knownCountEl.textContent = `${mastered} / ${total}`;
    }
}

function exitStudyMode() {
    const target = state.studyOrigin || 'decks-view';

    if (target === 'deck-view' && state.currentDeck) {
        openDeck(state.currentDeck);
    } else if (target === 'today-view') {
        switchView('today-view');
        loadTodayView();
    } else {
        switchView('decks-view');
        loadDecksView();
    }
}

const backToDeckBtn = document.getElementById('back-to-deck-btn');
if (backToDeckBtn) {
    backToDeckBtn.addEventListener('click', exitStudyMode);
}

const quitStudyBtn = document.getElementById('quit-study-btn');
if (quitStudyBtn) {
    quitStudyBtn.addEventListener('click', exitStudyMode);
}


// --- GROUPS LOGIC ---

async function loadGroups() {
    // Fetch groups where user is a member
    // We join group_members to groups.
    // Assuming RLS on group_members allows seeing own membership.
    const { data, error } = await sb.from('group_members')
        .select('role, groups(*)')
        .eq('user_id', state.user.id)
        .order('joined_at', { ascending: false });

    if (error) return showToast(error.message, 'error');

    // Transform
    state.groups = data.map(item => ({
        ...item.groups,
        myRole: item.role
    }));

    renderGroups();
}

function renderGroups() {
    const grid = document.getElementById('groups-grid');
    grid.innerHTML = '';

    if (state.groups.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-secondary); padding: 3rem; background: var(--surface); border-radius: var(--radius); border: 1px dashed var(--border);">You are not in any groups. Decks you create in a group are shared with all members.</div>';
        return;
    }

    state.groups.forEach(group => {
        const div = document.createElement('div');
        div.className = 'group-card';
        div.innerHTML = `
            <span class="group-role-badge">${escapeHtml(group.myRole)}</span>
            <div>
                 <div class="deck-title">${escapeHtml(group.name)}</div>
                 <div style="font-size:0.85rem; color:var(--text-secondary); margin-top: 0.5rem;">
                    Created ${new Date(group.created_at).toLocaleDateString()}
                 </div>
            </div>
            <div style="margin-top: 1rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--primary); font-weight: 600;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="icon-sm">
                    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                    <path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
                View Decks
            </div>
        `;
        div.onclick = () => openGroup(group);
        grid.appendChild(div);
    });
}

document.getElementById('create-group-btn').addEventListener('click', () => openModal('create-group-modal'));
document.getElementById('join-group-btn').addEventListener('click', () => openModal('join-group-modal'));

document.getElementById('create-group-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('new-group-name').value;
    const { error } = await sb.from('groups').insert([{ name, created_by: state.user.id }]);
    if (error) showToast(error.message, 'error');
    else {
        showToast('Group Created');
        closeModal();
        loadGroups();
    }
});

document.getElementById('join-group-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('join-invite-code').value.trim();
    // 1. Find group
    const { data: group } = await sb.from('groups').select('id').eq('invite_code', code).maybeSingle();
    if (!group) return showToast('Invalid Invite Code', 'error');

    // 2. Insert member
    const { error } = await sb.from('group_members').insert([{ group_id: group.id, user_id: state.user.id }]);
    if (error) {
        // Handle duplicate join (PK violation)
        if (error.code === '23505') showToast('You are already in this group', 'info');
        else showToast(error.message, 'error');
    }
    else {
        showToast('Joined Group');
        closeModal();
        loadGroups();
    }
});

// Group Details
async function openGroup(group) {
    // Track origin for back button
    const validOrigins = ['groups-view', 'community-view', 'today-view'];
    if (validOrigins.includes(state.lastView)) {
        state.groupOrigin = state.lastView;
    }

    state.currentGroup = group;
    document.getElementById('group-detail-title').textContent = group.name;
    document.getElementById('group-invite-code').textContent = group.invite_code;

    state.isGroupAdmin = (group.myRole === 'admin');

    // Toggle "New Deck" button based on role
    document.getElementById('create-group-deck-btn').style.display = 'block';

    // Admin Controls
    const adminPanel = document.getElementById('group-admin-panel'); // We might need to create this in HTML or inject
    if (state.isGroupAdmin) {
        // Show delete group button?
        if (!document.getElementById('delete-group-btn')) {
            const btn = document.createElement('button');
            btn.id = 'delete-group-btn';
            btn.className = 'btn btn-danger-outline';
            btn.textContent = 'Delete Group';
            btn.onclick = () => deleteGroup(group.id);
            document.querySelector('#group-detail-view .header-actions').appendChild(btn); // Assuming structure
        }
    } else {
        const btn = document.getElementById('delete-group-btn');
        if (btn) btn.remove();
    }

    switchView('group-detail-view');
    loadGroupDetails(group.id);
}

async function deleteGroup(groupId) {
    if (confirm('Are you sure you want to delete this group? All decks will be deleted.')) {
        const { error } = await sb.from('groups').delete().eq('id', groupId);
        if (error) showToast(error.message, 'error');
        else {
            showToast('Group deleted');
            switchView('groups-view');
            loadGroups();
        }
    }
}

async function kickMember(userId, groupId) {
    if (confirm('Kick this member?')) {
        const { error } = await sb.from('group_members').delete().eq('user_id', userId).eq('group_id', groupId);
        if (error) showToast(error.message, 'error');
        else {
            showToast('Member kicked');
            loadGroupDetails(groupId);
        }
    }
}

document.getElementById('back-to-groups-btn').onclick = () => {
    const target = state.groupOrigin || 'groups-view';
    switchView(target);
    if (target === 'groups-view') loadGroups();
    else if (target === 'community-view') loadCommunityDecks();
    else if (target === 'today-view') loadTodayView();
};

document.getElementById('copy-invite-btn').onclick = () => {
    const code = document.getElementById('group-invite-code').textContent;
    // Fix for file:// and other protocols: use window.location.href to preserve the protocol
    const url = window.location.href.split('?')[0] + `?join=${code}`;
    navigator.clipboard.writeText(url).then(() => showToast('Invite link copied!'));
};

const groupTabs = document.querySelectorAll('#group-detail-view .tab-btn');
groupTabs.forEach(btn => {
    btn.onclick = () => {
        groupTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('#group-detail-view .tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(btn.dataset.tab).classList.remove('hidden');
    };
});

async function loadGroupDetails(groupId) {
    // 1. Fetch Decks
    const { data: decks } = await sb.from('decks').select('*').eq('group_id', groupId).order('created_at', { ascending: false });
    state.groupDecks = decks || [];
    renderGroupDecks();

    // 2. Fetch Members - Use explicit alias to help PostgREST
    const { data: memberProfiles, error: mErr } = await sb.from('group_members')
        .select(`
            role, 
            user_id, 
            profiles:user_id (username, created_at)
        `)
        .eq('group_id', groupId);

    if (mErr) console.error("Error fetching members:", mErr);

    state.groupMembers = memberProfiles || [];

    // 3. Fetch Group Stats (Reviews per user in these decks)
    const deckIds = state.groupDecks.map(d => d.id);
    state.groupMemberStats = {};

    if (deckIds.length > 0) {
        const { data: logs } = await sb.from('study_logs')
            .select('user_id, rating')
            .in('deck_id', deckIds);

        if (logs) {
            logs.forEach(log => {
                if (!state.groupMemberStats[log.user_id]) {
                    state.groupMemberStats[log.user_id] = { reviews: 0, score: 0 };
                }
                state.groupMemberStats[log.user_id].reviews++;
                state.groupMemberStats[log.user_id].score += log.rating;
            });
        }
    }

    renderGroupMembers();
}

function renderGroupDecks() {
    const grid = document.getElementById('group-decks-grid');
    grid.innerHTML = '';
    if (state.groupDecks.length === 0) {
        grid.innerHTML = '<p class="text-dim" style="grid-column:1/-1;text-align:center">No decks in this group.</p>';
        return;
    }
    state.groupDecks.forEach(deck => {
        const div = document.createElement('div');
        div.className = 'deck-card';
        div.innerHTML = `
            <div style="display:flex; justify-content: space-between; align-items: flex-start;">
                <div>
                     <div class="deck-title" style="margin-bottom: 4px;">${escapeHtml(deck.title)}</div>
                     <div class="deck-desc">${escapeHtml(deck.description || '')}</div>
                </div>
                <button class="btn btn-icon-only-sm context-trigger" onclick="openGroupDeckContext(event, '${deck.id}')" style="padding: 4px;">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                </button>
            </div>
             <div style="margin-top: 1rem;">
                ${deck.is_public ? '<span class="badge" style="background:var(--success);color:white;font-size:0.7em">Public</span>' : ''}
             </div>
        `;
        div.onclick = () => {
            state.lastView = 'group-detail-view';
            openDeck(deck);
        };
        grid.appendChild(div);
    });
}

window.openGroupDeckContext = (e, deckId) => {
    e.stopPropagation();
    const deck = state.groupDecks.find(d => d.id === deckId);
    if (!deck) return;

    const isOwner = deck.user_id === state.user.id;
    const isAdmin = state.groupMembers.find(m => m.user_id === state.user.id && m.role === 'admin');

    const options = [
        { label: 'Study', action: () => { state.currentDeck = deck; state.studySessionConfig = { type: 'standard' }; startStudySession(); } },
        { label: 'View Details', action: () => openDeck(deck) },
        { label: 'Import to My Decks', action: () => importDeck(deck.id) }
    ];

    if (isOwner || isAdmin) {
        options.push({ label: 'Remove from Group', danger: true, action: () => removeDeckFromGroup(deck.id) });
    }

    renderContextMenu(e.clientX, e.clientY, options);
};

function renderGroupMembers() {
    const list = document.getElementById('group-members-list');
    list.innerHTML = '';

    if (state.groupMembers.length === 0) {
        list.innerHTML = '<li class="text-dim" style="text-align:center;padding:2rem">No members in this group.</li>';
        return;
    }

    state.groupMembers.forEach(m => {
        const profile = m.profiles || {};
        const name = profile.username || 'Unknown User';
        const stats = state.groupMemberStats[m.user_id] || { reviews: 0, score: 0 };
        const mastery = stats.reviews > 0 ? Math.round((stats.score / (stats.reviews * 4)) * 100) : 0;

        const li = document.createElement('li');
        li.className = 'member-row';
        li.innerHTML = `
            <div class="member-profile">
                <div class="user-avatar-md">
                    ${name.charAt(0).toUpperCase()}
                </div>
                <div class="member-info">
                    <span class="member-name">${escapeHtml(name)} ${m.user_id === state.user.id ? '<span class="text-dim">(You)</span>' : ''}</span>
                    <span class="member-meta">Joined ${new Date(profile.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="member-stat">
                <span class="stat-value">${stats.reviews}</span>
                <span class="stat-label">Reviews</span>
            </div>
            <div class="member-stat">
                <span class="stat-value text-primary">${mastery}%</span>
                <span class="stat-label">Mastery</span>
            </div>
            <div class="member-role">
                <span class="badge ${m.role === 'admin' ? 'badge-primary' : 'badge-outline'}">${m.role}</span>
                ${state.isGroupAdmin && m.user_id !== state.user.id ? `
                    <button class="btn btn-text btn-sm text-danger" onclick="kickMember('${m.user_id}', '${state.currentGroup.id}')" title="Kick Member">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                ` : ''}
            </div>
        `;
        list.appendChild(li);
    });
}

document.getElementById('create-group-deck-btn').onclick = () => {
    state.creatingDecForGroup = state.currentGroup.id;
    document.getElementById('new-deck-title').value = '';
    document.getElementById('new-deck-desc').value = '';
    openModal('create-deck-modal');
};


// --- Gamification ---

document.getElementById('play-game-btn').addEventListener('click', () => {
    if (!state.currentDeck) return;
    if (state.isGuest) {
        showGuestPreview('deck', state.currentDeck);
        return;
    }
    state.gameOrigin = state.lastView; // Track origin
    switchView('game-view');
    document.getElementById('game-menu').classList.remove('hidden');
    document.getElementById('match-game-area').classList.add('hidden');
    document.getElementById('gravity-game-area').classList.add('hidden');
    document.getElementById('game-score-display').textContent = 'Score: 0';
    document.getElementById('game-title-text').textContent = `Game: ${state.currentDeck.title}`;
});

document.getElementById('quit-game-area-btn').addEventListener('click', () => {
    stopGame();
    switchView(state.gameOrigin || 'deck-view');
});

function stopGame() {
    state.game.active = false;
    if (state.game.timer) clearInterval(state.game.timer);
}

window.startGame = (mode) => {
    state.game.mode = mode;
    state.game.active = true;
    state.game.score = 0;
    document.getElementById('game-menu').classList.add('hidden');

    // Prepare items (Front/Back)
    // Take max 8 cards for match to fit screen, or more for gravity
    const cards = state.cards.slice(0, 16); // Only use 16 cards max?
    if (cards.length < 4) {
        showToast('Need at least 4 cards to play!', 'error');
        stopGame();
        return;
    }

    if (mode === 'match') {
        startMatchGame(cards);
    } else if (mode === 'gravity') {
        startGravityGame(cards);
    }
};

function startMatchGame(cards) {
    const area = document.getElementById('match-game-area');
    area.classList.remove('hidden');
    area.innerHTML = '';

    // Create pairs
    let items = [];
    cards.slice(0, 8).forEach(c => { // 8 pairs = 16 tiles
        items.push({ id: c.id, text: c.front, type: 'front' });
        items.push({ id: c.id, text: c.back, type: 'back' });
    });

    // Shuffle
    items.sort(() => Math.random() - 0.5);

    let selected = null;

    items.forEach((item, idx) => {
        const el = document.createElement('div');
        el.className = 'game-card';
        el.textContent = item.text;
        el.dataset.idx = idx;

        el.onclick = () => {
            if (el.classList.contains('matched') || el.classList.contains('selected')) return;

            el.classList.add('selected');

            if (!selected) {
                selected = { el, item };
            } else {
                // Check match
                if (selected.item.id === item.id) {
                    // Match!
                    state.game.score += 100;
                    document.getElementById('game-score-display').textContent = `Score: ${state.game.score}`;
                    el.classList.add('matched');
                    selected.el.classList.add('matched');
                    selected = null;

                    // Check win
                    if (document.querySelectorAll('.game-card.matched').length === items.length) {
                        showToast('You Win!', 'success');
                        setTimeout(stopGame, 2000);
                    }
                } else {
                    // No Match
                    setTimeout(() => {
                        el.classList.remove('selected');
                        selected.el.classList.remove('selected');
                        selected = null;
                    }, 500);
                }
            }
        };
        area.appendChild(el);
    });
}

function startGravityGame(cards) {
    const area = document.getElementById('gravity-game-area');
    const zone = document.getElementById('falling-words-zone');
    const input = document.getElementById('gravity-input');

    area.classList.remove('hidden');
    zone.innerHTML = '';
    input.value = '';
    input.focus();

    // Game Interval
    state.game.timer = setInterval(() => {
        if (!state.game.active) return;

        // Spawn word chance
        if (Math.random() < 0.03) {
            const card = cards[Math.floor(Math.random() * cards.length)];
            spawnFallingWord(card, zone);
        }
    }, 50); // Loop tick

    input.onkeyup = (e) => {
        if (e.key === 'Enter') {
            const val = input.value.trim().toLowerCase();
            const words = document.querySelectorAll('.falling-word');
            let hit = false;

            words.forEach(el => {
                if (el.dataset.answer.toLowerCase() === val) {
                    // Hit!
                    state.game.score += 50;
                    document.getElementById('game-score-display').textContent = `Score: ${state.game.score}`;
                    el.remove();
                    hit = true;
                }
            });

            if (hit) input.value = '';
        }
    };
}

function spawnFallingWord(card, zone) {
    const el = document.createElement('div');
    el.className = 'falling-word';
    el.textContent = card.front; // Show Front
    el.dataset.answer = card.back; // Type Back

    el.style.left = Math.random() * 80 + 10 + '%';
    el.style.top = '-50px';

    zone.appendChild(el);

    // Animate drop
    let top = -50;
    const drop = setInterval(() => {
        if (!state.game.active || !el.parentElement) {
            clearInterval(drop);
            return;
        }
        top += 1; // Speed
        el.style.top = top + 'px';

        if (top > zone.clientHeight) {
            clearInterval(drop);
            if (el.parentElement) el.remove();
        }
    }, 30); // Slower for easier play
}

// --- Statistics (Chart.js) ---

async function loadStats() {
    console.log("Loading Stats...");
    if (!state.user) return;

    // 1. Fetch Logs
    const { data: logs, error } = await sb.from('study_logs')
        .select('id, rating, review_time, card_id')
        .eq('user_id', state.user.id)
        .order('review_time', { ascending: false });

    if (error) {
        console.error("Error loading study logs:", error);
        return;
    }

    // 2. Heatmap Data & Streak
    const dailyCounts = {};
    const datesSet = new Set();
    let totalReviews = 0;
    let goodEasyCount = 0;
    const ratings = { 1: 0, 2: 0, 3: 0, 4: 0 };

    if (logs) {
        totalReviews = logs.length;
        logs.forEach(log => {
            const dateStr = log.review_time.split('T')[0];
            dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
            datesSet.add(new Date(log.review_time).toDateString());
            ratings[log.rating] = (ratings[log.rating] || 0) + 1;
            if (log.rating >= 3) goodEasyCount++;
        });
    }

    renderHeatmap(dailyCounts);

    // Calculate Streak
    let streak = 0;
    if (datesSet.size > 0) {
        let checkDate = new Date();
        while (true) {
            const checkStr = checkDate.toDateString();
            if (datesSet.has(checkStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                if (streak === 0 && checkDate.toDateString() === new Date().toDateString()) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                }
                break;
            }
        }
    }

    // Calculate Retention
    const retentionRate = totalReviews > 0 ? Math.round((goodEasyCount / totalReviews) * 100) : 0;

    // Calculate Daily Average (limit to last 30 days for more relevance)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogs = logs ? logs.filter(l => new Date(l.review_time) >= thirtyDaysAgo) : [];
    const dailyAvg = Math.round(recentLogs.length / 30);

    // Calculate Estimated Study Time
    let totalTimeMs = 0;
    if (logs && logs.length > 1) {
        for (let i = 0; i < logs.length - 1; i++) {
            const current = new Date(logs[i].review_time);
            const next = new Date(logs[i + 1].review_time);
            const diff = Math.abs(current - next);
            if (diff < 5 * 60 * 1000) { // If less than 5 mins apart, count it as a continuous session
                totalTimeMs += diff;
            } else {
                totalTimeMs += 30 * 1000; // Assume 30s for a single isolated review
            }
        }
    }
    const totalHours = (totalTimeMs / (1000 * 60 * 60)).toFixed(1);

    // 3. Maturity (Bar Chart)
    const { data: cards, error: cardError } = await sb.from('cards')
        .select('id, interval_days, deck_id');

    if (cardError) console.error("Error loading cards for maturity chart:", cardError);

    const maturity = { New: 0, Young: 0, Mature: 0 };
    let masteredCount = 0;

    if (cards && cards.length > 0) {
        cards.forEach(c => {
            const val = Number(c.interval_days) || 0;
            if (val < 1) maturity.New++;
            else if (val < 21) maturity.Young++;
            else {
                maturity.Mature++;
                masteredCount++;
            }
        });
    } else if (logs && logs.length > 0) {
        // Fallback for when cards query returns nothing (maybe RLS issue or no cards owned)
        // Estimate maturity based on logs: if a card has multiple logs and last was Good/Easy
        const lastRatings = new Map();
        logs.forEach(l => {
            if (!lastRatings.has(l.card_id)) lastRatings.set(l.card_id, l.rating);
        });
        lastRatings.forEach(r => {
            if (r >= 3) maturity.Mature++;
            else maturity.Young++;
        });
        masteredCount = maturity.Mature;
    }

    // 4. Update UI
    document.getElementById('stats-total-reviews').textContent = totalReviews.toLocaleString();
    document.getElementById('stats-retention-rate').textContent = retentionRate + '%';
    document.getElementById('stats-streak').textContent = streak;
    document.getElementById('stats-mastered').textContent = masteredCount.toLocaleString();
    document.getElementById('stats-daily-avg').textContent = dailyAvg;
    document.getElementById('stats-study-time').textContent = totalHours + 'h';

    renderRetentionChart(ratings);
    renderMaturityChart(maturity);
    renderTimeOfDayChart(logs || []);
}

function renderTimeOfDayChart(logs) {
    const stack = document.querySelector('.insights-stack');
    if (!stack) return;

    let todWrapper = document.getElementById('tod-wrapper');
    if (!todWrapper) {
        todWrapper = document.createElement('div');
        todWrapper.id = 'tod-wrapper';
        todWrapper.className = 'card';
        todWrapper.style.marginTop = '1.5rem';
        todWrapper.innerHTML = `
            <h3 class="mb-4 text-lg">Hourly Activity</h3>
            <div style="height: 200px;"><canvas id="tod-canvas"></canvas></div>
        `;
        stack.appendChild(todWrapper);
    }

    const canvas = document.getElementById('tod-canvas');
    if (!canvas) return;

    const hoursData = Array(24).fill(0);
    logs.forEach(l => {
        const h = new Date(l.review_time).getHours();
        hoursData[h]++;
    });

    if (charts.tod) charts.tod.destroy();
    charts.tod = new Chart(canvas, {
        type: 'line',
        data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: [{
                data: hoursData,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, display: true, ticks: { stepSize: 10 } },
                x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } }
            }
        }
    });
}


let charts = {};

function renderHeatmap(data = {}) {
    const ctx = document.getElementById('calendar-heatmap');
    ctx.innerHTML = '<canvas id="heatmap-canvas"></canvas>';
    const canvas = document.getElementById('heatmap-canvas');

    const last30Days = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        last30Days.push({ date: iso, val: data[iso] || 0 });
    }

    if (charts.heatmap) charts.heatmap.destroy();
    charts.heatmap = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: last30Days.map(d => {
                const date = new Date(d.date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Cards Reviewed',
                data: last30Days.map(d => d.val),
                backgroundColor: 'rgba(37, 99, 235, 0.7)',
                borderRadius: 4,
                hoverBackgroundColor: '#2563eb'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } }
            }
        }
    });
}

function renderRetentionChart(ratings) {
    const container = document.getElementById('retention-chart');
    container.innerHTML = '<canvas id="retention-canvas"></canvas>';
    const canvas = document.getElementById('retention-canvas');

    const data = [ratings[1], ratings[2], ratings[3], ratings[4]];
    const total = data.reduce((a, b) => a + b, 0);

    if (total === 0) {
        container.innerHTML = `<div style="height:100%; display:flex; align-items:center; justify-content:center; color:var(--text-secondary); background:var(--background); border-radius:var(--radius);">No study data yet. Start reviewing to see retention.</div>`;
        return;
    }

    if (charts.retention) charts.retention.destroy();
    charts.retention = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Again', 'Hard', 'Good', 'Easy'],
            datasets: [{
                data: data,
                backgroundColor: ["#f87171", "#fbbf24", "#34d399", "#60a5fa"],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
            }
        }
    });
}

function renderMaturityChart(data) {
    const container = document.getElementById('maturity-chart');
    container.innerHTML = '<canvas id="maturity-canvas"></canvas>';
    const canvas = document.getElementById('maturity-canvas');

    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) {
        container.innerHTML = `<div style="height:100%; display:flex; align-items:center; justify-content:center; color:var(--text-secondary); background:var(--background); border-radius:var(--radius);">No cards found. Create cards to see distribution.</div>`;
        return;
    }

    if (charts.maturity) charts.maturity.destroy();
    charts.maturity = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['New', 'Young', 'Mature'],
            datasets: [{
                label: 'Cards',
                data: [data.New, data.Young, data.Mature],
                backgroundColor: ['#94a3b8', '#60a5fa', '#34d399'],
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                y: { grid: { display: false } }
            }
        }
    });
}


// --- Community ---

async function loadCommunityDecks(force = false) {
    if (state.communityDecks.length > 0 && !force) {
        renderCommunityDecks();
        return;
    }

    const grid = document.getElementById('community-deck-grid');
    grid.innerHTML = '<div class="flex justify-center py-10"><span class="loading-spinner"></span><span class="ml-2">Loading Community Decks...</span></div>';

    // Fetch public decks with profiles and card count aggregate if possible
    // Since PostgREST doesn't support complex count aggregations in one select easily, 
    // we fetch them and then fetch card counts.
    const { data: decks, error } = await sb
        .from('decks')
        .select('*, profiles:user_id(username), subjects(name)')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading community decks:", error);
        grid.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        return;
    }

    // Fetch card counts for these decks
    const safeDecks = decks || [];
    const deckIds = safeDecks.map(d => d.id);
    const { data: cardCounts } = await sb
        .from('cards')
        .select('deck_id')
        .in('deck_id', deckIds);

    const countsMap = {};
    if (cardCounts) {
        cardCounts.forEach(c => {
            countsMap[c.deck_id] = (countsMap[c.deck_id] || 0) + 1;
        });
    }

    state.communityDecks = safeDecks.map(d => ({
        ...d,
        card_count: countsMap[d.id] || 0
    }));

    renderCommunityDecks();
}

function renderCommunityDecks() {
    const grid = document.getElementById('community-deck-grid');
    const results = document.getElementById('community-search-results');
    grid.innerHTML = '';
    results.innerHTML = '';
    results.classList.add('hidden');
    grid.classList.remove('hidden');

    let sorted = [...state.communityDecks];
    const sortBy = document.getElementById('community-sort-select').value;

    if (sortBy === 'user') {
        sorted.sort((a, b) => (a.profiles?.username || '').localeCompare(b.profiles?.username || ''));
    } else if (sortBy === 'cards') {
        sorted.sort((a, b) => (b.card_count || 0) - (a.card_count || 0));
    } else if (sortBy === 'az') {
        sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'za') {
        sorted.sort((a, b) => b.title.localeCompare(a.title));
    } else {
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    if (sorted.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">✨</div>
                <h3 class="text-xl font-bold">No public decks yet</h3>
                <p class="text-dim">Be the first to share a deck with the community!</p>
            </div>
        `;
        return;
    }

    sorted.forEach(deck => {
        const subjectName = deck.subjects?.name || '';
        const bannerColor = getSubjectColor(subjectName);

        const div = document.createElement('div');
        div.className = 'community-deck-card';
        div.innerHTML = `
            <div class="community-card-banner" style="background: ${bannerColor}">
                <div class="banner-subject-badge">${escapeHtml(subjectName || 'General')}</div>
                <div class="banner-initials">${escapeHtml((deck.title || 'D').slice(0, 20)) + '...'.toUpperCase()}</div>
            </div>
            <div class="community-card-content">
                <div class="community-card-header">
                    <h3 class="community-deck-title">${escapeHtml(deck.title)}</h3>
                    <span class="community-card-count">${deck.card_count || 0} cards</span>
                </div>
                <p class="community-deck-excerpt">${escapeHtml(deck.description || 'Access these flashcards and start learning today.')}</p>
                
                <div class="community-card-footer">
                    <div class="creator-mini-profile">
                        <div class="creator-avatar">${(deck.profiles?.username || 'U').charAt(0).toUpperCase()}</div>
                        <div class="creator-info">
                            <span class="creator-label">Shared by</span>
                            <span class="creator-name">${escapeHtml(deck.profiles?.username || 'user')}</span>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-sm community-view-btn" onclick="event.stopPropagation(); openDeckById('${deck.id}')">
                        Study
                    </button>
                </div>
            </div>
        `;
        div.onclick = () => openDeck(deck);
        grid.appendChild(div);
    });
}

// Search Suggestions
document.getElementById('community-search').addEventListener('input', (e) => {
    const val = e.target.value.trim().toLowerCase();
    const suggestions = document.getElementById('community-search-suggestions');

    if (val.length < 2) {
        suggestions.classList.add('hidden');
        return;
    }

    const matches = state.communityDecks.filter(d =>
        d.title.toLowerCase().includes(val) ||
        (d.profiles?.username || '').toLowerCase().includes(val)
    ).slice(0, 8);

    if (matches.length === 0) {
        suggestions.classList.add('hidden');
        return;
    }

    suggestions.innerHTML = matches.map(m => `
        <div class="dropdown-item search-suggestion-item" onclick="setCommunitySearch('${escapeHtml(m.title)}')">
            <div style="font-weight:600">${escapeHtml(m.title)}</div>
            <div style="font-size:0.75rem; color:var(--text-secondary)">by ${escapeHtml(m.profiles?.username || 'user')}</div>
        </div>
    `).join('');
    suggestions.classList.remove('hidden');
});

window.setCommunitySearch = (val) => {
    document.getElementById('community-search').value = val;
    document.getElementById('community-search-suggestions').classList.add('hidden');
    executeCommunitySearch();
};

document.getElementById('community-search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') executeCommunitySearch();
});

document.getElementById('community-search-btn').addEventListener('click', () => {
    executeCommunitySearch();
});

document.getElementById('community-sort-select').addEventListener('change', renderCommunityDecks);

async function openDeckById(id) {
    const deck = state.communityDecks.find(d => d.id === id) || state.decks.find(d => d.id === id);
    if (deck) openDeck(deck);
}

async function executeCommunitySearch() {
    const val = document.getElementById('community-search').value.trim().toLowerCase();
    const grid = document.getElementById('community-deck-grid');
    const results = document.getElementById('community-search-results');
    const suggestions = document.getElementById('community-search-suggestions');
    const clearBtn = document.getElementById('clear-search-btn');

    suggestions.classList.add('hidden');
    if (!val) {
        renderCommunityDecks();
        clearBtn.classList.add('hidden');
        return;
    }

    grid.classList.add('hidden');
    results.classList.remove('hidden');
    clearBtn.classList.remove('hidden');
    results.innerHTML = `<h3 style="margin-bottom: 3rem; font-size: 1.5rem; font-weight: 700;">Search Results for "${escapeHtml(val)}"</h3>`;

    // 1. Groups by Users
    const userMatches = [...new Set(state.communityDecks
        .filter(d => (d.profiles?.username || '').toLowerCase().includes(val))
        .map(d => d.profiles?.username))]
        .filter(u => u);

    if (userMatches.length > 0) {
        const section = document.createElement('div');
        section.style.marginBottom = '3rem';
        section.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem;">
                <span style="font-size: 0.875rem; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.15em; white-space: nowrap;">CREATORS</span>
            </div>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                ${userMatches.map(u => `
                    <div class="user-chip hover-card" onclick="setCommunitySearch('${escapeHtml(u)}')">
                        <div class="user-avatar-xs">${u.charAt(0).toUpperCase()}</div>
                        <span class="font-bold text-sm">${escapeHtml(u)}</span>
                    </div>
                `).join('')}
            </div>`;
        results.appendChild(section);
    }

    // 2. Groups by Subjects
    const subjectMatches = state.subjects.filter(s => s.name.toLowerCase().includes(val));
    if (subjectMatches.length > 0) {
        const section = document.createElement('div');
        section.style.marginBottom = '3rem';
        section.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem;">
                <span style="font-size: 0.875rem; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.15em; white-space: nowrap;">LEARNING AREAS</span>
            </div>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                ${subjectMatches.map(s => `
                    <div class="subject-tag hover-card" onclick="setCommunitySearch('${escapeHtml(s.name)}')">
                        ${escapeHtml(s.name)}
                    </div>
                `).join('')}
            </div>`;
        results.appendChild(section);
    }

    // 3. Groups by Decks
    const deckMatches = state.communityDecks.filter(d =>
        d.title.toLowerCase().includes(val) ||
        (d.description || '').toLowerCase().includes(val)
    );

    if (deckMatches.length > 0) {
        const section = document.createElement('div');
        section.style.marginBottom = '3rem';
        section.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem;">
                <span style="font-size: 0.875rem; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.15em; white-space: nowrap;">KNOWLEDGE DECKS</span>
            </div>
            <div style="display:     flex; flex-direction: column; gap: 1.25rem;"></div>`;
        const list = section.querySelector('div:last-child');

        deckMatches.forEach(deck => {
            const subjectName = deck.subjects?.name || '';
            const bannerColor = getSubjectColor(subjectName);

            const div = document.createElement('div');
            div.className = 'community-deck-card-horizontal';
            div.innerHTML = `
                <div style="width: 6px; background: ${bannerColor}; flex-shrink: 0;"></div>
                <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; flex: 1;">
                    <div>
                        <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.5rem 0; line-height: 1.3;">${escapeHtml(deck.title)}</h3>
                        <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">${escapeHtml(deck.description || 'No description provided.')}</p>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
                        <div style="display: flex; align-items: center; gap: 1.25rem; flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div class="creator-avatar" style="width:28px; height:28px; font-size:0.75rem">${(deck.profiles?.username || 'U').charAt(0).toUpperCase()}</div>
                                <div style="display: flex; align-items: center; gap: 0.375rem; font-size: 0.8rem; color: var(--text-secondary);">
                                    <span>by</span>
                                    <span style="font-weight: 600; color: var(--text-primary);">${escapeHtml(deck.profiles?.username || 'user')}</span>
                                </div>
                            </div>
                            <span style="font-size: 1rem; font-weight: 700; padding: 4px 12px; border-radius: 999px; background: ${bannerColor}20; color: ${bannerColor}; border: 1px solid ${bannerColor}30; white-space: nowrap;">${escapeHtml(subjectName || 'General')}</span>
                            <span style="font-size: 1rem; font-weight: 600; color: var(--text-secondary); white-space: nowrap;">${deck.card_count || 0} cards</span>
                        </div>
                        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openDeckById('${deck.id}')">Study</button>
                    </div>
                </div>
            `;
            div.onclick = () => openDeck(deck);
            list.appendChild(div);
        });
        results.appendChild(section);
    }

    if (userMatches.length === 0 && subjectMatches.length === 0 && deckMatches.length === 0) {
        results.innerHTML += `
            <div class="text-center py-20">
                <div class="text-6xl mb-6">🔍</div>
                <h3 class="text-xl font-bold mb-2">No results found</h3>
                <p class="text-secondary">We couldn't find anything matching "${escapeHtml(val)}"</p>
                <button class="btn btn-primary mt-4" style="margin-top: 20px;" onclick="document.getElementById('clear-search-btn').click()">Show All Decks</button>
            </div>
        `;
    }
}

document.getElementById('clear-search-btn').addEventListener('click', () => {
    document.getElementById('community-search').value = '';
    document.getElementById('clear-search-btn').classList.add('hidden');
    renderCommunityDecks();
});


// --- Utils ---

function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function renderContent(text) {
    // This allows $math$ to pass through escapeHtml safely for KaTeX
    // We escape everything first, but KaTeX contribuir-auto-render will find $...$
    return escapeHtml(text);
}

function renderMath(element) {
    if (window.renderMathInElement) {
        window.renderMathInElement(element, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ],
            throwOnError: false
        });
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Consolidated into the main switchView function at the top
// Removing duplicate definition to prevent state overwrites and logic errors

function openModal(id) {
    modalOverlay.classList.remove('hidden');
    document.getElementById(id).classList.remove('hidden');
    document.body.classList.add('modal-open');
}

function closeModal() {
    modalOverlay.classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.body.classList.remove('modal-open');
}
document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModal));
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

// --- Sharing Logic ---

async function openShareModal(deck) {
    state.currentDeck = deck;
    document.getElementById('share-deck-title').textContent = deck.title;

    // Only owner can add to group from here
    const isOwner = state.user && deck.user_id === state.user.id;
    const addToGroupBtn = document.getElementById('add-to-group-btn');
    if (addToGroupBtn) addToGroupBtn.style.display = isOwner ? 'flex' : 'none';

    updateShareUI();
    openModal('share-modal');
}

async function updateShareUI() {
    const deck = state.currentDeck;
    const accessStatus = document.getElementById('access-status');
    const accessIcon = document.getElementById('access-icon');

    const publicBadge = document.getElementById('deck-public-badge');

    if (deck.is_public) {
        accessStatus.textContent = 'Public';
        document.getElementById('access-desc').textContent = 'Anyone with the link can view this deck';
        accessIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S13.636 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.514 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />';
        if (publicBadge) publicBadge.classList.remove('hidden');
    } else {
        accessStatus.textContent = 'Restricted';
        document.getElementById('access-desc').textContent = 'Only people with access can open with the link';
        accessIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />';
        if (publicBadge) publicBadge.classList.add('hidden');
    }

    // Load shares
    const { data: shares } = await sb.from('deck_shares').select('*').eq('deck_id', deck.id);
    const list = document.getElementById('share-list');
    list.innerHTML = '';

    // Handle Group Shortcuts
    const shortcutContainer = document.getElementById('group-shortcuts-container');
    const shortcutList = document.getElementById('group-shortcuts-list');
    if (shortcutContainer && shortcutList) {
        if (deck.group_id) {
            shortcutContainer.classList.remove('hidden');
            shortcutList.innerHTML = '';
            // Fetch group name
            const { data: group } = await sb.from('groups').select('name').eq('id', deck.group_id).single();
            const li = document.createElement('li');
            li.className = 'share-list-item';
            li.innerHTML = `
                <div style="font-size:0.9rem">
                    <div class="font-semibold">${escapeHtml(group ? group.name : 'Unknown Group')}</div>
                    <div class="text-xs text-dim">Shortcut</div>
                </div>
                <button class="btn btn-text btn-sm text-danger" onclick="removeDeckFromGroup('${deck.id}')">Remove</button>
            `;
            shortcutList.appendChild(li);
        } else {
            shortcutContainer.classList.add('hidden');
        }
    }

    // Add owner
    const ownerLi = document.createElement('li');
    ownerLi.className = 'share-list-item';
    ownerLi.innerHTML = `
        <div style="font-size:0.9rem">
            <div class="font-semibold">Owner</div>
            <div class="text-xs text-dim">${escapeHtml(state.user.email)}</div>
        </div>
    `;
    list.appendChild(ownerLi);

    if (shares) {
        shares.forEach(share => {
            const li = document.createElement('li');
            li.className = 'share-list-item';
            li.innerHTML = `
                <div style="font-size:0.9rem">
                    <div class="font-semibold">${escapeHtml(share.user_email)}</div>
                    <div class="text-xs text-dim">${share.role}</div>
                </div>
                <button class="btn btn-text btn-sm text-danger" onclick="removeShare('${share.id}')">Remove</button>
            `;
            list.appendChild(li);
        });
    }
}

window.removeDeckFromGroup = async (deckId) => {
    if (!confirm('Remove this deck from group shortcuts?')) return;
    const { error } = await sb.from('decks').update({ group_id: null }).eq('id', deckId);
    if (error) {
        showToast(error.message, 'error');
    } else {
        showToast('Deck removed from group');
        if (state.currentDeck) state.currentDeck.group_id = null;
        updateShareUI();
        // Also refresh the view if we are in groups or decks
        if (decksView && !decksView.classList.contains('hidden')) loadDecksView();
    }
};

const shareForm = document.getElementById('share-form');
if (shareForm) {
    shareForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('share-email');
        const roleInput = document.getElementById('share-role');
        if (!emailInput || !roleInput) return;

        const email = emailInput.value;
        const role = roleInput.value;

        const { error } = await sb.from('deck_shares').insert([{
            deck_id: state.currentDeck.id,
            user_email: email,
            role: role
        }]);

        if (error) return showToast(error.message, 'error');

        showToast(`Shared with ${email}`);
        emailInput.value = '';
        updateShareUI();
    });
}


const toggleShareBtn = document.getElementById('toggle-share-public-btn');
if (toggleShareBtn) {
    toggleShareBtn.addEventListener('click', async () => {
        const isPublic = !state.currentDeck.is_public;
        const { error } = await sb.from('decks').update({ is_public: isPublic }).eq('id', state.currentDeck.id);

        if (error) return showToast(error.message, 'error');

        state.currentDeck.is_public = isPublic;
        showToast(`Deck is now ${isPublic ? 'Public' : 'Restricted'}`);
        updateShareUI();
    });
}


window.removeShare = async (id) => {
    const { error } = await sb.from('deck_shares').delete().eq('id', id);
    if (error) showToast(error.message, 'error');
    else updateShareUI();
};

const copyLinkBtn = document.getElementById('copy-share-link-modal');
if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
        const url = window.location.href.split('?')[0] + `?deck=${state.currentDeck.id}`;
        navigator.clipboard.writeText(url).then(() => showToast('Link copied!'));
    });
}


// --- Bulk Add Logic ---
document.getElementById('bulk-add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.currentDeck) return;

    const input = document.getElementById('bulk-add-input').value;
    const separatorType = document.querySelector('input[name="separator"]:checked').value;
    let separator = separatorType;
    if (separatorType === '\t') separator = '\t';
    if (separatorType === 'custom') separator = document.getElementById('custom-separator').value || '|';

    const lines = input.split('\n').filter(line => line.trim() !== '');
    const newCards = [];

    for (const line of lines) {
        const parts = line.split(separator);
        if (parts.length >= 2) {
            newCards.push({
                deck_id: state.currentDeck.id,
                front: parts[0].trim(),
                back: parts.slice(1).join(separator).trim()
            });
        }
    }

    if (newCards.length === 0) {
        return showToast('No valid cards found. Make sure you use the correct separator.', 'error');
    }

    const submitBtn = document.getElementById('bulk-add-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    const { error } = await sb.from('cards').insert(newCards);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Add All Cards';

    if (error) return showToast(error.message, 'error');

    showToast(`Successfully added ${newCards.length} cards!`);
    document.getElementById('bulk-add-input').value = '';
    closeModal();
    openDeck(state.currentDeck); // Refresh card list
});

// Final Init


checkUser();
// --- Add Card Dropdown Global Setup ---
(function setupAddCardDropdown() {
    const dropdownBtn = document.getElementById('add-card-dropdown-toggle');
    const dropdownMenu = document.getElementById('add-card-menu');

    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
        });

        // Close on click outside
        document.addEventListener('click', () => {
            if (!dropdownMenu.classList.contains('hidden')) {
                dropdownMenu.classList.add('hidden');
            }
        });

        // Prevent menu clicks from closing immediately (unless button logic handles it)
        dropdownMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    const bulkAddBtn = document.getElementById('menu-bulk-add');
    if (bulkAddBtn) {
        bulkAddBtn.addEventListener('click', () => {
            if (dropdownMenu) dropdownMenu.classList.add('hidden');

            // Pre-fill separator
            const separator = state.settings.defaultSeparator || '|';
            const radios = document.getElementsByName('separator');
            let found = false;
            radios.forEach(r => {
                if (r.value === separator) {
                    r.checked = true;
                    found = true;
                }
            });
            if (!found) {
                const customRadio = document.querySelector('input[name="separator"][value="custom"]');
                if (customRadio) {
                    customRadio.checked = true;
                    document.getElementById('custom-separator').value = separator;
                }
            }

            openModal('bulk-add-modal');
        });
    }

    const importCsvBtn = document.getElementById('menu-import-csv');
    if (importCsvBtn) {
        importCsvBtn.addEventListener('click', () => {
            if (dropdownMenu) dropdownMenu.classList.add('hidden');
            const csvInput = document.getElementById('csv-upload');
            if (csvInput) csvInput.click();
        });
    }

    // Continue button for non-tracking study
    const continueBtn = document.getElementById('study-continue-btn');
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            state.currentCardIndex++;
            showNextCard();
        });
    }
})();

// --- Notes Marketplace Logic ---

async function initNotes(loadMore = false) {
    if (state.notesLoading) return;
    state.notesLoading = true;

    // Get filter values
    const searchInput = document.getElementById('notes-search-input');
    const search = searchInput ? searchInput.value.trim() : '';
    const categoryEl = document.getElementById('filter-category');
    const category = categoryEl ? categoryEl.value : 'all';
    const subjectEl = document.getElementById('filter-subject');
    const subject = subjectEl ? subjectEl.value : 'all';
    const typeEl = document.getElementById('filter-type');
    const type = typeEl ? typeEl.value : 'all';

    const limit = 10;
    // If not loading more (i.e., new search/filter), reset list
    if (!loadMore) {
        state.notes = [];
    }
    const offset = state.notes.length;

    // Build query with filters
    let query = sb.from('notes')
        .select('*', { count: 'exact' }) // Get count to know if there are more
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1); // Range is inclusive

    if (search) {
        // Use text search on title or subject
        query = query.or(`title.ilike.%${search}%,subject.ilike.%${search}%`);
    }
    if (category !== 'all') {
        query = query.eq('category', category);
    }
    if (subject !== 'all') {
        query = query.eq('subject', subject);
    }
    if (type !== 'all') {
        query = query.eq('type', type);
    }

    const { data, error, count } = await query;

    state.notesLoading = false;

    if (error) {
        console.error('Error fetching notes:', error);
        if (!loadMore) state.notes = [];
        state.hasMoreNotes = false;
    } else {
        const fetched = data || [];

        if (loadMore) {
            state.notes = [...state.notes, ...fetched];
        } else {
            state.notes = fetched;
        }

        // Determine if there are more results based on total count
        // If current length is less than total count, we have more
        state.hasMoreNotes = (state.notes.length < count);
    }

    // We are no longer filtering client-side
    state.notesLoaded = true;
    renderNotes(state.notes);
}

// Debounce helper for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// This function is now just a trigger for the API call
const handleNoteFilterChange = debounce(() => {
    initNotes(false); // Reset and search
}, 500);

async function loadMoreNotes() {
    const btn = document.querySelector('#notes-footer .btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Loading...';
    }
    await initNotes(true); // Load next page
}

function loadNotesView() {
    // Just initial load if empty
    if (!state.notes || state.notes.length === 0) {
        initNotes(false);
    } else {
        renderNotes(state.notes);
    }
}

// Replaces the old client-side filter
function filterNotes() {
    handleNoteFilterChange();
}

function renderNotes(notes) {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const footer = document.getElementById('notes-footer');

    if (notes.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center p-12 text-secondary">
                <p class="text-lg">No notes found.</p>
                <div class="text-sm mt-2">Try adjusting filters or checking your connection.</div>
                <button class="btn btn-outline mt-4" onclick="resetNoteFilters()">Clear Filters</button>
            </div>
        `;
        if (footer) footer.innerHTML = '';
        return;
    }

    notes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.innerHTML = `
            <div>
                <div class="note-header">
                    <div class="note-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-lg">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                    </div>
                    <span class="note-type-badge">${note.category}</span>
                </div>
                <h3 class="note-title" title="${note.title}">${note.title}</h3>
                <p class="text-sm text-secondary mb-2">${note.subject}</p>
            </div>
            <div class="note-meta">
                <span class="note-tag">${note.type}</span>
            </div>
        `;
        card.onclick = () => openNote(note);
        grid.appendChild(card);
    });

    // Update Footer
    if (footer) {
        if (state.hasMoreNotes) {
            footer.innerHTML = `
                <button class="btn btn-outline" onclick="loadMoreNotes()" style="margin-top: 1rem;">
                    View More
                </button>
            `;
        } else if (state.notes.length > 0) {
            footer.innerHTML = `
                <p class="text-dim text-sm italic">That's everything for now!</p>
            `;
        } else {
            footer.innerHTML = '';
        }
    }
}

function resetNoteFilters() {
    document.getElementById('notes-search-input').value = '';
    document.getElementById('filter-category').value = 'all';
    document.getElementById('filter-subject').value = 'all';
    document.getElementById('filter-type').value = 'all';
    handleNoteFilterChange();
}

// PDF Viewer Logic
function openNote(note) {
    const modal = document.getElementById('pdf-viewer-modal');
    const title = document.getElementById('pdf-viewer-title');
    const frame = document.getElementById('pdf-frame');
    const fallbackContainer = document.getElementById('pdf-fallback-container');
    const directLink = document.getElementById('pdf-direct-link');

    // Set title and direct link
    title.textContent = note.title;
    directLink.href = note.url;

    // Show fallback option
    // fallbackContainer.classList.remove('hidden');

    // Use Google Docs Viewer to bypass CORS and fix iOS rendering issues
    // This renders the PDF as HTML/Images on Google's side
    if (note.url.endsWith('.pdf')) {
        frame.src = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(note.url)}`;
    } else {
        // Fallback for non-PDFs (images, etc)
        frame.src = note.url;
    }

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
}

document.getElementById('close-pdf-btn').addEventListener('click', () => {
    const modal = document.getElementById('pdf-viewer-modal');
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    document.getElementById('pdf-frame').src = ''; // Stop loading
});

// Add Note Logic
document.getElementById('add-note-btn').addEventListener('click', () => {
    openModal('add-note-modal');
});

document.getElementById('close-add-note-btn').addEventListener('click', () => {
    document.getElementById('add-note-modal').classList.add('hidden');
    document.getElementById('modal-overlay').classList.add('hidden');
});

document.getElementById('add-note-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('note-title').value;
    const category = document.getElementById('note-category').value;
    const subject = document.getElementById('note-subject').value;
    const type = document.getElementById('note-type').value;
    const url = document.getElementById('note-url').value;

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Adding...';

    const { data, error } = await sb.from('notes').insert([{
        title,
        category,
        subject,
        type,
        url,
        user_id: state.user.id
    }]).select();


    if (error) {
        showToast(error.message, 'error');
        btn.disabled = false;
        btn.textContent = originalText;
    } else {
        // Update state and UI
        if (data && data.length > 0) {
            state.notes.unshift(data[0]); // Add to top
            filterNotes();
        }

        showToast('Note added successfully!', 'success');
        document.getElementById('add-note-modal').classList.add('hidden');
        document.getElementById('modal-overlay').classList.add('hidden');
        e.target.reset();
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

// Event Listeners for Filters
['notes-search-input', 'filter-category', 'filter-subject', 'filter-type'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', filterNotes);
});