// Initialize Supabase
// NOTE: This is the public 'anon' key. It is safe to expose in the browser as long as Row Level Security (RLS) is enabled in Supabase.
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
    sessionRatings: [], // Track ratings in current session: { cardId: string, rating: number }
    currentNote: null,
    notes: []
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



function closeMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
}

function switchView(viewId) {
    // Hide all views first
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));

    // Clear card list when leaving deck-view to prevent cards persisting across tabs
    if (state.lastView === 'deck-view' && viewId !== 'deck-view') {
        const cardList = document.getElementById('card-list');
        if (cardList) cardList.innerHTML = '';
    }

    // Clear note snippet when leaving note-detail-view
    if (state.lastView === 'note-detail-view' && viewId !== 'note-detail-view') {
        const snippetFrame = document.getElementById('note-snippet-frame');
        if (snippetFrame) snippetFrame.src = '';
    }

    // Show target view
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
        state.lastView = viewId;
    }

    // Clear URL params if leaving detail views (preserve for deck/group/note views)
    const detailViews = ['deck-view', 'group-detail-view', 'note-detail-view'];
    if (!detailViews.includes(viewId)) {
        // Use a safer way to get clean URL that works on file://
        const cleanHref = window.location.href.split('?')[0];
        const url = new URL(cleanHref, window.location.href.startsWith('file') ? 'file://' : undefined);

        if (window.location.search.includes('deck') || window.location.search.includes('group') || window.location.search.includes('note')) {
            window.history.replaceState({}, '', cleanHref);
        }
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
    closeMobileSidebar();
}

// --- Auth Logic ---

async function checkUser() {
    // Check for query params (from modular landing nav)
    const urlParams = new URLSearchParams(window.location.search);
    const authAction = urlParams.get('auth');
    if (authAction === 'login') {
        console.log("URL Auth Action: Login");
        authMode = 'login';
        updateAuthUI();
        authModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
    } else if (authAction === 'signup') {
        console.log("URL Auth Action: Signup");
        authMode = 'signup';
        updateAuthUI();
        authModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
    }

    // Check for redirect params to show loader immediately
    const isRedirect = window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery'));
    const loader = document.getElementById('loading-overlay');

    if (isRedirect && loader) loader.classList.remove('hidden');

    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        // Ensure loader is visible while initializing app
        if (loader) loader.classList.remove('hidden');

        state.user = session.user;
        state.isGuest = false;
        await showApp();

        // Hide loader when app is ready
        if (loader) loader.classList.add('hidden');
    } else {
        if (loader) loader.classList.add('hidden'); // Ensure hidden if no session
        state.isGuest = false;
        showAuth();
        detectLinksEarly();
    }

    // Check for admin/uploader access
    if (state.user && state.user.email === 'kohzanden@gmail.com') {
        const addBtn = document.getElementById('add-note-btn');
        if (addBtn) addBtn.classList.remove('hidden');
    }

    sb.auth.onAuthStateChange((_event, session) => {
        console.log("Auth state changed:", _event, session);
        state.user = session ? session.user : null;
        if (state.user) {
            showApp();
        } else {
            showAuth();
        }
    });
}
console.log("Script.js: Auth logic initialized");

// Auth Toggle
let authMode = 'login';

function updateAuthUI() {
    console.log("updateAuthUI called. Mode:", authMode);
    const submitBtn = document.getElementById('auth-submit');
    const toggleText = document.getElementById('auth-toggle-text');
    const toggleLink = document.getElementById('auth-toggle-link');

    if (submitBtn) submitBtn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
    if (toggleText) toggleText.textContent = authMode === 'login' ? "Don't have an account?" : "Already have an account?";
    if (toggleLink) toggleLink.textContent = authMode === 'login' ? 'Sign Up' : 'Sign In';

    if (authTitle) authTitle.textContent = authMode === 'login' ? 'Welcome Back' : 'Create Account';
    if (authSubtitle) authSubtitle.textContent = authMode === 'login' ? 'Log in to your Flashly account' : 'Start your learning journey today';
}

const authToggleLink = document.getElementById('auth-toggle-link');
if (authToggleLink) {
    authToggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        authMode = authMode === 'login' ? 'signup' : 'login';
        updateAuthUI();
    });
}

// Auth Toggle Logic (Event Delegation)
document.addEventListener('click', (e) => {
    // console.log("Click detected on document", e.target); 
    const loginBtn = e.target.closest('.btn-login-toggle');
    const signupBtn = e.target.closest('.btn-signup-toggle');

    if (loginBtn) {
        if (!authModal) {
            console.error("Auth modal element not found!");
            return;
        }
        authMode = 'login';
        // console.log("Login button logic triggered");
        if (!authModal) {
            // console.error("Auth modal element not found!");
            return;
        }
        authMode = 'login';
        updateAuthUI();
        authModal.classList.remove('hidden');
        authModal.style.display = 'flex'; // FORCE DISPLAY
        document.body.classList.add('modal-open');

        // Logs removed


        if (document.getElementById('guest-preview-modal')) {
            document.getElementById('guest-preview-modal').classList.add('hidden');
        }
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    if (signupBtn) {
        // console.log("Signup button logic triggered");
        if (!authModal) {
            // console.error("Auth modal element not found!");
            return;
        }
        authMode = 'signup';
        updateAuthUI();
        authModal.classList.remove('hidden');
        authModal.style.display = 'flex'; // FORCE DISPLAY
        document.body.classList.add('modal-open');

        // Logs removed


        if (document.getElementById('guest-preview-modal')) {
            document.getElementById('guest-preview-modal').classList.add('hidden');
        }
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.classList.add('hidden');
    }
});

const authModalClose = document.querySelector('.auth-modal-close');
if (authModalClose && authModal) {
    authModalClose.onclick = () => {
        authModal.classList.add('hidden');
        authModal.style.display = ''; // Reset inline style
        document.body.classList.remove('modal-open');
    };
}

if (authModal) {
    authModal.onclick = (e) => {
        if (e.target === authModal) {
            authModal.classList.add('hidden');
            authModal.style.display = ''; // Reset inline style
            document.body.classList.remove('modal-open');
        }
    };
}

// Google Auth
const googleAuthBtn = document.getElementById('google-auth-btn');
if (googleAuthBtn) {
    googleAuthBtn.addEventListener('click', async () => {
        const btn = googleAuthBtn;
        const originalText = btn.innerHTML;

        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Redirecting...';

        // Show the global loading overlay to match email auth experience
        const loader = document.getElementById('loading-overlay');
        if (loader) loader.classList.remove('hidden');

        // Get base URL without query params to ensure clean redirect
        const baseUrl = window.location.origin + window.location.pathname;

        const { error } = await sb.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: baseUrl, // Redirect back to current domain
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            }
        });

        if (error) {
            showToast(error.message, 'error');
            btn.disabled = false;
            btn.innerHTML = originalText;
            if (loader) loader.classList.add('hidden');
        }
    });
}

