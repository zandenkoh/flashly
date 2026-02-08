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
    lastView: 'dashboard-view', // Track for back navigation
    selectionMode: false,
    selectedCardIds: new Set()
};

const DEFAULT_TAGS = [
    { name: 'Important', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />' },
    { name: 'Hard', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />' },
    { name: 'Math', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />' }, // simplified icon
    { name: 'Science', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.327 24.327 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />' },
    { name: 'Coding', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />' },
    { name: 'Todo', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />' }
];

// DOM Elements
const authView = document.getElementById('auth-view');
const authModal = document.getElementById('auth-modal');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const mainLayout = document.getElementById('main-layout');
const dashboardView = document.getElementById('dashboard-view');
const deckView = document.getElementById('deck-view');
const studyView = document.getElementById('study-view');
const studySummaryView = document.getElementById('study-summary-view');
const statsView = document.getElementById('stats-view');
const communityView = document.getElementById('community-view');
const gameView = document.getElementById('game-view');
const modalOverlay = document.getElementById('modal-overlay');

// --- Auth Logic ---

async function checkUser() {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        state.user = session.user;
        showApp();
    } else {
        showAuth();
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

// Landing Page Actions
document.querySelectorAll('.btn-login-toggle').forEach(btn => {
    btn.onclick = () => {
        authMode = 'login';
        updateAuthUI();
        authModal.classList.remove('hidden');
    };
});

document.querySelectorAll('.btn-signup-toggle').forEach(btn => {
    btn.onclick = () => {
        authMode = 'signup';
        updateAuthUI();
        authModal.classList.remove('hidden');
    };
});

document.querySelector('.auth-modal-close').onclick = () => {
    authModal.classList.add('hidden');
};

authModal.onclick = (e) => {
    if (e.target === authModal) authModal.classList.add('hidden');
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
        authModal.classList.add('hidden');
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => sb.auth.signOut());

function showAuth() {
    authView.classList.remove('hidden');
    mainLayout.classList.add('hidden');
    authModal.classList.add('hidden');
}

function showApp() {
    authView.classList.add('hidden');
    mainLayout.classList.remove('hidden');
    document.getElementById('user-email').textContent = state.user.email;
    setupRealtime();
    loadTags(); // Pre-load tags
    loadDashboard();
    fetchUserProfile(); // Fetch custom username
    handleInviteLink(); // Check for ?join= code
}

async function handleInviteLink() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join');
    if (!code || !state.user) return;

    // Remove code from URL without refreshing
    const cleanUrl = window.location.href.split('?')[0];
    window.history.replaceState({}, document.title, cleanUrl);

    // 1. Find group
    const { data: group } = await sb.from('groups').select('id, name').eq('invite_code', code).maybeSingle();
    if (!group) return showToast('Invalid Invite Link', 'error');

    // 2. Insert member
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

async function fetchUserProfile() {
    const { data } = await sb.from('profiles').select('username').eq('id', state.user.id).single();
    if (data && data.username) {
        state.user.username = data.username;
        document.getElementById('user-email').textContent = data.username;
    }
}


// --- Navigation ---

document.getElementById('nav-decks').addEventListener('click', () => {
    updateNav('nav-decks');
    switchView('dashboard-view');
});
document.getElementById('nav-stats').addEventListener('click', () => {
    updateNav('nav-stats');
    switchView('stats-view');
    loadStats();
});
document.getElementById('nav-community').addEventListener('click', () => {
    updateNav('nav-community');
    switchView('community-view');
    updateNav('nav-community');
    switchView('community-view');
    loadCommunityDecks();
});

document.getElementById('nav-groups').addEventListener('click', () => {
    updateNav('nav-groups');
    switchView('groups-view');
    loadGroups();
});

// Settings
document.getElementById('settings-btn').addEventListener('click', () => {
    document.getElementById('settings-username').value = state.user.username || state.user.email;
    openModal('settings-modal');
});

document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = document.getElementById('settings-username').value;
    const { error } = await sb.from('profiles').upsert({ id: state.user.id, username: newUsername });

    if (error) {
        if (error.code === '23505') showToast('Username already taken', 'error');
        else showToast(error.message, 'error');
    } else {
        state.user.username = newUsername;
        document.getElementById('user-email').textContent = newUsername;
        showToast('Settings saved');
        closeModal();
    }
});

document.getElementById('back-to-dashboard').addEventListener('click', () => {
    const target = state.lastView || 'dashboard-view';
    state.currentDeck = null;
    switchView(target);
    if (target === 'dashboard-view') loadDashboard();
    else if (target === 'group-detail-view') loadGroupDetails(state.currentGroup.id);
    else if (target === 'community-view') loadCommunityDecks();
});

document.getElementById('delete-deck-btn').addEventListener('click', async () => {
    if (!state.currentDeck) return;
    if (!confirm(`Are you sure you want to delete "${state.currentDeck.title}"?`)) return;

    const { error } = await sb.from('decks').delete().eq('id', state.currentDeck.id);
    if (error) showToast(error.message, 'error');
    else {
        showToast('Deck deleted');
        switchView('dashboard-view');
        loadDashboard();
    }
});

function updateNav(activeId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(activeId).classList.add('active');
}

// --- Realtime ---

function setupRealtime() {
    cleanupRealtime();
    state.channels.decks = sb
        .channel('public:decks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'decks' }, () => {
            // Refresh if on dashboard
            if (!dashboardView.classList.contains('hidden')) loadDashboard();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'decks' }, () => {
            if (!dashboardView.classList.contains('hidden')) loadDashboard();
            if (!document.getElementById('groups-view').classList.contains('hidden')) loadGroups(); // Refresh groups logic if decks change? No.
            if (!document.getElementById('group-detail-view').classList.contains('hidden')) loadGroupDetails(state.currentGroup.id);
        })
        .subscribe();
}

function cleanupRealtime() {
    if (state.channels.decks) sb.removeChannel(state.channels.decks);
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

async function loadDashboard() {
    const { data: decks, error } = await sb
        .from('decks')
        .select('*')
        .eq('user_id', state.user.id) // Only my decks
        .order('created_at', { ascending: false });

    if (error) return showToast(error.message, 'error');

    // Fetch stats for decks
    const stats = {};
    const { data: cards } = await sb.from('cards').select('deck_id, due_at, interval_days');

    if (cards) {
        cards.forEach(card => {
            // Very basic check - logic implies we should only fetch *my* cards, but RLS handles that.
            if (!stats[card.deck_id]) stats[card.deck_id] = { total: 0, due: 0, new: 0 };
            stats[card.deck_id].total++;

            const now = new Date();
            const due = card.due_at ? new Date(card.due_at) : null;
            const isNew = card.interval_days === 0;
            if (isNew || (due && due <= now)) stats[card.deck_id].due++;
        });
    }

    state.decks = decks.map(d => ({ ...d, stats: stats[d.id] || { total: 0, due: 0 } }));

    // FETCH SAVED DECKS
    const { data: saved } = await sb.from('saved_decks').select('deck_id, decks(*)').eq('user_id', state.user.id);
    if (saved) {
        state.savedDecks = saved.map(s => s.decks).filter(d => d); // Filter nulls
        // Basic stats for saved decks?
        // We can just reuse logic if we want, but for now just show them.
    }

    renderDecks();
}

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
            state.lastView = 'dashboard-view';
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
            loadDashboard();
        }
    }
});


// --- Deck Details & Cards ---

async function openDeck(deck) {
    state.currentDeck = deck;
    document.getElementById('current-deck-title').textContent = deck.title;

    const publicBadge = document.getElementById('deck-public-badge');
    const toggleBtn = document.getElementById('toggle-public-btn');

    if (deck.is_public) {
        publicBadge.classList.remove('hidden');
        toggleBtn.innerHTML = toggleBtn.innerHTML.replace('Public', 'Make Private');
        toggleBtn.classList.add('btn-primary');
        toggleBtn.classList.remove('btn-outline');
    } else {
        publicBadge.classList.add('hidden');
        toggleBtn.innerHTML = toggleBtn.innerHTML.replace('Make Private', 'Public');
        toggleBtn.classList.remove('btn-primary');
        toggleBtn.classList.add('btn-outline');
    }

    switchView('deck-view');

    // UI Robustness: Toggle visibility of editor-only features
    const isOwner = state.user && deck.user_id === state.user.id;

    // Header Actions Visibility
    // 1. "Public" toggle and "Delete" button are in .header-actions (bottom row)
    const headerActions = document.querySelector('.deck-sub-actions');
    if (headerActions) headerActions.style.display = (isOwner || (deck.group_id && canEditGroupDeck(deck))) ? 'flex' : 'none';

    // 2. "Add Card" button handling (now in import-section)
    const addCardBtn = document.getElementById('add-card-btn');
    if (addCardBtn) addCardBtn.style.display = (isOwner || (deck.group_id && canEditGroupDeck(deck))) ? 'inline-flex' : 'none';

    // 3. Import Section (CSV)
    const importSection = document.querySelector('.import-section');
    if (importSection) importSection.style.display = (isOwner || (deck.group_id && canEditGroupDeck(deck))) ? 'flex' : 'none';

    // Add/Remove Study-from-Community Import button (top row)
    let importBtn = document.getElementById('community-import-btn');
    const mainActions = document.querySelector('.deck-main-actions');

    if (!isOwner) {
        if (!importBtn && mainActions) {
            importBtn = document.createElement('button');
            importBtn.id = 'community-import-btn';
            importBtn.className = 'btn btn-success';
            importBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="icon-sm">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Import
            `;
            importBtn.onclick = () => importDeck(deck.id);
            mainActions.prepend(importBtn);
        }
    } else if (importBtn) {
        importBtn.remove();
    }

    // "Save to Shortcuts" Button
    updateSaveDeckButton(deck);

    loadCards(deck.id);
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
        item.className = `flashcard-item ${state.selectionMode ? 'selecting' : ''}`;
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
            }
            e.target.value = ''; // Reset input
        },
        error: (err) => {
            showToast('Error parsing CSV: ' + err.message, 'error');
        }
    });
});

// -- Public Toggle --
document.getElementById('toggle-public-btn').addEventListener('click', async () => {
    if (!state.currentDeck) return;
    const newStatus = !state.currentDeck.is_public;
    const { error } = await sb.from('decks').update({ is_public: newStatus }).eq('id', state.currentDeck.id);
    if (error) showToast(error.message, 'error');
    else {
        state.currentDeck.is_public = newStatus;
        showToast(newStatus ? 'Deck is now Public' : 'Deck is now Private');
        openDeck(state.currentDeck); // Re-render header
    }
});


// --- Custom Study ---

document.getElementById('custom-study-btn').addEventListener('click', () => {
    // Populate tag filter
    const select = document.getElementById('custom-study-tag-filter');
    select.innerHTML = '<option value="">All Tags</option>';
    state.tags.forEach(t => {
        select.innerHTML += `<option value="${t.id}">${escapeHtml(t.name)}</option>`;
    });
    openModal('custom-study-modal');
});

document.getElementById('custom-study-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const tagId = document.getElementById('custom-study-tag-filter').value;
    const limit = parseInt(document.getElementById('custom-study-limit').value);

    state.studySessionConfig = { type: 'custom', tagId, limit };
    closeModal();
    startStudySession();
});

document.getElementById('study-deck-btn').addEventListener('click', () => {
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

document.getElementById('fullscreen-study-btn').onclick = () => {
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

// --- Study Logic ---

async function startStudySession() {
    // 1. Fetch ALL cards (cached in state.cards) or need fetch if we are in 'global' custom study?
    // For now, assume custom study is filtered on CURRENT DECK or ALL DECKS. 
    // Implementation Plan said "Temporary study queues".
    // If we want Custom Study across ALL decks, we need a fetch. 
    // Let's keep it simple: Custom Study is within CURRENT DECK mainly contextually, 
    // BUT the prompt implies advanced features. Let's do Current Deck for now to be safe with RLS/Data.

    // Actually, dashboard has 'Custom Study' button. Let's assume it spans ALL decks if accessed from Dashboard, 
    // or Current Deck if in Deck View.
    // The button is in Dashboard view in HTML. So it spans ALL decks.

    let allCards = [];
    if (state.currentDeck) {
        allCards = state.cards;
    } else {
        // Fetch all cards for custom study from dashboard
        // We need to fetch tags too
        const { data } = await sb.from('cards').select(`*, card_tags(tag_id)`).order('due_at');
        if (data) allCards = data;
    }

    let queue = [];
    const config = state.studySessionConfig;

    if (config.type === 'custom') {
        queue = allCards;
        // Filter by Tag
        if (config.tagId) {
            queue = queue.filter(c => c.card_tags.some(ct => ct.tag_id === config.tagId));
        }
        // Limit
        if (config.limit) {
            queue = queue.slice(0, config.limit);
        }
    } else {
        // Standard SRS
        const now = new Date();
        queue = allCards.filter(c => !c.due_at || new Date(c.due_at) <= now || c.interval_days === 0);
        // Sort by priority logic (simplified here)
        queue.sort((a, b) => new Date(a.due_at || 0) - new Date(b.due_at || 0));
    }

    if (queue.length === 0) {
        showToast('No cards match your study criteria!', 'success');
        return;
    }

    state.studyQueue = queue;
    state.currentCardIndex = 0;
    switchView('study-view');
    showNextCard();
}


function showNextCard() {
    if (state.currentCardIndex >= state.studyQueue.length) {
        finishStudySession();
        return;
    }
    const card = state.studyQueue[state.currentCardIndex];
    document.getElementById('study-front').textContent = card.front;
    document.getElementById('study-back').textContent = card.back;
    document.getElementById('study-progress').textContent = `${state.studyQueue.length - state.currentCardIndex} remaining`;

    const flashcard = document.getElementById('active-flashcard');
    flashcard.classList.remove('is-flipped');
    state.isFlipped = false;
    document.getElementById('study-controls').classList.add('hidden');
    renderMath(document.getElementById('study-front'));
    renderMath(document.getElementById('study-back'));
}

// Flip/Rate Interactions (Reuse existing logic mostly)
document.getElementById('active-flashcard').addEventListener('click', flipCard);
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
    document.getElementById('active-flashcard').classList.add('is-flipped');
    state.isFlipped = true;
    setTimeout(() => document.getElementById('study-controls').classList.remove('hidden'), 200);
}

document.querySelectorAll('.btn-rate').forEach(btn => {
    btn.addEventListener('click', () => rateCard(parseInt(btn.dataset.rating)));
});

async function rateCard(rating) {
    const card = state.studyQueue[state.currentCardIndex];
    const isOwner = state.user && state.decks.some(d => d.id === card.deck_id);

    // Only save progress if it's my deck
    if (isOwner) {
        sb.from('study_logs').insert([{
            user_id: state.user.id,
            card_id: card.id,
            deck_id: card.deck_id,
            rating: rating
        }]).then(({ error }) => { if (error) console.error(error); });
    }

    // SRS Calc (Simple)
    let { interval_days, ease_factor, reviews_count } = card;
    interval_days = Number(interval_days);
    ease_factor = Number(ease_factor);
    reviews_count = Number(reviews_count) + 1;

    if (rating === 1) { // Again
        interval_days = 0.02;
        ease_factor = Math.max(1.3, ease_factor - 0.2);

        // Auto-tag 'leech' if struggling
        if (ease_factor <= 1.3 && reviews_count > 5) {
            // check if already has leech tag
            const leechTag = state.tags.find(t => t.name === 'leech');
            if (leechTag) {
                const hasTag = card.card_tags.some(ct => ct.tag_id === leechTag.id);
                if (!hasTag) {
                    sb.from('card_tags').insert([{ card_id: card.id, tag_id: leechTag.id }]).then(() => {
                        showToast('Card marked as Leech due to struggles', 'error');
                    });
                }
            }
        }
    } else if (rating === 2) { // Hard
        interval_days *= 1.2;
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

    state.currentCardIndex++;
    showNextCard();
}

function finishStudySession() {
    switchView('study-summary-view');
    document.getElementById('summary-count').textContent = state.studyQueue.length;
}
document.getElementById('back-to-deck-btn').addEventListener('click', () => {
    // If we came from dashboard custom study, go there. If deck, go deck.
    // Simplification: Go Dashboard
    switchView('dashboard-view');
    loadDashboard();
});
document.getElementById('quit-study-btn').addEventListener('click', () => switchView('dashboard-view'));

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
    state.currentGroup = group;
    document.getElementById('group-detail-title').textContent = group.name;
    document.getElementById('group-invite-code').textContent = group.invite_code;

    state.isGroupAdmin = (group.myRole === 'admin');

    // Toggle "New Deck" button based on role
    // Admins can create decks? Or anyone? RLS says "Group members can insert decks".
    // So anyone can create.
    document.getElementById('create-group-deck-btn').style.display = 'block';

    switchView('group-detail-view');
    loadGroupDetails(group.id);
}

document.getElementById('back-to-groups-btn').onclick = () => {
    switchView('groups-view');
    loadGroups();
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
    const { data: memberProfiles } = await sb.from('group_members')
        .select('role, user_id, profiles:user_id(username, created_at)')
        .eq('group_id', groupId);

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
            <div>
                 <div class="deck-title">${escapeHtml(deck.title)}</div>
                 <div class="deck-desc">${escapeHtml(deck.description || '')}</div>
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

function renderGroupMembers() {
    const list = document.getElementById('group-members-list');
    list.innerHTML = '';

    state.groupMembers.forEach(m => {
        const profile = m.profiles || {};
        const name = profile.username || 'Unknown User';
        const stats = state.groupMemberStats[m.user_id] || { reviews: 0, score: 0 };
        const mastery = stats.reviews > 0 ? Math.round((stats.score / (stats.reviews * 4)) * 100) : 0;

        const li = document.createElement('li');
        li.className = 'list-item';
        li.style.display = 'grid';
        li.style.gridTemplateColumns = '1fr 100px 100px 100px';
        li.style.gap = '2rem';
        li.style.alignItems = 'center';

        li.innerHTML = `
            <div style="display:flex; align-items:center; gap:1rem">
                <div class="user-avatar" style="width:32px; height:32px; border-radius:50%; background:var(--bg-secondary); display:flex; align-items:center; justify-content:center; font-weight:700; color:var(--primary); font-size:0.8rem">
                    ${name.charAt(0).toUpperCase()}
                </div>
                <div style="display:flex; flex-direction:column">
                    <span style="font-weight:600">${escapeHtml(name)}</span>
                    <span style="font-size:0.7rem; color:var(--text-secondary)">Joined ${new Date(profile.created_at || Date.now()).toLocaleDateString()}</span>
                </div>
            </div>
            <div style="text-align:center">
                <div style="font-weight:700">${stats.reviews}</div>
            </div>
            <div style="text-align:center">
                <div style="font-weight:700; color:var(--primary)">${mastery || 0}%</div>
            </div>
            <div style="text-align:right">
                <span class="badge" style="background:${m.role === 'admin' ? 'var(--primary)' : 'var(--bg-secondary)'}; color: ${m.role === 'admin' ? 'white' : 'var(--text-primary)'}; border:none">${m.role}</span>
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
    switchView('game-view');
    document.getElementById('game-menu').classList.remove('hidden');
    document.getElementById('match-game-area').classList.add('hidden');
    document.getElementById('gravity-game-area').classList.add('hidden');
    document.getElementById('game-score-display').textContent = 'Score: 0';
    document.getElementById('game-title-text').textContent = `Game: ${state.currentDeck.title}`;
});

document.getElementById('quit-game-area-btn').addEventListener('click', () => {
    stopGame();
    switchView('deck-view');
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
    // Fetch logs
    const { data: logs, error } = await sb.from('study_logs').select('*');
    if (error) {
        console.error("Error loading study logs:", error);
        return;
    }
    if (!logs || logs.length === 0) {
        console.warn("No study logs found for charts.");
        return;
    }

    // 1. Heatmap Data (Count per day)
    const dailyCounts = {};
    logs.forEach(log => {
        const date = log.review_time.split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    renderHeatmap(dailyCounts);

    // 2. Retention (Pie Chart)
    const ratings = { 1: 0, 2: 0, 3: 0, 4: 0 };
    logs.forEach(l => ratings[l.rating] = (ratings[l.rating] || 0) + 1);
    renderRetentionChart(ratings);

    // 3. Maturity (Bar Chart)
    const { data: cards, error: cardError } = await sb.from('cards').select('interval_days');
    if (cardError) console.error("Error loading cards for maturity chart:", cardError);

    if (cards && cards.length > 0) {
        const maturity = { New: 0, Young: 0, Mature: 0 };
        cards.forEach(c => {
            const val = Number(c.interval_days) || 0;
            if (val < 1) maturity.New++;
            else if (val < 21) maturity.Young++;
            else maturity.Mature++;
        });
        renderMaturityChart(maturity);
    }
}

let charts = {};

function renderHeatmap(data) {
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
            labels: last30Days.map(d => d.date.slice(5)),
            datasets: [{
                label: 'Cards Reviewed',
                data: last30Days.map(d => d.val),
                backgroundColor: 'rgba(37, 99, 235, 0.6)',
                borderColor: 'rgb(37, 99, 235)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

function renderRetentionChart(ratings) {
    const container = document.getElementById('retention-chart');
    container.innerHTML = '<canvas id="retention-canvas"></canvas>';
    const canvas = document.getElementById('retention-canvas');

    const data = [ratings[1], ratings[2], ratings[3], ratings[4]];

    if (charts.retention) charts.retention.destroy();
    charts.retention = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Again', 'Hard', 'Good', 'Easy'],
            datasets: [{
                data: data,
                backgroundColor: ["#ef4444", "#f59e0b", "#22c55e", "#2563eb"]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderMaturityChart(data) {
    const container = document.getElementById('maturity-chart');
    container.innerHTML = '<canvas id="maturity-canvas"></canvas>';
    const canvas = document.getElementById('maturity-canvas');

    if (charts.maturity) charts.maturity.destroy();
    charts.maturity = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Card Count',
                data: Object.values(data),
                backgroundColor: 'rgba(100, 116, 139, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}


// --- Community ---

async function loadCommunityDecks() {
    const grid = document.getElementById('community-deck-grid');
    grid.innerHTML = '<p>Loading public decks...</p>';

    // Fetch public decks (RLS allows select where is_public=true)
    const { data: decks, error } = await sb
        .from('decks')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error loading community decks:", error);
        grid.innerHTML = `
            <div class="error-container">
                <p>Error loading decks: ${error.message}</p>
                <button class="btn btn-primary btn-sm" onclick="loadCommunityDecks()">Retry</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = '';
    if (decks.length === 0) {
        grid.innerHTML = '<p>No public decks found.</p>';
        return;
    }

    decks.forEach(deck => {
        const div = document.createElement('div');
        div.className = 'deck-card';
        div.innerHTML = `
            <div class="deck-title">${escapeHtml(deck.title)}</div>
            <div class="deck-desc">${escapeHtml(deck.description || 'No description')}</div>
            <div class="deck-stats">
               <span>by ${escapeHtml(deck.profiles?.username || 'user')}</span>
            </div>
        `;
        div.onclick = () => openDeck(deck);
        grid.appendChild(div);
    });
}

window.importDeck = async (deckId) => {
    const btn = document.getElementById('community-import-btn') || event?.target;
    const originalText = btn ? btn.innerHTML : 'Import';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Importing...';
    }

    try {
        // 1. Fetch deep details
        const { data: deck } = await sb.from('decks').select('*').eq('id', deckId).single();
        const { data: cards } = await sb.from('cards').select('*').eq('deck_id', deckId);

        if (!deck || !cards) throw new Error('Could not fetch deck details');

        // 2. Insert new deck for me
        const { data: newDeck, error: dErr } = await sb.from('decks').insert([{
            user_id: state.user.id,
            title: deck.title,
            description: deck.description,
            is_public: false
        }]).select().single();

        if (dErr) throw dErr;

        // 3. Batch Insert cards for efficiency
        if (cards.length > 0) {
            const newCards = cards.map(c => ({
                deck_id: newDeck.id,
                front: c.front,
                back: c.back,
                due_at: new Date()
            }));
            const { error: cErr } = await sb.from('cards').insert(newCards);
            if (cErr) throw cErr;
        }

        showToast('Deck Imported Successfully!', 'success');
        switchView('dashboard-view');
        loadDashboard();
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}


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

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');
    stopGame(); // Ensure games stop
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => { });
    }
}

function openModal(id) {
    modalOverlay.classList.remove('hidden');
    document.getElementById(id).classList.remove('hidden');
}

function closeModal() {
    modalOverlay.classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}
document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModal));
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

// Init
checkUser();