// Auth Form Submit
document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('auth-submit');
    const originalText = btn.textContent;

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Processing...';

    let result;
    if (authMode === 'login') {
        result = await sb.auth.signInWithPassword({ email, password });
    } else {
        result = await sb.auth.signUp({ email, password });
    }
    const { data, error } = result;

    if (error) {
        showToast(error.message, 'error');
        btn.disabled = false;
        btn.textContent = originalText;
    } else if (authMode === 'signup' && !data?.session) {
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


function closeAllModals() {
    const modals = [
        'guest-preview-modal',
        'study-settings-modal',
        'create-deck-modal',
        'create-group-modal',
        'create-subject-modal',
        'settings-modal',
        'share-modal',
        'pdf-viewer-modal',
        'redirect-modal'
    ];

    modals.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    if (typeof modalOverlay !== 'undefined') modalOverlay.classList.add('hidden');

    // Close mobile nav
    const mobileNav = document.getElementById('mobile-nav-modal');
    if (mobileNav) mobileNav.classList.remove('active');

    const menuToggle = document.getElementById('landing-mobile-menu-toggle');
    if (menuToggle && menuToggle.classList.contains('active')) {
        menuToggle.classList.remove('active');
        // Reset icon to hamburger
        menuToggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="icon-md">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
        `;
        document.body.style.overflow = '';
    }
}

function showAuth() {
    authView.classList.remove('hidden');
    mainLayout.classList.add('hidden');
    authModal.classList.add('hidden');
}

async function showApp() {
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
        await handleDeepLinks(); // Check for ?join= or ?deck= codes

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

    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (menuToggle && sidebar && sidebarOverlay) {
        menuToggle.onclick = () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        };
    }

    if ((closeSidebar || sidebarOverlay) && sidebar) {
        if (closeSidebar) closeSidebar.onclick = closeMobileSidebar;
        if (sidebarOverlay) sidebarOverlay.onclick = closeMobileSidebar;
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

    // --- 2. Handle Group Deep Link ---
    const groupId = url.searchParams.get('group');
    if (groupId) {
        url.searchParams.delete('group');
        dirty = true;

        // Fetch group to verify access
        const { data: group } = await sb.from('groups').select('*').eq('id', groupId).maybeSingle();
        if (group) {
            const { data: member } = await sb.from('group_members').select('role').eq('group_id', groupId).eq('user_id', state.user.id).maybeSingle();
            if (member) {
                group.myRole = member.role;
                openGroup(group);
            } else {
                showToast('You are not a member of this group', 'error');
            }
        }
    }

    // --- 3. Handle Deck Link ---
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

    // --- 4. Handle Note Link ---
    const noteId = url.searchParams.get('note');
    if (noteId) {
        try {
            const { data: note, error } = await sb.from('notes').select('*').eq('id', noteId).maybeSingle();
            if (error || !note) {
                console.warn('Deep link note fetch failed:', error);
                // If we have a note ID but can't fetch it, we might still want to try to stay in the view 
                // but usually it means RLS restricted it.
            } else {
                openNote(note);
            }
        } catch (err) {
            console.error('Note deep link error:', err);
        }
    }

    // Only replace state if we actually cleaned something up (like 'join')
    // and we aren't in a detail view that needs to keep its params
    if (dirty && !['deck-view', 'group-detail-view', 'note-detail-view'].includes(state.lastView)) {
        window.history.replaceState({}, document.title, url.toString());
    }
}

// Helper to reliably switch to note view from deep link
function openNoteFromLink(noteId) {
    if (!noteId) return;
    sb.from('notes').select('*').eq('id', noteId).maybeSingle().then(({ data: note, error }) => {
        if (!error && note) {
            openNote(note);
        } else {
            console.warn('Failed to load deep linked note:', noteId, error);
        }
    });
}

async function detectLinksEarly() {
    const url = new URL(window.location.href);
    const joinCode = url.searchParams.get('join');
    const deckId = url.searchParams.get('deck');
    const noteId = url.searchParams.get('note');

    if (!joinCode && !deckId && !noteId) return;

    if (joinCode) {
        const { data: group } = await sb.from('groups').select('id, name').eq('invite_code', joinCode).maybeSingle();
        if (group) showGuestPreview('group', group);
    } else if (deckId) {
        const { data: deck } = await sb.from('decks').select('id, title, description').eq('id', deckId).maybeSingle();
        if (deck) showGuestPreview('deck', deck);
    } else if (noteId) {
        try {
            const { data: note } = await sb.from('notes').select('id, title').eq('id', noteId).maybeSingle();
            if (note) {
                showGuestPreview('note', note);
            } else {
                // Show generic note preview if RLS blocked the fetch
                showGuestPreview('note', { id: noteId, title: 'Shared Note' });
            }
        } catch (e) {
            showGuestPreview('note', { id: noteId, title: 'Shared Note' });
        }
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
    } else if (type === 'note') {
        title.textContent = "View Shared Note";
        subtitle.textContent = "Quickly access and download this shared academic resource.";
        meta.innerHTML = `
            <div class="font-bold text-lg">${escapeHtml(data.title)}</div>
        `;
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 40px; height: 40px;"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>`;
    } else { // type === 'deck'
        title.textContent = "Access this Deck";
        subtitle.textContent = "Master this deck with our optimized spaced repetition system.";
        meta.innerHTML = `
            <div class="font-bold text-lg">${escapeHtml(data.title)}</div>
            ${data.description ? `<div class="text-xs text-secondary mt-2">${escapeHtml(data.description)}</div>` : ''}
        `;
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width: 40px; height: 40px;"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v6.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125v-6.75" /></svg>`;
    }

    modal.classList.remove('hidden');
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.body.classList.add('modal-open');
}

async function fetchUserProfile() {
    // Try to fetch all settings, but handle cases where columns might be missing (400 error)
    const { data, error } = await sb.from('profiles')
        .select('username, theme, reduced_motion, compact_sidebar, daily_limit, default_separator, auto_flip, show_progress, last_ai_deck_at, daily_ai_summaries, last_summary_at')
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
        let username = data.username;

        // Determine if username needs to be set or updated from default (email)
        // If username is missing OR it matches the email exactly (default behavior), try to improve it
        const isDefaultUsername = !username || (state.user.email && username === state.user.email);

        if (isDefaultUsername && state.user.email) {
            let newUsername = state.user.email.split('@')[0];

            // If Google Auth, try to use display name
            const provider = state.user.app_metadata ? state.user.app_metadata.provider : null;
            const meta = state.user.user_metadata;

            if (provider === 'google' && meta && (meta.full_name || meta.name)) {
                newUsername = meta.full_name || meta.name;
            }

            // Only update if it's different and valid
            if (newUsername && newUsername !== username) {
                username = newUsername;
                // Update profile with derived username
                await sb.from('profiles').upsert({ id: state.user.id, username: username });
            }
        }

        if (username) {
            state.user.username = username;
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) userDisplay.textContent = username;
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

        // AI Usage limits tracking
        state.ai_usage = {
            last_ai_deck_at: data.last_ai_deck_at,
            daily_ai_summaries: data.daily_ai_summaries || 0,
            last_summary_at: data.last_summary_at
        };

        // Sync to local storage
        syncToLocal();

        // Apply settings
        applyTheme(state.settings.theme, false);
        applyInterfaceSettings();
        checkAIUsageLimits(); // Refresh AI button states

        // Onboarding Check
        if (!localStorage.getItem('flashly-onboarding-seen')) {
            setTimeout(() => {
                const modal = document.getElementById('onboarding-modal');
                if (modal) modal.classList.remove('hidden');
            }, 1000);
        }
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
        document.body.classList.add('modal-open');
        closeMobileSidebar();
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
        document.body.classList.add('modal-open');
        closeMobileSidebar();
        return;
    }
    updateNav('nav-decks');
    switchView('decks-view');
    loadDecksView(true); // Force full fetch to ensure both tabs have data
});
const myDecksTab = document.getElementById('my-decks-tab');
const sharedDecksTab = document.getElementById('shared-decks-tab');

if (myDecksTab) {
    myDecksTab.addEventListener('click', () => {
        state.deckTab = 'my';
        myDecksTab.classList.add('active');
        sharedDecksTab.classList.remove('active');
        renderDecksViewWithSubjects(); // Instant render
    });
}

if (sharedDecksTab) {
    sharedDecksTab.addEventListener('click', () => {
        state.deckTab = 'shared';
        sharedDecksTab.classList.add('active');
        myDecksTab.classList.remove('active');
        renderDecksViewWithSubjects(); // Instant render
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
        document.body.classList.add('modal-open');
        closeMobileSidebar();
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
        document.body.classList.add('modal-open');
        closeMobileSidebar();
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
        document.body.classList.add('modal-open');
        closeMobileSidebar();
        return;
    }
    initSettingsModal();
    openModal('settings-modal');
});

// Delete Account Handler
const deleteAccountBtn = document.getElementById('delete-account-btn');
if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
        if (confirm('Are you definitely sure? This will permanently delete your account and all associated data. This action cannot be undone.')) {
            const btn = deleteAccountBtn;
            const originalText = btn.textContent;

            btn.disabled = true;
            btn.innerHTML = '<span class="loading-spinner"></span> Deleting...';

            try {
                // Attempt to delete user profile (this should cascade delete decks, cards, etc. if configured in DB)
                // If cascade is not set up, we manually delete decks first.
                // Since we don't have cascade on profiles -> users in the schema, we delete the profile row.
                // Users usually have RLS to delete their own profile.

                // 1. Delete Decks (Cascades to cards)
                const { error: deckError } = await sb.from('decks').delete().eq('user_id', state.user.id);
                if (deckError) console.warn('Deck deletion warning:', deckError);

                // 2. Delete Profile
                const { error: profileError } = await sb.from('profiles').delete().eq('id', state.user.id);
                if (profileError) {
                    console.error('Profile deletion error:', profileError);
                    // If we can't delete profile, we throw, but we might have already deleted decks.
                    // Proceed to sign out anyway as a "soft delete" from client perspective if severe error.
                    if (profileError.code !== 'PGRST100') { // Ignore some specific errors if needed
                        throw new Error('Could not delete account profile. Please contact support.');
                    }
                }

                // 3. Sign Out
                await sb.auth.signOut();
                window.location.reload();

            } catch (err) {
                console.error(err);
                alert('Error deleting account: ' + err.message);
                btn.disabled = false;
                btn.textContent = originalText;
            }
        }
    });
}

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
    
    // Fetch cards with due_at <= now to calculate breakdown
    const { data: dueCards, error: cardsError } = await sb
        .from('cards')
        .select('id, interval_days, reviews_count')
        .lte('due_at', now); // due_at <= now

    let totalDue = 0;
    let difficultCount = 0;
    let easyCount = 0;

    if (!cardsError && dueCards) {
        totalDue = dueCards.length;
        
        // Define limit here before using it
        let limit = state.settings.dailyLimit || 20;
        if (limit > 1000) limit = totalDue;
        
        // Sort cards by due date to get the ones that will be reviewed
        dueCards.sort((a, b) => new Date(a.due_at || 0) - new Date(b.due_at || 0));
        
        // Get only the cards within the daily limit
        const cardsToReview = dueCards.slice(0, limit);
        
        // Calculate difficult (learning) and easy (review) counts from limited cards
        cardsToReview.forEach(card => {
            const interval = Number(card.interval_days || 0);
            const reviews = Number(card.reviews_count || 0);
            
            if (reviews === 0) {
                // New card - count as difficult for now
                difficultCount++;
            } else if (interval < 1) {
                // Learning (interval < 1 day) - difficult
                difficultCount++;
            } else {
                // Review (interval >= 1 day) - easy
                easyCount++;
            }
        });
        
        const displayCount = Math.min(totalDue, limit);
        document.getElementById('today-due-count').textContent = displayCount;

        // Update subtitle to show context
        const subText = document.getElementById('today-due-label');
        if (subText) {
            if (limit < totalDue) {
                subText.innerHTML = `cards to review (Goal: ${limit}) <span style="font-size:0.85em; opacity:0.7; display:block; margin-top:4px;">Total backlog: ${totalDue}</span>`;
            } else {
                subText.textContent = 'cards due today';
            }
        }

        // Update difficult/easy breakdown
        const difficultEl = document.getElementById('today-difficult-count');
        const easyEl = document.getElementById('today-easy-count');
        const breakdownEl = document.getElementById('due-breakdown');
        
        if (difficultEl) difficultEl.textContent = difficultCount;
        if (easyEl) easyEl.textContent = easyCount;
        
        // Show/hide breakdown based on whether there are any cards
        if (breakdownEl) {
            if (totalDue > 0) {
                breakdownEl.classList.remove('hidden');
            } else {
                breakdownEl.classList.add('hidden');
            }
        }
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



    // 5. Load Today Sections
    loadTodaySections();
}

async function loadTodaySections() {
    // Run independently so one doesn't block the other
    const [myDecks, commDecks] = await Promise.all([
        loadTodayMyDecks(),
        loadTodayCommunity()
    ]);

    // 3. Recommended Notes based on subjects of the above
    const subjects = new Set();
    const addSubject = (d) => {
        const name = d.subjects?.name || d.subject; // Handle joined name or potential direct column
        if (name && typeof name === 'string') subjects.add(name);
    };

    if (myDecks) myDecks.forEach(addSubject);
    if (commDecks) commDecks.forEach(addSubject);

    loadTodayNotes(Array.from(subjects));
}

async function loadTodayMyDecks() {
    const section = document.getElementById('today-my-decks-section');
    const grid = document.getElementById('today-my-decks-grid');
    if (!grid) return null;

    grid.innerHTML = getSkeletonLoadingCards(3);

    const { data: decks } = await sb.from('decks').select('id, title, user_id, subject_id, group_id, subjects(name)');
    if (!decks) {
        section.classList.add('hidden');
        return null;
    }

    // Parallel fetch for shared access
    const [groupMembersRes, directSharesRes] = await Promise.all([
        sb.from('group_members').select('group_id').eq('user_id', state.user.id),
        sb.from('deck_shares').select('deck_id').eq('user_email', state.user.email)
    ]);

    const myGroupIds = groupMembersRes.data ? groupMembersRes.data.map(gm => gm.group_id) : [];
    const sharedDeckIds = directSharesRes.data ? directSharesRes.data.map(ds => ds.deck_id) : [];

    // Filter: Include ONLY decks owned by me for 'Ready to Learn'
    const myAccessDecks = decks.filter(d => d.user_id === state.user.id);

    if (myAccessDecks.length === 0) {
        section.classList.add('hidden');
        return null; // No decks to show
    }

    const now = new Date().toISOString();
    // Fetch due cards only for relevant decks to optimize? Or just all due cards for me?
    // Let's filter cards by deck_id using 'in' if possible, but list might be long.
    // Simpler: Fetch all due cards (RLS handles visibility generally), then filter by myAccessDecks in JS.
    const { data: cards } = await sb.from('cards')
        .select('deck_id, due_at')
        .lte('due_at', now);

    const deckStats = {};
    if (cards) {
        cards.forEach(c => {
            if (!deckStats[c.deck_id]) deckStats[c.deck_id] = { count: 0, earliest: c.due_at };
            deckStats[c.deck_id].count++;
            if (c.due_at < deckStats[c.deck_id].earliest) deckStats[c.deck_id].earliest = c.due_at;
        });
    }

    const focusDecks = myAccessDecks.filter(d => deckStats[d.id] && deckStats[d.id].count > 0);

    focusDecks.sort((a, b) => {
        const statsA = deckStats[a.id];
        const statsB = deckStats[b.id];
        if (new Date(statsA.earliest) - new Date(statsB.earliest) !== 0)
            return new Date(statsA.earliest) - new Date(statsB.earliest);
        return statsB.count - statsA.count;
    });

    const top3 = focusDecks.slice(0, 3);
    grid.innerHTML = '';

    if (top3.length === 0) {
        section.classList.add('hidden');
        return decks; // Return all decks to use their subjects for notes even if none are due
    }

    section.classList.remove('hidden');
    top3.forEach(deck => {
        const stats = deckStats[deck.id];
        const div = document.createElement('div');
        div.className = 'dashboard-card';
        div.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <span class="badge badge-due">${stats.count} Due</span>
            </div>
            <h4 class="font-semibold text-lg mb-1">${escapeHtml(deck.title)}</h4>
            <p class="text-sm text-dim mb-4">Urgent review available</p>
            <button class="btn btn-primary btn-sm w-full">Study Now</button>
        `;
        div.onclick = () => {
            state.lastView = 'today-view';
            openDeck(deck);
        };
        grid.appendChild(div);
    });
    return decks;
}

async function loadTodayCommunity() {
    const grid = document.getElementById('today-community-grid');
    if (!grid) return null;

    grid.innerHTML = getSkeletonLoadingCards(3);

    // Latest 3 public decks
    const { data: decks, error } = await sb.from('decks')
        .select('*, profiles:user_id(username), subjects(name)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error("Error loading today community decks:", error);
    }

    if (error || !decks || decks.length === 0) {
        document.getElementById('today-community-section').classList.add('hidden');
        return null;
    }

    document.getElementById('today-community-section').classList.remove('hidden');
    grid.innerHTML = '';
    decks.forEach(deck => {
        const div = document.createElement('div');
        div.className = 'dashboard-card';
        div.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <span class="text-xs font-bold text-primary uppercase">${escapeHtml(deck.subjects?.name || 'General')}</span>
            </div>
            <h4 class="font-semibold text-lg mb-1">${escapeHtml(deck.title)}</h4>
            <p class="text-xs text-dim mb-4">By ${escapeHtml(deck.profiles?.username || 'Flashly User')}</p>
            <button class="btn btn-outline btn-sm w-full">View Deck</button>
        `;
        div.onclick = () => {
            state.lastView = 'today-view';
            openDeck(deck);
        };
        grid.appendChild(div);
    });
    return decks;
}

async function loadTodayNotes(subjects) {
    const section = document.getElementById('today-notes-section');
    const grid = document.getElementById('today-notes-grid');
    if (!grid) return;

    grid.innerHTML = getSkeletonLoadingCards(3);

    let query = sb.from('notes').select('*').limit(3).order('created_at', { ascending: false });

    // If we have subjects, try to match them. 
    // This is a simple OR match on subjects.
    if (subjects.length > 0) {
        // Filter out empty subjects
        const validSubjects = subjects.filter(s => s && s.trim() !== '');
        if (validSubjects.length > 0) {
            // Note: Supabase 'in' filter is good for this
            query = query.in('subject', validSubjects);
        }
    }

    const { data: notes, error } = await query;

    // If matching failed or empty, just fetch latest 3
    let finalNotes = notes;
    if (error || !notes || notes.length === 0) {
        const { data: latest } = await sb.from('notes').select('*').limit(3).order('created_at', { ascending: false });
        finalNotes = latest;
    }

    if (!finalNotes || finalNotes.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    grid.innerHTML = '';
    finalNotes.forEach(note => {
        const div = document.createElement('div');
        div.className = 'dashboard-card';
        div.style.minHeight = '160px';
        div.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <span class="badge badge-sm" style="background: var(--primary-light); color: var(--primary)">${escapeHtml(note.subject || 'Resource')}</span>
            </div>
            <h4 class="font-semibold text-base mb-2 line-clamp-2">${escapeHtml(note.title)}</h4>
            <p class="text-xs text-dim mb-4">${escapeHtml(note.category || '')}</p>
        `;
        div.onclick = () => {
            state.lastView = 'today-view';
            openNote(note);
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
    const list = document.getElementById('deck-list');

    // Instant toggle if data is present and not forced
    if (!force && state.decks && state.decks.length > 0 && state.subjects && state.subjects.length > 0) {
        renderDecksViewWithSubjects();
        return;
    }

    if (list) list.innerHTML = getComponentLoader('Syncing your decks...');

    // 1. Fetch access rights first (Shared & Groups)
    const [gpRes, dsRes] = await Promise.all([
        sb.from('group_members').select('group_id').eq('user_id', state.user.id),
        sb.from('deck_shares').select('deck_id').eq('user_email', state.user.email)
    ]);

    state.myGroupIds = gpRes.data ? gpRes.data.map(gm => gm.group_id) : [];
    state.sharedDeckIds = dsRes.data ? dsRes.data.map(ds => ds.deck_id) : [];

    // 2. Fetch ALL relevant decks (Owned + Shared + Community shared via Group)
    let decks;
    const conditions = [`user_id.eq.${state.user.id}`];
    if (state.sharedDeckIds.length > 0) conditions.push(`id.in.(${state.sharedDeckIds.join(',')})`);
    if (state.myGroupIds.length > 0) conditions.push(`group_id.in.(${state.myGroupIds.join(',')})`);

    const { data: deckData, error: deckErr } = await sb.from('decks')
        .select('*, subjects(name)')
        .or(conditions.join(','))
        .order('created_at', { ascending: false });

    if (deckErr) return showToast(deckErr.message, 'error');
    state.decks = deckData || [];

    if (state.decks.length === 0) {
        // Fetch subjects even if no decks (to handle subject-only views)
        const { data: subjects } = await sb.from('subjects')
            .select('*')
            .eq('user_id', state.user.id)
            .order('name');
        state.subjects = subjects || [];

        if (list) list.innerHTML = `<div class="p-8 text-center text-secondary">No decks found. Create one to get started!</div>`;
        return;
    }

    // 3. Fetch stats for all fetched decks
    const deckIds = state.decks.map(d => d.id);
    const stats = {};
    const { data: cards } = await sb.from('cards')
        .select('id, deck_id, due_at, interval_days, reviews_count')
        .in('deck_id', deckIds);

    const user_id = state.user?.id;
    const { data: logs } = user_id ? await sb.from('study_logs')
        .select('card_id, rating')
        .eq('user_id', user_id)
        .order('review_time', { ascending: false })
        .limit(5000) : { data: [] };

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
            if (!stats[card.deck_id]) stats[card.deck_id] = { total: 0, due: 0, new: 0, learn: 0, review: 0, mature: 0 };
            stats[card.deck_id].total++;
            const due = card.due_at ? new Date(card.due_at) : null;
            const interval = Number(card.interval_days || 0);
            const reviews = Number(card.reviews_count || 0);
            const isDue = (interval === 0) || (due && due <= now);
            if (isDue) {
                if (reviews === 0) { stats[card.deck_id].new++; }
                else {
                    stats[card.deck_id].due++;
                    if (interval < 1) stats[card.deck_id].learn++;
                    else stats[card.deck_id].review++;
                }
            }
            if (cardMastery.has(card.id)) stats[card.deck_id].mature++;
        });
    }

    state.decks = state.decks.map(d => ({ ...d, stats: stats[d.id] || { total: 0, due: 0, new: 0, learn: 0, review: 0, mature: 0 } }));

    // 4. Fetch Subjects
    const { data: subjects } = await sb.from('subjects')
        .select('*')
        .eq('user_id', state.user.id)
        .order('name');
    state.subjects = subjects || [];

    renderDecksViewWithSubjects();
}

function renderDecksViewWithSubjects() {
    const list = document.getElementById('deck-list');
    list.innerHTML = '';

    const filteredDecks = state.deckTab === 'shared'
        ? state.decks.filter(d => {
            if (d.user_id === state.user.id) return false; // Exclude my own decks

            // Include if:
            // 1. Explicitly shared via email
            if (state.sharedDeckIds && state.sharedDeckIds.includes(d.id)) return true;

            // 2. Shared via a group I am a member of
            if (d.group_id && state.myGroupIds && state.myGroupIds.includes(d.group_id)) return true;

            return false; // Exclude public decks not explicitly shared
        })
        : state.decks.filter(d => d.user_id === state.user.id);

    // Default message when no decks exist in 'My Decks'
    if (state.deckTab === 'my' && filteredDecks.length === 0 && state.subjects.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div style="width: 100%; text-align: center; margin: 100px 0">
                    <h3>No Decks Yet</h3>
                    <p>Create your first deck or subject to start organizing your learning.</p>
                    <div style="display: flex; gap: 12px; justify-content: center; margin-top: 1.5rem;">
                        <button class="btn btn-primary" onclick="document.getElementById('create-deck-btn').click()">Create Deck</button>
                        <button class="btn btn-outline" onclick="updateNav('nav-community'); switchView('community-view'); loadCommunityDecks();">View Community Decks</button>
                    </div>
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
                    <p>Decks shared with you directly or via groups will appear here.</p>
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

    // 2. Render Uncategorized Decks (including decks with subjects not in our list)
    const subjectIds = new Set(state.subjects.map(s => s.id));
    const uncategorized = filteredDecks.filter(d => !d.subject_id || !subjectIds.has(d.subject_id));
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
        <div class="deck-status" style="white-space: nowrap;">
            ${(stats.due > 0 || stats.new > 0 || stats.learn > 0) ? `
                <div style="display:inline-flex; gap:6px; font-weight:600; font-size: 0.85rem; background: var(--surface-hover); padding: 4px 8px; border-radius: 6px;">
                    <span style="color:#3b82f6;" title="New">${stats.new || 0}</span>
                    <span style="color:#ef4444;" title="Learning">${stats.learn || 0}</span>
                    <span style="color:#22c55e;" title="Review">${stats.review || 0}</span>
                </div>
            ` : `<span class="badge badge-success">Done</span>`}
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
    if (state.isGuest) {
        closeAllModals();
        authMode = 'login';
        updateAuthUI();
        authModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        return;
    }
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

    const isOwner = state.user && deck.user_id === state.user.id;

    const options = [
        { label: 'Study', action: () => { state.currentDeck = deck; state.studySessionConfig = { type: 'standard' }; startStudySession(); } },
        { label: 'Open', action: () => openDeck(deck) }
    ];

    if (isOwner) {
        options.push({ label: 'Rename', action: () => renameDeck(deck) });
        options.push({ label: 'Move to Subject', action: () => moveDeckToSubject(deck) });
        options.push({ label: 'Delete', danger: true, action: () => deleteDeckQuick(deck) });
    } else {
        // For shared decks, users can only Open to see more options (checked async)
    }

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
    // Setup Delete Button in Modal
    const deleteBtn = document.getElementById('modal-delete-deck-btn');
    if (deleteBtn) {
        // Only owner can delete
        const isOwner = state.user && deck.user_id === state.user.id;

        // Hide/Show Danger Zone container
        // Assuming deleteBtn is inside .danger-zone or .flex inside .danger-zone
        // We'll target closest .danger-zone
        const dangerZone = deleteBtn.closest('.danger-zone');
        if (dangerZone) dangerZone.style.display = isOwner ? 'block' : 'none';
        else deleteBtn.style.display = isOwner ? 'block' : 'none'; // Fallback

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
        await loadDecksView(true);
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
    // Ensure navigation highlight
    if (state.user && deck.user_id === state.user.id) {
        updateNav('nav-decks');
    } else if (deck.group_id) {
        updateNav('nav-groups');
    } else {
        updateNav('nav-community');
    }

    // Only update origin if coming from a main view, not internal views (like refresh or back from study)
    const validOrigins = ['decks-view', 'community-view', 'groups-view', 'group-detail-view', 'today-view'];
    if (validOrigins.includes(state.lastView)) {
        state.deckOrigin = state.lastView;
    }

    state.currentDeck = deck;
    document.getElementById('current-deck-title').textContent = deck.title;
    const descEl = document.getElementById('current-deck-description');
    if (descEl) descEl.textContent = deck.description || '';

    // === PERMISSION CHECK ===
    let canEdit = false;
    const isOwner = state.user && deck.user_id === state.user.id;

    // Check direct share permission
    let shareRole = null;
    if (state.user && !isOwner) {
        const { data: share } = await sb.from('deck_shares')
            .select('role')
            .eq('deck_id', deck.id)
            .eq('user_email', state.user.email)
            .maybeSingle();
        if (share) shareRole = share.role;
    }

    // Check group permission
    const isGroupAdmin = deck.group_id && canEditGroupDeck(deck);

    // Final permission logic
    if (isOwner) canEdit = true;
    else if (shareRole === 'editor') canEdit = true;
    else if (isGroupAdmin) canEdit = true;

    // Display Subject (Read-Only context)
    let subjectName = deck.subjects?.name || deck.subject;
    // If deck.subjects isn't populated but subject_id exists, try to find it in state.subjects
    if (!subjectName && deck.subject_id) {
        const foundSub = state.subjects.find(s => s.id === deck.subject_id);
        if (foundSub) subjectName = foundSub.name;
        // If still not found (e.g. shared from someone else's subject list), we might need to fetch it
        // But let's rely on what we have or show 'Uncategorized' for now, or fetch if critical.
        // Given "make sure I can see the subject its in", let's try a quick fetch if missing.
    }

    // Fetch subject name if missing and ID exists (for shared decks)
    if (!subjectName && deck.subject_id) {
        const { data: sub } = await sb.from('subjects').select('name').eq('id', deck.subject_id).maybeSingle();
        if (sub) subjectName = sub.name;
    }

    const publicBadge = document.getElementById('deck-public-badge');

    // Use public badge area to show subject too? Or separate element?
    // Let's create/use a subject badge next to public badge.
    let subjectBadge = document.getElementById('deck-subject-badge');
    if (!subjectBadge) {
        subjectBadge = document.createElement('span');
        subjectBadge.id = 'deck-subject-badge';
        subjectBadge.className = 'badge badge-subject';
        subjectBadge.style = "width: fit-content;";
        // Insert after public badge
        if (publicBadge && publicBadge.parentNode) {
            publicBadge.parentNode.insertBefore(subjectBadge, publicBadge.nextSibling);
        }
    }

    if (subjectName) {
        subjectBadge.textContent = subjectName;
        subjectBadge.classList.remove('hidden');
        subjectBadge.style.backgroundColor = 'var(--primary)';
        subjectBadge.style.color = 'white';
        subjectBadge.style.border = '1px solid var(--primary)';
    } else {
        subjectBadge.classList.add('hidden');
    }

    if (deck.is_public) {
        publicBadge.classList.remove('hidden');
    } else {
        publicBadge.classList.add('hidden');
    }

    switchView('deck-view');

    // Update URL with deck ID for deep linking (must be after switchView to avoid cleanup)
    const url = new URL(window.location);
    url.searchParams.set('deck', deck.id);
    window.history.pushState({ deckId: deck.id }, '', url);

    // Set Stats
    // Set Stats - Prioritize state.decks for accurate stats from loadDecksView
    let stats = deck.stats;
    if (!stats || stats.total === 0) {
        const dInState = state.decks.find(d => d.id === deck.id);
        if (dInState && dInState.stats && dInState.stats.total > 0) stats = dInState.stats;
    }
    if (!stats) stats = { total: 0, due: 0, new: 0, mature: 0, learn: 0, review: 0 };

    // PROACTIVE REFRESH for owned decks or if stats look stale/missing
    if (isOwner) {
        // We call it but don't necessarily await it here to keep UI snappy, 
        // unless they are completely missing.
        if (stats.total === 0) {
            const freshStats = await refreshDeckStatsOnly(deck.id);
            if (freshStats) stats = freshStats;

            // Re-fetch deck from state after refresh
            const updatedDeck = state.decks.find(d => d.id === deck.id);
            if (updatedDeck && updatedDeck.stats) {
                // Keep the reference updated if possible
                Object.assign(updatedDeck.stats, stats);
            }
        } else {
            refreshDeckStatsOnly(deck.id); // Background refresh
        }
    }

    // For guests browsing public/community decks, 
    // if stats are still missing (total is 0), populate them from card_count as a fallback.
    // OWNERS should have their stats refreshed by now via refreshDeckStatsOnly.
    if (!isOwner && stats.total === 0 && deck.card_count > 0) {
        stats.total = deck.card_count;
        stats.new = deck.card_count;
        stats.due = deck.card_count;
    }

    const mastery = stats.total > 0 ? Math.round(((stats.mature || 0) / stats.total) * 100) : 0;

    const masteryPercentEl = document.getElementById('deck-mastery-percent');
    if (masteryPercentEl) masteryPercentEl.textContent = `${mastery}%`;

    const circleFill = document.getElementById('deck-mastery-circle-fill');
    if (circleFill) {
        const circumference = 283; // Approx 2 * pi * 45
        const offset = circumference - (mastery / 100) * circumference;
        circleFill.style.strokeDashoffset = offset;
    }

    const newEl = document.getElementById('deck-new-count');
    if (newEl) {
        newEl.textContent = stats.new || 0;
        if (state.isGuest || stats.new > 0) {
            newEl.parentElement.style.cursor = 'pointer';
            newEl.parentElement.onclick = () => {
                if (state.isGuest) {
                    showGuestPreview('deck', deck);
                    return;
                }
                state.studySessionConfig = { type: 'new' };
                startStudySession();
            };
        } else {
            newEl.parentElement.style.cursor = 'default';
            newEl.parentElement.onclick = null;
        }
    }

    const diffEl = document.getElementById('deck-difficult-count');
    if (diffEl) {
        diffEl.textContent = stats.learn || 0;
        if (state.isGuest || stats.learn > 0) {
            diffEl.parentElement.style.cursor = 'pointer';
            diffEl.parentElement.onclick = () => {
                if (state.isGuest) {
                    showGuestPreview('deck', deck);
                    return;
                }
                state.studySessionConfig = { type: 'difficult' };
                startStudySession();
            };
        } else {
            diffEl.parentElement.style.cursor = 'default';
            diffEl.parentElement.onclick = null;
        }
    }

    const easyEl = document.getElementById('deck-easy-count');
    if (easyEl) {
        easyEl.textContent = stats.review || 0;
        if (state.isGuest || stats.review > 0) {
            easyEl.parentElement.style.cursor = 'pointer';
            easyEl.parentElement.onclick = () => {
                if (state.isGuest) {
                    showGuestPreview('deck', deck);
                    return;
                }
                state.studySessionConfig = { type: 'easy' };
                startStudySession();
            };
        } else {
            easyEl.parentElement.style.cursor = 'default';
            easyEl.parentElement.onclick = null;
        }
    }

    // UI Robustness: Toggle visibility of editor-only features

    // Header Actions Visibility
    const utilityActions = document.querySelector('.deck-utility-actions');
    if (utilityActions) {
        utilityActions.style.display = 'flex'; // Always flex if public or owner

        const shareBtn = document.getElementById('toggle-public-btn');
        const settingsBtn = document.getElementById('deck-settings-btn');
        const deleteBtn = document.getElementById('delete-deck-btn');

        // Share: Only Owner can manage sharing
        if (shareBtn) {
            shareBtn.style.display = isOwner ? 'flex' : 'none';
            shareBtn.onclick = () => openShareModal(deck);
        }

        // Settings (Rename): Owner OR Editor
        if (settingsBtn) {
            settingsBtn.style.display = canEdit ? 'flex' : 'none';
            settingsBtn.onclick = () => renameDeck(deck);
        }

        // Delete: Only Owner
        if (deleteBtn) deleteBtn.style.display = isOwner ? 'flex' : 'none';

        // Import for non-owners (Viewers or Editors who don't own it)
        const importUtilityBtn = document.getElementById('import-to-my-decks-btn');
        if (importUtilityBtn) {
            importUtilityBtn.classList.toggle('hidden', isOwner);
            importUtilityBtn.style.display = isOwner ? 'none' : 'flex';
            importUtilityBtn.onclick = () => importDeck(deck.id);
        }
    }

    // 2. "Add Card" button handling - Owner or Editor
    const addCardBtn = document.getElementById('add-card-btn');
    if (addCardBtn) addCardBtn.style.display = canEdit ? 'inline-flex' : 'none';

    // 3. Import Section (CSV) - Owner or Editor
    const importSection = document.querySelector('.import-section');
    if (importSection) importSection.style.display = canEdit ? 'flex' : 'none';

    updateSaveDeckButton(deck);
    loadCards(deck.id);

    // Initial Search for Related Notes
    loadRelatedNotesSuggestion(deck);

}

// Global variable to store current suggested keywords
let currentSuggestedKeywords = '';

async function loadRelatedNotesSuggestion(deck) {
    const suggestionEl = document.getElementById('deck-notes-suggestion');
    if (!suggestionEl) return;

    suggestionEl.classList.add('hidden'); // Hide initially

    // 1. Extract keywords from title
    // Remove common stop words and short words
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'];
    // Handle specific deck titles like "GCE 'O' Level Chemistry" -> remove 'GCE', 'O', 'Level' if we want just subject?
    // User wants "individual keywords in the title".
    const keywords = deck.title.toLowerCase().split(/[\s\-_]+/)
        .map(w => w.replace(/[^a-z0-9]/g, '')) // cleanup punctuation
        .filter(w => w.length > 2 && !stopWords.includes(w));

    // Also consider subject
    let subjectName = '';
    // Handle joined subject object or string
    if (deck.subjects && deck.subjects.name) {
        subjectName = deck.subjects.name;
    } else if (deck.subject) {
        subjectName = deck.subject;
    }

    if (keywords.length === 0 && !subjectName) return;

    // 2. Build query
    // We want to count how many notes match ANY keyword OR the subject
    let query = sb.from('notes').select('id', { count: 'exact', head: true });

    const conditions = [];
    if (keywords.length > 0) {
        // Construct ILIKE conditions for each keyword on title AND subject
        keywords.forEach(k => {
            conditions.push(`title.ilike.%${k}%`);
            conditions.push(`subject.ilike.%${k}%`);
            conditions.push(`category.ilike.%${k}%`);
        });
    }

    if (subjectName && keywords.length === 0) {
        conditions.push(`subject.ilike.%${subjectName}%`);
    }

    if (conditions.length === 0) return; // No search terms

    // Combined OR condition
    query = query.or(conditions.join(','));

    let { count, error } = await query;
    let searchTerms = keywords.join(' ');

    if (error || count === 0) {
        // Fallback: If 0 results, try broader search just on subject if available
        if (subjectName && keywords.length > 0) {
            const { count: fallbackCount } = await sb.from('notes')
                .select('id', { count: 'exact', head: true })
                .ilike('subject', `%${subjectName}%`);

            if (fallbackCount > 0) {
                count = fallbackCount;
                searchTerms = subjectName;
            } else {
                return;
            }
        } else {
            return;
        }
    }

    setupSuggestionUI(count, searchTerms);
}

function setupSuggestionUI(count, searchTerms) {
    const suggestionEl = document.getElementById('deck-notes-suggestion');
    const textEl = document.getElementById('notes-suggestion-text');
    if (!suggestionEl || !textEl) return;

    textEl.innerHTML = `Found <span class="text-primary">${count}</span> notes related to this subject`;
    currentSuggestedKeywords = searchTerms;
    suggestionEl.classList.remove('hidden');
}

function openSuggestedNotes() {
    state.lastView = 'deck-view'; // Ensure we can go back

    // Switch to notes view
    switchView('notes-view');
    updateNav('nav-notes');

    // Pre-fill search
    const searchInput = document.getElementById('notes-search-input');
    if (searchInput) {
        searchInput.value = currentSuggestedKeywords;

        // Trigger search logic
        // We might need to call initNotes() or dispatch an event
        // The existing logic relies on filter change handlers.
        // Let's manually trigger it.

        // Assuming initNotes() handles the search input value filtering
        // Reset filters first
        const categoryEl = document.getElementById('filter-category');
        if (categoryEl) categoryEl.value = 'all';
        const subjectEl = document.getElementById('filter-subject');
        if (subjectEl) subjectEl.value = 'all';
        const typeEl = document.getElementById('filter-type');
        if (typeEl) typeEl.value = 'all';

        // Reset state.notes to force reload if needed or just re-filter
        state.notes = [];
        state.notesPage = 0;
        state.hasMoreNotes = true;

        initNotes();
    }
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
    if (!state.user) return false;
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

    if (!state.user) {
        if (saveBtn) saveBtn.remove();
        return;
    }

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
    if (!state.user) {
        if (state.currentDeck) {
            showGuestPreview('deck', state.currentDeck);
        } else {
            closeAllModals();
            authMode = 'login';
            updateAuthUI();
            authModal.classList.remove('hidden');
            document.body.classList.add('modal-open');
        }
        return;
    }

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

    const now = new Date();
    if (config.type === 'due') {
        // Match updated stats logic: Only cards with reviews that are due or in learning
        queue = allCards.filter(c => c.reviews_count > 0 && (c.interval_days === 0 || (c.due_at && new Date(c.due_at) <= now)));
    } else if (config.type === 'difficult') {
        // Learning cards (Red)
        queue = allCards.filter(c => c.reviews_count > 0 && c.interval_days < 1 && (c.due_at && new Date(c.due_at) <= now));
    } else if (config.type === 'easy') {
        // Review cards (Green)
        queue = allCards.filter(c => c.reviews_count > 0 && c.interval_days >= 1 && (c.due_at && new Date(c.due_at) <= now));
    } else if (config.type === 'new') {
        queue = allCards.filter(c => !c.reviews_count || c.reviews_count === 0);
    } else if (config.type === 'custom') {
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




// Study Interactions Delegate
document.body.addEventListener('click', (e) => {
    // 1. Rating Buttons
    const rateBtn = e.target.closest('.btn-rate');
    if (rateBtn) {
        const rating = parseInt(rateBtn.dataset.rating);
        if (rating) rateCard(rating);
        return;
    }

    // 2. Flashcard Flip (Target the whole card)
    if (e.target.closest('#active-flashcard')) {
        flipCard();
        return;
    }

    // 3. Continue Button (No Track mode)
    if (e.target.id === 'study-continue-btn') {
        state.currentCardIndex++;
        showNextCard();
    }
});

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
    if (state.isTransitioning) return; // Prevent flipping while card is loading
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




// --- SRS Logic & Stats ---

function determineCardType(card) {
    if (!card.reviews_count || card.reviews_count === 0) return 'new';
    if (card.interval_days < 1) return 'learn';
    return 'review';
}

function updateStudyStats() {
    // Count remaining cards in queue based on their type
    // Note: studyQueue shrinks as we go? NO, current implementation uses currentCardIndex.
    // So we count from currentCardIndex to end.

    let newCount = 0;
    let learnCount = 0;
    let reviewCount = 0;

    for (let i = state.currentCardIndex; i < state.studyQueue.length; i++) {
        const card = state.studyQueue[i];
        const type = determineCardType(card);
        if (type === 'new') newCount++;
        else if (type === 'learn') learnCount++;
        else reviewCount++;
    }

    const newEl = document.getElementById('study-count-new');
    const learnEl = document.getElementById('study-count-learn');
    const reviewEl = document.getElementById('study-count-review');

    if (newEl) { newEl.textContent = newCount; newEl.classList.toggle('hidden', newCount === 0); }
    if (learnEl) { learnEl.textContent = learnCount; learnEl.classList.toggle('hidden', learnCount === 0); }
    if (reviewEl) { reviewEl.textContent = reviewCount; reviewEl.classList.toggle('hidden', reviewCount === 0); }
}

function calculateNextReview(card, rating) {
    let interval = Number(card.interval_days) || 0;
    let ease = Number(card.ease_factor) || 2.5;

    // Anki-like Logic
    if (rating === 1) { // Again
        interval = 0.01; // < 1 min (Reset)
        ease = Math.max(1.3, ease - 0.2);
    } else if (rating === 2) { // Hard
        interval = (interval === 0) ? 0.5 : Math.max(0.02, interval * 1.2);
        ease = Math.max(1.3, ease - 0.15);
    } else if (rating === 3) { // Good
        if (interval === 0) interval = 1; // Graduate to 1 day
        else if (interval < 1) interval = 1; // Graduate from learning step
        else interval = interval * ease;
    } else if (rating === 4) { // Easy
        if (interval === 0) interval = 4;
        else if (interval < 1) interval = 4;
        else interval = interval * ease * 1.3;
        ease += 0.15;
    }

    return { interval, ease };
}

function formatInterval(interval) {
    if (interval < 0.001) return '< 1m';
    if (interval < 1 / 24) return Math.round(interval * 24 * 60) + 'm';
    if (interval < 1) return Math.round(interval * 24) + 'h';
    if (interval >= 365) return Math.round(interval / 365) + 'y';
    if (interval >= 30) return Math.round(interval / 30) + 'mo';
    return Math.round(interval) + 'd';
}

async function showNextCard(animate = true) {
    if (state.currentCardIndex >= state.studyQueue.length) {
        finishStudySession();
        return;
    }

    // Safety: prevent multiple clicks/flips during transition
    state.isTransitioning = true;

    // Reset flip status for new card
    state.isFlipped = false;
    const flashcard = document.getElementById('active-flashcard');
    if (flashcard) {
        flashcard.classList.remove('is-flipped');
        flashcard.style.transform = ''; // Clear manual overrides
    }

    // Update Stats
    updateStudyStats();

    const card = state.studyQueue[state.currentCardIndex];

    // Predict Intervals for Buttons
    const btnAgain = document.querySelector('.rate-again .rate-time');
    const btnHard = document.querySelector('.rate-hard .rate-time');
    const btnGood = document.querySelector('.rate-good .rate-time');
    const btnEasy = document.querySelector('.rate-easy .rate-time');

    if (btnAgain) btnAgain.textContent = formatInterval(calculateNextReview(card, 1).interval);
    if (btnHard) btnHard.textContent = formatInterval(calculateNextReview(card, 2).interval);
    if (btnGood) btnGood.textContent = formatInterval(calculateNextReview(card, 3).interval);
    if (btnEasy) btnEasy.textContent = formatInterval(calculateNextReview(card, 4).interval);

    // Close controls
    toggleStudyControls(false);

    const progressFill = document.getElementById('study-progress-bar');
    if (progressFill) {
        const pct = ((state.currentCardIndex) / state.studyQueue.length) * 100;
        progressFill.style.width = `${pct}%`;
    }

    // Content Injection
    const frontEl = document.getElementById('study-front');
    const backEl = document.getElementById('study-back');

    if (animate) {
        flashcard.style.opacity = '0';
        setTimeout(() => {
            frontEl.innerHTML = renderContent(card.front);
            backEl.innerHTML = renderContent(card.back);
            renderMath(frontEl);
            renderMath(backEl);

            flashcard.style.opacity = '1';
            flashcard.style.transform = '';
            state.isTransitioning = false;
        }, 200);
    } else {
        frontEl.innerHTML = renderContent(card.front);
        backEl.innerHTML = renderContent(card.back);
        renderMath(frontEl);
        renderMath(backEl);
        flashcard.style.transform = '';
        state.isTransitioning = false;
    }
}

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

    // SRS Calc (Advanced)
    const { interval, ease } = calculateNextReview(card, rating);
    const interval_days = interval;
    const ease_factor = ease;
    const reviews_count = Number(card.reviews_count || 0) + 1;

    const due_at = new Date();
    due_at.setMinutes(due_at.getMinutes() + (interval_days * 24 * 60));

    // Update DB if owner (non-blocking)
    if (isOwner) {
        sb.from('cards').update({
            interval_days, ease_factor, reviews_count,
            last_reviewed: new Date(),
            due_at: due_at
        }).eq('id', card.id).then(({ error }) => { if (error) console.error("SRS Update Error:", error); });
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

async function exitStudyMode() {
    const target = state.studyOrigin || 'decks-view';
    const deckId = state.currentDeck ? state.currentDeck.id : null;

    if (target === 'deck-view' && state.currentDeck) {
        // 1. Immediate Navigation with current state (stale but fast)
        openDeck(state.currentDeck);

        // 2. Background Refresh of Global Decks
        loadDecksView(true).then(() => {
            // Update global state silently
            if (deckId) {
                const updated = state.decks.find(d => d.id === deckId);
                if (updated) state.currentDeck = updated;
            }
        });

        // 3. Fast Targeted Refresh of Current Deck Stats
        if (deckId) {
            refreshDeckStatsOnly(deckId); // Helper to update just the numbers
        }

    } else if (target === 'today-view') {
        switchView('today-view');
        loadTodayView();
        loadDecksView(true); // Background refresh
    } else {
        switchView('decks-view');
        loadDecksView(true);
    }
}

// New helper to update just the stats on the screen without full re-render
async function refreshDeckStatsOnly(deckId) {
    // Re-calculate stats for this specific deck similar to loadDecksView
    const now = new Date();

    // Fetch just cards for this deck to get fresh due/new counts
    const { data: cards } = await sb.from('cards')
        .select('id, interval_days, due_at, reviews_count')
        .eq('deck_id', deckId);

    if (!cards) return;

    // Fetch study logs for mastery
    // Optimization: potentially we could just fetch logs for this deck? 
    // But logs are by user. Let's just fetch logs for this user filtering by cards in this deck if possible, 
    // or just limit 1000 latest.
    // For speed, let's just calc from what we have or do a quick query.
    // Actually, `loadDecksView` does a heavy query.
    // Let's do a lighter query here.

    const { data: logs } = await sb.from('study_logs')
        .select('card_id, rating')
        .eq('user_id', state.user.id)
        .order('review_time', { ascending: false })
        .limit(2000); // Reasonable limit

    const cardMastery = new Set();
    if (logs) {
        const seen = new Set();
        logs.forEach(log => {
            if (!seen.has(log.card_id)) {
                seen.add(log.card_id);
                if (log.rating >= 3) cardMastery.add(log.card_id);
            }
        });
    }

    let stats = { total: cards.length, due: 0, new: 0, mature: 0, learn: 0, review: 0 };
    cards.forEach(card => {
        const interval = Number(card.interval_days || 0);
        const due = card.due_at ? new Date(card.due_at) : null;
        const reviews = Number(card.reviews_count || 0);

        const isDue = (interval === 0) || (due && due <= now);

        if (isDue) {
            if (reviews === 0) {
                stats.new++;
            } else {
                stats.due++;
                if (interval < 1) stats.learn++;
                else stats.review++;
            }
        }
        if (cardMastery.has(card.id)) stats.mature++;
    });

    // Directly update DOM elements if we are still on the deck view
    if (state.currentDeck && state.currentDeck.id === deckId && !document.getElementById('deck-view').classList.contains('hidden')) {
        const diffEl = document.getElementById('deck-difficult-count');
        const easyEl = document.getElementById('deck-easy-count');
        const newEl = document.getElementById('deck-new-count');
        const masteryEl = document.getElementById('deck-mastery-percent');
        const circleFill = document.getElementById('deck-mastery-circle-fill');
        const metaEl = document.querySelector('.deck-meta');

        if (metaEl && state.currentDeck) {
            metaEl.textContent = `${stats.total} cards • ${state.currentDeck.is_public ? 'Public' : 'Private'}`;
        }

        if (newEl) {
            newEl.textContent = stats.new;
            if (state.isGuest || stats.new > 0) {
                newEl.parentElement.style.cursor = 'pointer';
                newEl.parentElement.onclick = () => {
                    if (state.isGuest) {
                        showGuestPreview('deck', state.currentDeck);
                        return;
                    }
                    state.studySessionConfig = { type: 'new' };
                    startStudySession();
                };
            } else {
                newEl.parentElement.style.cursor = 'default';
                newEl.parentElement.onclick = null;
            }
        }
        if (diffEl) {
            diffEl.textContent = stats.learn;
            if (state.isGuest || stats.learn > 0) {
                diffEl.parentElement.style.cursor = 'pointer';
                diffEl.parentElement.onclick = () => {
                    if (state.isGuest) {
                        showGuestPreview('deck', state.currentDeck);
                        return;
                    }
                    state.studySessionConfig = { type: 'difficult' };
                    startStudySession();
                };
            } else {
                diffEl.parentElement.style.cursor = 'default';
                diffEl.parentElement.onclick = null;
            }
        }
        if (easyEl) {
            easyEl.textContent = stats.review;
            if (state.isGuest || stats.review > 0) {
                easyEl.parentElement.style.cursor = 'pointer';
                easyEl.parentElement.onclick = () => {
                    if (state.isGuest) {
                        showGuestPreview('deck', state.currentDeck);
                        return;
                    }
                    state.studySessionConfig = { type: 'easy' };
                    startStudySession();
                };
            } else {
                easyEl.parentElement.style.cursor = 'default';
                easyEl.parentElement.onclick = null;
            }
        }

        const mastery = stats.total > 0 ? Math.round(((stats.mature || 0) / stats.total) * 100) : 0;
        if (masteryEl) masteryEl.textContent = `${mastery}%`;
        if (circleFill) {
            const circumference = 283;
            const offset = circumference - (mastery / 100) * circumference;
            circleFill.style.strokeDashoffset = offset;
        }

        // Also update the in-memory deck object stats so if we navigate away and back it's correct
        if (state.currentDeck) {
            state.currentDeck.stats = stats;
        }
        // And update it in the main decks array if found
        const deckInList = state.decks.find(d => d.id === deckId);
        if (deckInList) {
            deckInList.stats = stats;
        }
    }
    return stats;
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
    const grid = document.getElementById('groups-grid');
    if (grid) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; width: 100%; display: flex; justify-content: center;">${getComponentLoader('Loading your groups...')}</div>`;
    }

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
    updateNav('nav-groups');

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

    // Update URL with group ID (must be after switchView)
    const url = new URL(window.location);
    url.searchParams.set('group', group.id);
    window.history.pushState({ groupId: group.id }, '', url);

    loadGroupDetails(group.id);
}

async function deleteGroup(groupId) {
    if (confirm('Are you sure you want to delete this group? All decks will be deleted.')) {
        const { error } = await sb.from('groups').delete().eq('id', groupId);
        if (error) {
            console.error("Delete Group Error:", error);
            showToast(`Failed to delete: ${error.message}`, 'error');
        } else {
            showToast('Group deleted');
            state.groups = state.groups.filter(g => g.id !== groupId);
            switchView('groups-view');
            renderGroups();
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

    // 2. Fetch Members
    const { data: memberProfiles, error: mErr } = await sb.from('group_members')
        .select(`
            role, 
            user_id, 
            profiles:user_id (username, created_at)
        `)
        .eq('group_id', groupId);

    if (mErr) console.error("Error fetching members:", mErr);
    state.groupMembers = memberProfiles || [];

    // 3. Fetch Group Stats & Activity
    const deckIds = state.groupDecks.map(d => d.id);
    state.groupMemberStats = {};
    state.groupActivity = [];

    if (deckIds.length > 0) {
        const { data: logs } = await sb.from('study_logs')
            .select(`
                user_id, 
                rating, 
                review_time,
                card_id,
                deck_id,
                decks:deck_id (title)
            `)
            .in('deck_id', deckIds)
            .order('review_time', { ascending: false });

        if (logs) {
            state.groupActivity = logs.slice(0, 30); // Last 30 events
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
    renderGroupLeaderboard();
    renderGroupActivity();
}

function renderGroupLeaderboard() {
    const list = document.getElementById('group-leaderboard-list');
    if (!list) return;
    list.innerHTML = '';

    const membersWithStats = state.groupMembers.map(m => {
        const stats = state.groupMemberStats[m.user_id] || { reviews: 0, score: 0 };
        const mastery = stats.reviews > 0 ? Math.round((stats.score / (stats.reviews * 4)) * 100) : 0;
        return { ...m, stats, mastery };
    }).sort((a, b) => b.stats.reviews - a.stats.reviews);

    if (membersWithStats.length === 0) {
        list.innerHTML = '<div class="text-dim p-8 text-center">No activity data yet.</div>';
        return;
    }

    membersWithStats.forEach((m, idx) => {
        const name = (m.profiles?.username || 'Unknown').split(' ')[0];
        const rank = idx + 1;
        const row = document.createElement('div');
        row.className = `leaderboard-row rank-${rank <= 3 ? rank : 'other'}`;
        row.innerHTML = `
            <div class="rank-col"><div class="rank-badge">${rank}</div></div>
            <div class="member-col" style="display: flex; align-items: center; gap: 0.75rem;">
                <div class="user-avatar-sm">${name.charAt(0).toUpperCase()}</div>
                <span style="font-weight: 500;">${escapeHtml(name)} ${m.user_id === state.user.id ? '<span class="text-xs opacity-50">(You)</span>' : ''}</span>
            </div>
            <div class="stat-col" style="text-align: center;">
                <span style="font-weight: 700;">${m.stats.reviews}</span>
            </div>
            <div class="stat-col" style="text-align: right;">
                <span class="text-primary" style="font-weight: 700;">${m.mastery}%</span>
            </div>
        `;
        list.appendChild(row);
    });
}

function renderGroupActivity() {
    const feed = document.getElementById('group-activity-feed');
    if (!feed) return;
    feed.innerHTML = '';

    if (state.groupActivity.length === 0) {
        feed.innerHTML = '<div class="text-dim p-4 text-center">No recent activity detected.</div>';
        return;
    }

    state.groupActivity.forEach(act => {
        const member = state.groupMembers.find(m => m.user_id === act.user_id);
        const name = member?.profiles?.username || 'Someone';
        const time = new Date(act.review_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const date = new Date(act.review_time).toLocaleDateString([], { month: 'short', day: 'numeric' });

        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="icon-xs" style="color: var(--primary);"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
            </div>
            <div class="activity-content">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px;">
                    <span class="text-sm"><strong>${escapeHtml(name)}</strong> studied <strong>${escapeHtml(act.decks?.title || 'a deck')}</strong></span>
                    <span class="text-xs text-secondary">${date} • ${time}</span>
                </div>
                <div class="text-xs text-secondary">Earned a rating of ${act.rating}/4</div>
            </div>
        `;
        feed.appendChild(item);
    });
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
    if (state.isGuest) {
        if (state.currentDeck) {
            showGuestPreview('deck', state.currentDeck);
        } else {
            closeAllModals();
            authMode = 'login';
            updateAuthUI();
            authModal.classList.remove('hidden');
            document.body.classList.add('modal-open');
        }
        return;
    }
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
    grid.innerHTML = `<div style="grid-column: 1 / -1; width: 100%; display: flex; justify-content: center;">${getComponentLoader('Exploring the community...')}</div>`;

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

function getSkeletonLoadingCards(count = 3) {
    let skeletons = '';
    for (let i = 0; i < count; i++) {
        skeletons += `
            <div class="skeleton-card">
                <div class="skeleton-shimmer"></div>
                <div class="skeleton-text title"></div>
                <div class="skeleton-text desc"></div>
                <div class="skeleton-text stats"></div>
            </div>
        `;
    }
    return skeletons;
}

function getComponentLoader(message = 'Loading...') {
    return `
        <div class="component-loader">
            <div class="loader-container-sm">
                <img src="./Assets/logo.png" alt="Loading" class="loader-logo-sm" style="border-radius: 50%;">
                <div class="loader-ring-sm"></div>
            </div>
            <p class="loader-text-sm">${message}</p>
        </div>
    `;
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
    const modal = document.getElementById(id);
    if (!modal) return;

    // Check if it's a custom overlay wrapper
    const isCustom = modal.classList.contains('custom-overlay') || modal.id === 'auth-modal';

    if (id !== 'redirect-modal') {
        document.body.classList.add('modal-open');
        if (!isCustom) {
            modalOverlay.classList.remove('hidden');
        }
    }

    modal.classList.remove('hidden');

    // If wrapper, also unhide inner content
    if (modal.classList.contains('custom-overlay')) {
        // Ensure flex display for centering if needed, though CSS handles it
        // modal.style.display = 'flex'; 
        const inner = modal.querySelector('.modal');
        if (inner) inner.classList.remove('hidden');
    }
}

function closeModal() {
    modalOverlay.classList.add('hidden');
    document.querySelectorAll('.modal, .redirect-modal').forEach(m => m.classList.add('hidden'));
    document.querySelectorAll('.custom-overlay').forEach(m => m.classList.add('hidden'));
    document.body.classList.remove('modal-open');
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
}
document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModal));
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
document.querySelectorAll('.custom-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
});

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


// --- Pattern-based Import Logic ---

function initImportManager() {
    const bulkInput = document.getElementById('bulk-add-input');
    const patternInput = document.getElementById('import-structure-pattern');
    const bulkCountDisp = document.getElementById('bulk-add-card-count');
    const previewDisp = document.getElementById('import-preview-content');
    const autoDetectBtn = document.getElementById('import-auto-detect-btn');
    const fileInput = document.getElementById('csv-upload');

    if (!bulkInput) return;

    if (patternInput && !patternInput.value) patternInput.value = '[front] | [back]';

    const getParserInfo = () => {
        const pattern = patternInput.value || '[front] | [back]';
        const frontIdx = pattern.indexOf('[front]');
        const backIdx = pattern.indexOf('[back]');
        if (frontIdx === -1 || backIdx === -1) return null;

        let separator = '';
        let isSwapped = false;

        if (frontIdx < backIdx) {
            separator = pattern.substring(frontIdx + 7, backIdx);
        } else {
            separator = pattern.substring(backIdx + 6, frontIdx);
            isSwapped = true;
        }

        return { separator: separator || '|', isSwapped };
    };

    window.updateImportPreview = () => {
        const val = bulkInput.value.trim();
        const lines = val.split('\n').filter(l => l.trim() !== '');
        const info = getParserInfo();

        if (!info) {
            if (previewDisp) previewDisp.innerHTML = `<span class="text-danger" style="font-size: 0.8rem;">Pattern must include both [front] and [back]</span>`;
            if (bulkCountDisp) bulkCountDisp.textContent = '0';
            return;
        }

        const { separator, isSwapped } = info;
        const validCards = lines.map(line => {
            const parts = line.split(separator);
            if (parts.length < 2) return null;
            let front = isSwapped ? parts.slice(1).join(separator).trim() : parts[0].trim();
            let back = isSwapped ? parts[0].trim() : parts.slice(1).join(separator).trim();
            return { front, back };
        }).filter(c => c !== null);

        if (bulkCountDisp) bulkCountDisp.textContent = validCards.length;

        if (previewDisp) {
            if (validCards.length > 0) {
                const card = validCards[0];
                previewDisp.innerHTML = `
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <span style="background: var(--surface-hover); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); font-size: 0.75rem;"><strong style="color: var(--primary);">[FRONT]</strong> ${escapeHtml(card.front)}</span>
                        <span style="color: var(--text-dim);">${escapeHtml(separator)}</span>
                        <span style="background: var(--surface-hover); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border); font-size: 0.75rem;"><strong style="color: var(--primary);">[BACK]</strong> ${escapeHtml(card.back)}</span>
                    </div>
                `;
            } else {
                previewDisp.innerHTML = `<span class="text-dim italic" style="font-size: 0.8rem;">No cards matched pattern. Try "Auto-Detect".</span>`;
            }
        }
    };

    const autoDetectSeparator = () => {
        const text = bulkInput.value.trim();
        if (!text) return;
        const commonSeparators = ['|', ',', '\t', ';', ':', '-', '::'];
        const lines = text.split('\n').filter(l => l.trim() !== '').slice(0, 10);
        let bestSep = '|', maxConsistency = -1;

        commonSeparators.forEach(sep => {
            let counts = lines.map(line => line.split(sep).length - 1);
            let validLines = counts.filter(c => c > 0).length;
            if (validLines > 0) {
                let avg = counts.reduce((a, b) => a + b, 0) / validLines;
                let variance = counts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / validLines;
                let score = validLines / (1 + variance);
                if (score > maxConsistency) { maxConsistency = score; bestSep = sep; }
            }
        });

        patternInput.value = `[front] ${bestSep} [back]`;
        updateImportPreview();
    };

    bulkInput.oninput = updateImportPreview;
    patternInput.oninput = updateImportPreview;
    autoDetectBtn.onclick = autoDetectSeparator;

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            bulkInput.value = event.target.result;
            autoDetectSeparator();
            showToast(`Loaded ${file.name}`, 'success');
        };
        reader.readAsText(file);
    };

    document.getElementById('bulk-add-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!state.currentDeck) return showToast('Please open a deck first.', 'error');

        const input = bulkInput.value.trim();
        if (!input) return showToast('Please enter some cards.', 'error');

        const info = getParserInfo();
        if (!info) return showToast('Invalid pattern.', 'error');

        const { separator, isSwapped } = info;
        const lines = input.split('\n').filter(line => line.trim() !== '');
        const newCards = [];

        for (const line of lines) {
            const parts = line.split(separator);
            if (parts.length >= 2) {
                let front = isSwapped ? parts.slice(1).join(separator).trim() : parts[0].trim();
                let back = isSwapped ? parts[0].trim() : parts.slice(1).join(separator).trim();

                newCards.push({
                    deck_id: state.currentDeck.id,
                    front,
                    back,
                    user_id: state.user.id
                });
            }
        }

        if (newCards.length === 0) return showToast('No valid cards found with current settings.', 'error');

        const submitBtn = document.getElementById('bulk-add-submit');
        const originalBtnText = submitBtn.textContent;

        try {
            submitBtn.disabled = true;
            submitBtn.textContent = `Importing ${newCards.length} cards...`;
            const { error } = await sb.from('cards').insert(newCards);
            if (error) throw error;

            showToast(`Successfully imported ${newCards.length} cards!`, 'success');
            bulkInput.value = '';
            closeModal();
            loadCards(state.currentDeck.id);
        } catch (error) {
            console.error('Import Error:', error);
            showToast('Failed: ' + error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });

}

initImportManager();


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

            // Pre-fill separator - REMOVED: Replaced by pattern-based logic
            // const separator = state.settings.defaultSeparator || '|';
            // const radios = document.getElementsByName('separator');
            // let found = false;
            // radios.forEach(r => {
            //     if (r.value === separator) {
            //         r.checked = true;
            //         found = true;
            //     }
            // });
            // if (!found) {
            //     const customRadio = document.querySelector('input[name="separator"][value="custom"]');
            //     if (customRadio) {
            //         customRadio.checked = true;
            //         document.getElementById('custom-separator').value = separator;
            //     }
            // }

            openModal('bulk-add-modal');
            if (typeof window.updateImportPreview === 'function') window.updateImportPreview();
        });
    }

    const importCsvBtn = document.getElementById('menu-import-csv');
    if (importCsvBtn) {
        importCsvBtn.addEventListener('click', () => {
            if (dropdownMenu) dropdownMenu.classList.add('hidden');
            openModal('bulk-add-modal');
            if (typeof window.updateImportPreview === 'function') window.updateImportPreview();
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

    const grid = document.getElementById('notes-grid');
    if (!loadMore && grid) {
        grid.innerHTML = getComponentLoader('Gathering the best notes...');
    }

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
        // Use text search on title or subject with tokenized OR logic
        // This matches the "Related Notes" suggestion logic
        const terms = search.split(/\s+/).filter(t => t.length > 0);
        if (terms.length > 0) {
            const conditions = [];
            terms.forEach(t => {
                conditions.push(`title.ilike.%${t}%`);
                conditions.push(`subject.ilike.%${t}%`);
                conditions.push(`category.ilike.%${t}%`);
            });
            query = query.or(conditions.join(','));
        }
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

    // Update result count display
    const countInfo = document.getElementById('notes-results-info');
    const countText = document.getElementById('notes-count-text');
    if (countInfo && countText) {
        if (!error && count !== undefined) {
            countInfo.classList.remove('hidden');
            countText.textContent = `Showing ${count} ${count === 1 ? 'note' : 'notes'}`;
            // Update filter tags
            updateFilterTags(search, category, subject, type);
        } else {
            countInfo.classList.add('hidden');
        }
    }

    // Toggle clear button
    const clearBtn = document.getElementById('notes-clear-btn');
    if (clearBtn) {
        if (search) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
    }

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

        // Determine if there are more results
        state.hasMoreNotes = (state.notes.length < count);
    }

    state.notesLoaded = true;
    renderNotes(state.notes);
}

function updateFilterTags(search, category, subject, type) {
    const container = document.getElementById('active-filters-tags');
    if (!container) return;
    container.innerHTML = '';

    const addTag = (label, id) => {
        const tag = document.createElement('span');
        tag.className = 'filter-tag';
        tag.innerHTML = `
            ${label}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="icon-xs" style="cursor: pointer; opacity: 0.7;" onclick="clearFilter('${id}')">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
        `;
        container.appendChild(tag);
    };

    if (category !== 'all') addTag(category, 'filter-category');
    if (subject !== 'all') addTag(subject, 'filter-subject');
    if (type !== 'all') addTag(type, 'filter-type');
}

window.clearFilter = (id) => {
    const el = document.getElementById(id);
    if (el) {
        el.value = 'all';
        initNotes(false);
    }
};

window.resetNotesFilters = () => {
    document.getElementById('notes-search-input').value = '';
    document.getElementById('filter-category').value = 'all';
    document.getElementById('filter-subject').value = 'all';
    document.getElementById('filter-type').value = 'all';
    initNotes(false);
};

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
        const grid = document.getElementById('notes-grid');
        // Only render if the grid is empty, to prevent flickering/reloading when switching tabs
        if (grid && !grid.innerHTML.trim()) {
            renderNotes(state.notes);
        }
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

    const CATEGORY_DISPLAY = {
        "GCE 'O' Levels": "GCE 'O' Level",
        "GCE 'A' Levels": "GCE 'A' Level",
        "IB": 'IB Diploma',
        "GCE 'N' Levels": "GCE 'N' Level",
        "IP": 'IP Program',
        "Sec 1-2 (Non-IP)": 'Lower Secondary'
    };

    notes.forEach(note => {
        // Clean class name: "GCE 'A' Levels" -> "a-levels"
        const cleanCat = note.category ? note.category.replace(/GCE\s+/i, '').replace(/'/g, '').toLowerCase().replace(/\s+/g, '-') : 'general';
        const catClass = cleanCat.includes('a-level') ? 'a-level' : (cleanCat.includes('ib') ? 'ib' : cleanCat);

        const displayCat = CATEGORY_DISPLAY[note.category] || note.category || 'General';
        const displaySub = note.subject === 'General' ? '' : note.subject;
        const m = document.getElementById('ai-modal');
        if (m && !m.classList.contains('hidden')) {
            // Initialize PDF drag and drop
            initAIPdfUpload();
        }

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
                    <span class="note-type-badge ${catClass}">${displayCat}</span>
                </div>
                <h3 class="note-title" title="${note.title}">${note.title}</h3>
                <p class="text-sm text-secondary mb-2">${displaySub || displayCat}</p>
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
                <p class="text-dim text-sm italic" style="margin-top: 1rem;">That's everything for now!</p>
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

// Note Detail Logic
function openNote(note) {
    updateNav('nav-notes');
    state.currentNote = note;

    // Set UI elements
    document.getElementById('note-detail-title').textContent = note.title;

    const tagsContainer = document.getElementById('note-detail-tags');
    if (tagsContainer) {
        tagsContainer.innerHTML = `
            <span class="note-tag-detail">${note.category}</span>
            <span class="note-tag-detail">${note.subject}</span>
            <span class="note-tag-detail">${note.type}</span>
        `;
    }

    // Set snippet
    const snippetContainer = document.getElementById('note-snippet-container');
    const snippetContent = document.getElementById('note-snippet-content');
    const snippetLoader = document.getElementById('note-snippet-loader');

    if (snippetContainer && snippetContent) {
        snippetContent.innerHTML = '';
        if (note.url.endsWith('.pdf')) {
            renderPDFSnippet(note.url);
        } else {
            snippetContent.innerHTML = `<img src="${note.url}" style="width:100%; height:auto;" alt="Snippet">`;
        }
    }

    // Set download link
    const downloadBtn = document.getElementById('note-detail-download-btn');
    if (downloadBtn) downloadBtn.href = note.url;

    // Suggest similar notes
    if (!state.notes || state.notes.length === 0) {
        initNotes().then(() => renderSimilarNotes(note));
    } else {
        renderSimilarNotes(note);
    }

    // Update URL - Ensure we clean other params but keep the note ID
    // Use a robust way to update the URL that works on file://
    const baseUrl = window.location.href.split('?')[0];
    const newUrl = baseUrl + '?note=' + note.id;
    window.history.pushState({ noteId: note.id }, '', newUrl);

    // Clear existing AI summary
    const container = document.getElementById('ai-summary-container');
    if (container) {
        container.innerHTML = '';
        container.classList.add('hidden');
    }

    const summaryBtn = document.getElementById('note-detail-ai-summary-btn');
    if (summaryBtn) {
        summaryBtn.style.display = 'flex'; // Default to visible, checkExistingSummary will hide if needed
        summaryBtn.disabled = false;
        summaryBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
            </svg>
            Summarise
        `;
    }

    checkExistingSummary(note.id);

    switchView('note-detail-view');
    checkAIUsageLimits();
}

async function renderPDFSnippet(url) {
    const content = document.getElementById('note-snippet-content');
    const loader = document.getElementById('note-snippet-loader');

    if (!content) return;

    // Show skeleton loader
    if (loader) {
        loader.classList.remove('hidden');
        loader.innerHTML = `
            <div class="pdf-skeleton-loader" style="
                width: 100%;
                height: 100%;
                background: white;
                padding: 2rem;
                display: flex;
                flex-direction: column;
                gap: 1rem;
            ">
                <div class="skeleton-text" style="width: 70%; height: 24px; background: #e2e8f0; border-radius: 4px; animation: shimmer 1.5s infinite;"></div>
                <div class="skeleton-text" style="width: 50%; height: 16px; background: #e2e8f0; border-radius: 4px; animation: shimmer 1.5s infinite; animation-delay: 0.1s;"></div>
                <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
                    <div class="skeleton-text" style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 4px; animation: shimmer 1.5s infinite; animation-delay: 0.2s;"></div>
                    <div class="skeleton-text" style="width: 95%; height: 12px; background: #e2e8f0; border-radius: 4px; animation: shimmer 1.5s infinite; animation-delay: 0.3s;"></div>
                    <div class="skeleton-text" style="width: 98%; height: 12px; background: #e2e8f0; border-radius: 4px; animation: shimmer 1.5s infinite; animation-delay: 0.4s;"></div>
                    <div class="skeleton-text" style="width: 92%; height: 12px; background: #e2e8f0; border-radius: 4px; animation: shimmer 1.5s infinite; animation-delay: 0.5s;"></div>
                </div>
                <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
                    <div class="skeleton-text" style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 4px; animation: shimmer 1.5s infinite; animation-delay: 0.6s;"></div>
                    <div class="skeleton-text" style="width: 97%; height: 12px; background: #e2e8f0; border-radius: 4px; animation: shimmer 1.5s infinite; animation-delay: 0.7s;"></div>
                    <div class="skeleton-text" style="width: 94%; height: 12px; background: #e2e8f0; border-radius: 4px; animation: shimmer 1.5s infinite; animation-delay: 0.8s;"></div>
                </div>
            </div>
        `;
    }
    content.innerHTML = '';

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

    let previewUrl;
    if (isMobile) {
        previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    } else {
        previewUrl = url.includes('#') ? url : url + '#page=1&view=Fit&toolbar=0&navpanes=0&scrollbar=0';
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'note-snippet-frame';
    iframe.src = previewUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.background = 'white';
    iframe.style.display = 'block';

    iframe.onload = () => {
        if (loader) loader.classList.add('hidden');
    };

    content.appendChild(iframe);
}

function renderSimilarNotes(currentNote) {
    const list = document.getElementById('similar-notes-list');
    if (!list) return;
    list.innerHTML = '';

    // Filter notes by same subject or category, exclude current
    if (!state.notes) state.notes = [];
    const similar = state.notes
        .filter(n => n.id !== currentNote.id && (n.subject === currentNote.subject || n.category === currentNote.category))
        .slice(0, 4);

    similar.forEach(note => {
        const card = document.createElement('div');
        card.className = 'similar-note-card';
        card.innerHTML = `
            <div class="similar-note-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-sm">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
            </div>
            <div class="similar-note-info">
                <div class="similar-note-title" title="${note.title}">${note.title}</div>
                <div class="similar-note-meta">${note.subject} • ${note.category}</div>
            </div>
        `;
        card.onclick = () => openNote(note);
        list.appendChild(card);
    });
}



async function renderPDF(url) {
    const container = document.getElementById('pdf-canvas-container');
    const loader = document.getElementById('pdf-loader');
    const pageIndicator = document.getElementById('pdf-page-indicator');

    if (!container) return;

    // Reset state
    container.innerHTML = '';
    if (loader) loader.classList.remove('hidden');
    if (pageIndicator) pageIndicator.classList.add('hidden');

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

    let viewerUrl;
    if (isMobile) {
        viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    } else {
        viewerUrl = url.includes('#') ? url : url + '#view=FitV&navpanes=0';
    }

    const iframe = document.createElement('iframe');
    iframe.src = viewerUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%'; // Fill scroll container or body
    iframe.style.minHeight = '85vh';
    iframe.style.border = 'none';
    iframe.style.background = 'white';
    iframe.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';

    iframe.onload = () => {
        if (loader) loader.classList.add('hidden');
    };

    container.appendChild(iframe);
}

// Remove unused renderPDFPage function

function openFullNoteViewer() {
    const note = state.currentNote;
    if (!note) return;

    const modal = document.getElementById('pdf-viewer-modal');
    const title = document.getElementById('pdf-viewer-title');
    const downloadLink = document.getElementById('pdf-download-link');

    title.textContent = note.title;
    if (downloadLink) {
        downloadLink.href = note.url;
        downloadLink.classList.remove('hidden');
    }

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');

    if (note.url.endsWith('.pdf')) {
        pdfScale = 1.0; // Reset scale
        renderPDF(note.url);
    } else {
        // Fallback or Image?
        const container = document.getElementById('pdf-canvas-container');
        container.innerHTML = `<div class="p-10 text-white text-center">
            <p class="mb-4">This browser viewer only supports PDFs.</p>
            <a href="${note.url}" target="_blank" class="btn btn-primary">Open in New Tab</a>
        </div>`;
    }
}

// PDF Viewer Events
document.getElementById('close-pdf-btn')?.addEventListener('click', () => {
    document.getElementById('pdf-viewer-modal').classList.add('hidden');
    document.body.classList.remove('modal-open');
    document.getElementById('pdf-canvas-container').innerHTML = '';
});

// Zoom logic is disabled for native iframe viewer

// Back Button & Trigger
const backToNotesBtn = document.getElementById('back-to-notes-btn');
if (backToNotesBtn) backToNotesBtn.onclick = () => switchView('notes-view');

const snippetTrigger = document.getElementById('note-snippet-trigger');
if (snippetTrigger) snippetTrigger.onclick = openFullNoteViewer;

const shareNoteBtn = document.getElementById('note-detail-share-btn');
if (shareNoteBtn) {
    shareNoteBtn.onclick = () => {
        if (state.currentNote) {
            const url = new URL(window.location.href.split('?')[0]);
            url.searchParams.set('note', state.currentNote.id);
            navigator.clipboard.writeText(url.toString()).then(() => {
                showToast('Share link copied to clipboard!', 'success');
            });
        }
    };
}

// Forced download logic
const downloadBtn = document.getElementById('note-detail-download-btn');
if (downloadBtn) {
    downloadBtn.addEventListener('click', async (e) => {
        if (!state.currentNote) return;

        // If it's a PDF, try to force download
        if (state.currentNote.url.toLowerCase().endsWith('.pdf')) {
            e.preventDefault();
            const filename = (state.currentNote.title || 'Note') + '.pdf';

            try {
                const res = await fetch(state.currentNote.url);
                if (res.ok) {
                    const blob = await res.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(blobUrl);
                    return;
                }
            } catch (err) {
                console.warn("CORS/Fetch failed for download, using iframe fallback");
            }

            // Fallback: use a hidden iframe to try and trigger download without navigation
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = state.currentNote.url;
            document.body.appendChild(iframe);
            setTimeout(() => document.body.removeChild(iframe), 2000);
        }
    });
}

const similarMoreBtn = document.getElementById('view-more-similar-btn');
if (similarMoreBtn) {
    similarMoreBtn.onclick = () => {
        const subjectEl = document.getElementById('filter-subject');
        if (subjectEl) {
            subjectEl.value = 'all'; // Reset to all subjects as requested
            initNotes(false);
            switchView('notes-view');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
}

// Ensure snippet click also updates URL per requirements
const detailSnippetTrigger = document.getElementById('note-snippet-trigger');
if (detailSnippetTrigger) {
    detailSnippetTrigger.addEventListener('click', () => {
        if (state.currentNote) {
            const url = new URL(window.location.href.split('?')[0]);
            url.searchParams.set('note', state.currentNote.id);
            window.history.replaceState({ noteId: state.currentNote.id }, '', url.toString());
        }
        openFullNoteViewer();
    });
}

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

// Clear Button
const notesClearBtn = document.getElementById('notes-clear-btn');
if (notesClearBtn) {
    notesClearBtn.addEventListener('click', () => {
        const input = document.getElementById('notes-search-input');
        if (input) {
            input.value = '';
            filterNotes();
        }
    });
}

// Reset Button
const resetFiltersBtn = document.getElementById('reset-filters-btn');
if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetNotesFilters);
}
// Redirect Modal Logic
if (window.location.hostname === 'zandenkoh.github.io' || window.location.href.includes('termina_penguin')) {
    const REDIRECT_DISMISSED_KEY = 'flashly_redirect_dismissed_count';
    const RELOAD_THRESHOLD = 10;

    let reloadCount = parseInt(localStorage.getItem(REDIRECT_DISMISSED_KEY) || '0');

    if (reloadCount === 0) {
        setTimeout(() => openModal('redirect-modal'), 2000);
    } else {
        reloadCount++;
        if (reloadCount >= RELOAD_THRESHOLD) {
            reloadCount = 0; // Reset to show again
        }
        localStorage.setItem(REDIRECT_DISMISSED_KEY, reloadCount.toString());
    }

    // Function to handle dismissal
    window.dismissRedirectModal = () => {
        document.getElementById('redirect-modal').classList.add('hidden');
        document.body.classList.remove('modal-open');
        localStorage.setItem(REDIRECT_DISMISSED_KEY, '1'); // Start counting reloads
    };
}

// --- AI Generation Logic ---

// PDF Handling
let aiPdfText = "";

function initAIPdfUpload() {
    const trigger = document.getElementById('ai-pdf-upload-trigger');
    const input = document.getElementById('ai-pdf-upload');
    const success = document.getElementById('ai-file-success');
    const filename = document.getElementById('ai-filename-display');
    const removeBtn = document.getElementById('ai-remove-file');
    const textArea = document.getElementById('ai-input-text');

    if (!trigger || !input) return;

    // Manual trigger for file input
    trigger.onclick = () => input.click();

    // Reset state
    aiPdfText = "";
    input.value = "";
    success.classList.add('hidden');
    textArea.disabled = false;
    textArea.placeholder = "Paste your study notes, an article, or topic here...";

    const handleFile = async (file) => {
        if (file.type !== 'application/pdf') {
            showToast('Only PDF files are supported', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showToast('File size limit is 5MB', 'info');
            return;
        }

        // Add loading state
        trigger.classList.add('opacity-50', 'pointer-events-none');
        trigger.innerHTML = '<span class="loading-spinner"></span> Extracting...';
        textArea.value = "Extracting text from PDF...";
        textArea.disabled = true;

        try {
            const arrayBuffer = await file.arrayBuffer();
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            // Limit to first 10 pages to save tokens/memory
            const maxPages = Math.min(pdf.numPages, 10);
            let fullText = "";

            for (let i = 1; i <= maxPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + "\n\n";
            }

            aiPdfText = fullText;

            // Show success UI
            filename.textContent = file.name;
            success.classList.remove('hidden');

            // Fill textarea but keep it disabled (visual feedback)
            textArea.value = `[PDF Uploaded: ${file.name}]\n\n${fullText.substring(0, 500)}...\n\n(Full text extracted for AI)`;

        } catch (err) {
            console.error("PDF Read Error:", err);
            showToast("Failed to read PDF. Is it password protected?", "error");
            textArea.value = "";
            textArea.disabled = false;
        } finally {
            trigger.classList.remove('opacity-50', 'pointer-events-none');
            trigger.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                    <path d="M12 12v9"></path>
                    <path d="m16 16-4-4-4 4"></path>
                </svg>
                Upload PDF Study Notes
            `;
        }
    };

    input.onchange = (e) => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    };

    removeBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        input.value = "";
        aiPdfText = "";
        success.classList.add('hidden');
        textArea.value = "";
        textArea.disabled = false;
        textArea.placeholder = "Paste your study notes, an article, or topic here...";
    };
}


// Modal Listeners
document.getElementById('ai-generate-btn')?.addEventListener('click', () => {
    if (state.isGuest) {
        openModal('auth-modal');
        return;
    }
    openAIModal();
    initAIPdfUpload();
});

document.getElementById('close-ai-modal-btn')?.addEventListener('click', () => {
    document.getElementById('ai-modal').classList.add('hidden');
    document.getElementById('modal-overlay').classList.add('hidden');
});

function openAIModal() {
    document.getElementById('ai-modal-input-view').classList.remove('hidden');
    document.getElementById('ai-modal-loading-view').classList.add('hidden');
    document.getElementById('ai-modal').classList.remove('hidden');
    document.getElementById('modal-overlay').classList.remove('hidden');

    // Check limits UI
    checkAIUsageLimits();

    // Setup character counter
    const textarea = document.getElementById('ai-input-text');
    const charCount = document.getElementById('text-char-count');

    if (textarea && charCount) {
        const updateCount = () => {
            const count = textarea.value.length;
            charCount.textContent = `${count} chars`;
            charCount.style.color = count >= 50 ? 'var(--success)' : 'var(--text-tertiary)';
        };

        textarea.addEventListener('input', updateCount);
        updateCount(); // Initial count
    }
}

async function checkAIUsageLimits() {
    // If guest or no user, hide AI entry points
    if (!state.user || state.isGuest) {
        const genBtn = document.getElementById('ai-generate-btn');
        if (genBtn) genBtn.style.display = 'none';

        const sumBtn = document.getElementById('note-detail-ai-summary-btn');
        if (sumBtn) sumBtn.classList.add('hidden');
        return;
    }

    // Always show the entry points for logged in users
    const genBtn = document.getElementById('ai-generate-btn');
    if (genBtn) genBtn.style.display = 'none';

    const sumBtn = document.getElementById('note-detail-ai-summary-btn');
    if (sumBtn) sumBtn.classList.remove('hidden');

    // Fetch profile if not already in state (though usually it is via fetchUserProfile)
    let usage = state.ai_usage;
    if (!usage) {
        const { data: profile } = await sb.from('profiles')
            .select('last_ai_deck_at, daily_ai_summaries, last_summary_at')
            .eq('id', state.user.id)
            .maybeSingle();
        if (profile) {
            usage = {
                last_ai_deck_at: profile.last_ai_deck_at,
                daily_ai_summaries: profile.daily_ai_summaries || 0,
                last_summary_at: profile.last_summary_at
            };
            state.ai_usage = usage;
        }
    }

    if (usage) {
        const now = new Date();

        // 1. Deck Limit: 1 per week
        const lastDeck = usage.last_ai_deck_at ? new Date(usage.last_ai_deck_at) : null;
        const diffDays = lastDeck ? (now - lastDeck) / (1000 * 60 * 60 * 24) : 99;

        const limitText = document.getElementById('ai-deck-limit-text');
        const submitBtn = document.getElementById('ai-generate-submit');

        if (diffDays < 7) {
            const daysLeft = Math.ceil(7 - diffDays);
            if (limitText) limitText.textContent = `Limit reached. New AI deck available in ${daysLeft} days.`;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.5';
            }
            if (genBtn) {
                genBtn.title = `Limit reached. New AI deck in ${daysLeft} days.`;
                genBtn.style.opacity = '0.7';
            }
        } else {
            if (limitText) limitText.textContent = `Free: 1 AI deck per week (Available now!)`;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            }
            if (genBtn) {
                genBtn.title = "Generate a flashcard deck using AI";
                genBtn.style.opacity = '1';
            }
        }

        // 2. Summary Limit: 5 per day
        const SUMMARY_LIMIT = 5;
        const lastSummary = usage.last_summary_at ? new Date(usage.last_summary_at) : null;
        const isSameDay = lastSummary && lastSummary.toDateString() === now.toDateString();
        const currentSummaries = isSameDay ? (usage.daily_ai_summaries || 0) : 0;

        if (sumBtn) {
            if (currentSummaries >= SUMMARY_LIMIT) {
                sumBtn.disabled = true;
                sumBtn.style.opacity = '0.5';
                sumBtn.title = `Daily limit reached (${SUMMARY_LIMIT}/${SUMMARY_LIMIT})`;
            } else {
                sumBtn.disabled = false;
                sumBtn.style.opacity = '1';
                sumBtn.title = `AI Summary (${SUMMARY_LIMIT - currentSummaries} left today)`;
            }
        }
    }
}

document.getElementById('ai-generate-submit')?.addEventListener('click', async () => {
    // Use extracted PDF text OR typed text
    let text = aiPdfText || document.getElementById('ai-input-text').value.trim();

    // Clean up if it's the preview message
    if (text.startsWith('[PDF Uploaded:')) {
        text = aiPdfText;
    }

    if (!text || text.length < 50) {
        showToast('Please provide more content (at least 50 chars)', 'info');
        return;
    }

    const count = document.getElementById('ai-card-count').value;
    const difficulty = document.getElementById('ai-difficulty').value;

    // Switch to loading view
    document.getElementById('ai-modal-input-view').classList.add('hidden');
    document.getElementById('ai-modal-loading-view').classList.remove('hidden');

    updateAIStatus("Analyzing content...", 20);

    try {
        // Explicitly pass apikey header to avoid 400 errors on some platforms
        const { data, error } = await sb.functions.invoke('ai-generator', {
            body: {
                action: 'generate_deck',
                content: text,
                cardCount: count,
                difficulty: difficulty
            },
            headers: {
                'apikey': supabaseKey
            }
        });

        if (error) throw error;
        if (data && data.error) throw new Error(data.error);

        updateAIStatus("Crafting cards...", 60);

        if (data.cards && data.cards.length > 0) {
            // Create the deck
            const { data: deck, error: deckErr } = await sb.from('decks').insert([{
                title: data.suggested_title || 'AI Generated Deck',
                description: `Generated from AI. ${text.substring(0, 50)}...`,
                user_id: state.user.id,
                is_public: false
            }]).select().single();

            if (deckErr) throw deckErr;

            updateAIStatus("Saving to database...", 90);

            // Insert cards
            const cardsToInsert = data.cards.map(c => ({
                deck_id: deck.id,
                front: c.front,
                back: c.back,
                due_at: new Date()
            }));

            const { error: cardErr } = await sb.from('cards').insert(cardsToInsert);
            if (cardErr) throw cardErr;

            // Success!
            showToast(`Generated ${data.cards.length} cards successfully!`, 'success');
            document.getElementById('ai-modal').classList.add('hidden');
            document.getElementById('modal-overlay').classList.add('hidden');

            // Update local state to reflect the new limit
            if (state.ai_usage) {
                state.ai_usage.last_ai_deck_at = new Date().toISOString();
                checkAIUsageLimits();
            }

            // Navigate to the new deck
            loadDecksView();
            openDeck(deck);
        } else {
            throw new Error("No cards were generated. Try longer content.");
        }

    } catch (err) {
        console.error("AI Gen Error:", err);
        showToast(err.message || "AI Generation failed. Check console.", "error");
        document.getElementById('ai-modal-input-view').classList.remove('hidden');
        document.getElementById('ai-modal-loading-view').classList.add('hidden');
    }
});

function updateAIStatus(text, progress) {
    const status = document.querySelector('.ai-loading-status');
    const bar = document.getElementById('ai-progress-bar');
    if (status) status.textContent = text;
    if (bar) bar.style.width = `${progress}%`;
}

// Summary Logic
document.getElementById('note-detail-ai-summary-btn')?.addEventListener('click', async () => {
    if (state.isGuest) {
        openModal('auth-modal');
        return;
    }

    if (!state.currentNote) return;


    // Use the container for output
    const container = document.getElementById('ai-summary-container');
    const summaryBtn = document.getElementById('note-detail-ai-summary-btn');

    if (summaryBtn) summaryBtn.style.display = 'none';
    renderSkeletonSummary(container); // Show skeleton immediately

    try {
        const { data, error } = await sb.functions.invoke('ai-generator', {
            body: {
                action: 'summarize',
                note_id: state.currentNote.id,
                note_url: state.currentNote.url,
                note_title: state.currentNote.title
            },
            headers: {
                'apikey': supabaseKey
            }
        });

        if (error) {
            try {
                const body = await error.context.json();
                throw new Error(body.error || error.message);
            } catch (e) {
                throw error;
            }
        }
        if (data && data.error) throw new Error(data.error);

        // Normalize data for renderSummary
        let contentToRender = {};
        if (data.title && data.key_points) {
            contentToRender = { title: data.title, key_points: data.key_points };
        } else if (data.summary) {
            contentToRender = { summary: data.summary };
        }

        // Render the result
        renderSummary(contentToRender, container);
        showToast('AI Summary generated!', 'success');

        // Save to DB (note_summaries) - The Edge Function might do this, but if not, we do it here.
        // Assuming Edge Function returns the generated summary but DOES NOT save to note_summaries table yet?
        // Let's safe-guard and save it here to be sure, or rely on the function.
        // Given I cannot see the Edge Function code fully (only listed files), I will upsert here to be safe and ensure caching works next time.

        await sb.from('note_summaries').upsert({
            note_id: state.currentNote.id,
            user_id: state.user.id,
            content: contentToRender
        }, { onConflict: 'note_id' });


        // Update local state usage limits
        if (state.ai_usage) {
            const now = new Date();
            const lastSummary = state.ai_usage.last_summary_at ? new Date(state.ai_usage.last_summary_at) : null;
            const isSameDay = lastSummary && lastSummary.toDateString() === now.toDateString();

            state.ai_usage.daily_ai_summaries = isSameDay ? (state.ai_usage.daily_ai_summaries + 1) : 1;
            state.ai_usage.last_summary_at = now.toISOString();
            checkAIUsageLimits();
        }

    } catch (err) {
        console.error("AI Summary Error:", err);
        showToast(err.message || "Summary failed.", "error");

        // Restore button on error
        if (summaryBtn) summaryBtn.style.display = 'flex';
        container.classList.add('hidden');
        container.innerHTML = '';
    }
});

// --- Onboarding Logic ---
async function selectDailyGoal(cards) {
    state.settings.dailyLimit = cards;
    syncToLocal();
    localStorage.setItem('flashly-onboarding-seen', 'true');
    localStorage.setItem('flashly-daily-limit', cards); // Ensure persistence

    const modal = document.getElementById('onboarding-modal');
    if (modal) modal.classList.add('hidden');

    if (state.user) {
        const { error } = await sb.from('profiles').upsert({ id: state.user.id, daily_limit: cards });
        if (error) console.warn("Failed to save daily goal preference:", error);
    }

    // Update Today View
    loadTodayView();
    showToast(`Daily goal set to ${cards >= 1000 ? 'Unlimited' : cards + ' cards'}!`, 'success');
}

// --- End of Script ---

async function checkExistingSummary(noteId) {
    const container = document.getElementById('ai-summary-container');
    const summaryBtn = document.getElementById('note-detail-ai-summary-btn');

    if (!state.user && !state.isGuest) {
        return;
    }


    // Do NOT show skeleton immediately. Wait for DB check first.
    // If we find data -> Show data.
    // If no data -> Show button (already visible).

    try {
        const { data, error } = await sb
            .from('note_summaries')
            .select('*')
            .eq('note_id', noteId)
            .maybeSingle();

        if (error) {
            console.error('Error checking summary:', error);
            return;
        }

        if (data) {
            // Found summary
            if (summaryBtn) summaryBtn.style.display = 'none';
            renderSummary(data.content, container);
        } else {
            // No summary - Hide skeleton and show button
            if (container) {
                container.innerHTML = '';
                container.classList.add('hidden');
            }
            if (summaryBtn) summaryBtn.style.display = 'flex';
        }

    } catch (err) {
        console.warn('Failed to check summary:', err);
        // On error, default to button
        if (container) {
            container.innerHTML = '';
            container.classList.add('hidden');
        }
        if (summaryBtn) summaryBtn.style.display = 'flex';
    }
}

function renderSummary(content, container) {
    if (!container) return;
    container.classList.remove('hidden');

    let keyPoints = [];
    let summaryTitle = "Flashly AI Insight"; // Default title

    // Handle content format (JSONB or old format if any)
    if (content.key_points && Array.isArray(content.key_points)) {
        keyPoints = content.key_points;
        summaryTitle = content.title || summaryTitle;
    } else if (Array.isArray(content)) {
        keyPoints = content;
    } else if (typeof content === 'string') {
        // Fallback for raw string
        keyPoints = [content];
    } else if (content.summary) {
        // Legacy wrapper
        if (Array.isArray(content.summary)) keyPoints = content.summary;
        else keyPoints = [content.summary];
    }

    const listHtml = keyPoints.map((point) => {
        let text = point;
        if (typeof point === 'object' && point !== null) {
            // Handle {point: "..."} or similar objects
            text = Object.values(point).join(' ');
        }

        // Process bold text (**text**)
        const processedLine = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold" style="color: var(--primary);">$1</strong>');

        return `
        <li style="display: flex; gap: 0.75rem; margin-bottom: 1rem; align-items: flex-start;">
            <span style="line-height: 1.6; color: var(--text-primary);">${processedLine}</span>
        </li>
    `}).join('');

    const summaryHtml = `
        <div class="ai-summary-result" style="
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.5rem;
            position: relative;
            overflow: hidden;
            animation: fadeIn 0.4s ease-in-out;
        ">
            <div style="position: absolute; top: 0; right: 0; padding: 1.5rem; opacity: 0.03; pointer-events: none;">
                <svg style="width: 5rem; height: 5rem;" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L14.4 9.6H22L15.8 14.2L18.2 21.8L12 17.2L5.8 21.8L8.2 14.2L2 9.6H9.6L12 2Z"/>
                </svg>
            </div>
            
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; cursor: pointer;" onclick="toggleSummaryCollapse(this)">
                <h4 style="
                    font-weight: 700;
                    font-size: 1.1rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin: 0;
                    color: var(--text-primary);
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    ${summaryTitle}
                </h4>
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="
                        font-size: 0.65rem;
                        text-transform: uppercase;
                        letter-spacing: 0.1em;
                        font-weight: 700;
                        padding: 0.35rem 0.75rem;
                        border-radius: 6px;
                        background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.05));
                        color: var(--primary);
                        border: 1px solid rgba(37, 99, 235, 0.2);
                    ">AI Generated</span>
                    <svg class="summary-toggle-icon" style="width: 20px; height: 20px; transition: transform 0.3s ease; color: var(--text-secondary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </div>
            
            <ul class="summary-content" style="
                list-style: none;
                padding: 0;
                margin: 0;
                font-size: 0.95rem;
                line-height: 1.7;
                max-height: 1000px;
                overflow: hidden;
                transition: max-height 0.4s ease, opacity 0.3s ease;
                opacity: 1;
            ">
                ${listHtml}
            </ul>
        </div>
    `;

    container.innerHTML = summaryHtml;
}

// Toggle function for collapsible summary
function toggleSummaryCollapse(headerElement) {
    const summaryContent = headerElement.nextElementSibling;
    const toggleIcon = headerElement.querySelector('.summary-toggle-icon');
    const summaryContainer = headerElement.closest('.ai-summary-result');

    if (!summaryContent || !toggleIcon || !summaryContainer) return;

    const isCollapsed = summaryContent.style.maxHeight === '0px';

    if (isCollapsed) {
        // Expand
        summaryContent.style.maxHeight = '1000px';
        summaryContent.style.opacity = '1';
        toggleIcon.style.transform = 'rotate(0deg)';
        summaryContainer.style.padding = '1.5rem';
    } else {
        // Collapse
        summaryContent.style.maxHeight = '0px';
        summaryContent.style.opacity = '0';
        toggleIcon.style.transform = 'rotate(-90deg)';
        summaryContainer.style.padding = '1.5rem';
        summaryContainer.style.paddingBottom = '0';
    }
}

function renderSkeletonSummary(container) {
    if (!container) return;
    container.classList.remove('hidden');
    container.innerHTML = `
        <div class="ai-summary-result" style="
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.5rem;
            position: relative;
            overflow: hidden;
        ">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                </svg>
                <span style="font-weight: 600; color: var(--text-secondary);">Summarising...</span>
            </div>
            
            <div class="skeleton-shimmer"></div>
            
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="skeleton-text title gradient-text-anim"></div>
                <div class="skeleton-text desc gradient-text-anim" style="width: 100%;"></div>
                <div class="skeleton-text desc gradient-text-anim" style="width: 95%;"></div>
                <div class="skeleton-text desc gradient-text-anim" style="width: 90%;"></div>
            </div>
             <p class="text-xs text-dim mt-4">Generating smart insights from your note...</p>
        </div>
    `;
}
