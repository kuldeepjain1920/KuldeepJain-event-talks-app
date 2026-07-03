// Application State
let releases = [];
let filteredReleases = [];

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const searchInput = document.getElementById('search-input');
const statsCounter = document.getElementById('stats-counter');
const releasesContainer = document.getElementById('releases-container');

// Modal Elements
const tweetDialog = document.getElementById('tweet-dialog');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
const publishTweetBtn = document.getElementById('publish-tweet-btn');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCount = document.getElementById('char-count');
const originalNotePreview = document.getElementById('original-note-preview');

// Fetch Releases from Flask Backend
async function fetchReleases() {
    try {
        setLoadingState(true);
        const response = await fetch('/api/releases');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        releases = await response.json();
        
        // Handle error responses from backend
        if (releases.error) {
            renderError(releases.error);
            return;
        }

        applyFilterAndRender();
    } catch (error) {
        console.error('Error fetching release notes:', error);
        renderError('Could not retrieve release notes. Please make sure the backend is active.');
    } finally {
        setLoadingState(false);
    }
}

// UI State Toggles
function setLoadingState(isLoading) {
    if (isLoading) {
        refreshBtn.disabled = true;
        refreshIcon.classList.add('spinning');
        
        // Show skeleton loading if releases empty
        if (releases.length === 0) {
            releasesContainer.innerHTML = `
                <div class="skeleton-loader">
                    <div class="skeleton-card"></div>
                    <div class="skeleton-card"></div>
                    <div class="skeleton-card"></div>
                </div>
            `;
        }
    } else {
        refreshBtn.disabled = false;
        refreshIcon.classList.remove('spinning');
    }
}

// Render Error
function renderError(message) {
    statsCounter.textContent = 'Error loading feed';
    releasesContainer.innerHTML = `
        <div class="error-container">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
            <p>${message}</p>
            <button class="btn btn-primary" style="margin-top: 1rem;" onclick="fetchReleases()">Try Again</button>
        </div>
    `;
}

// Filter and Render
function applyFilterAndRender() {
    const query = searchInput.value.toLowerCase().trim();
    
    if (query === '') {
        filteredReleases = [...releases];
    } else {
        filteredReleases = releases.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(query);
            const contentMatch = item.content.toLowerCase().includes(query);
            const dateMatch = formatDate(item.date).toLowerCase().includes(query);
            return titleMatch || contentMatch || dateMatch;
        });
    }

    // Update counter
    statsCounter.textContent = `${filteredReleases.length} Release${filteredReleases.length !== 1 ? 's' : ''}`;

    renderList();
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return 'Unknown Date';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

// Strip HTML tags helper for clean summaries
function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

// Determine Release type for badge
function getReleaseType(title, content) {
    const fullText = (title + ' ' + content).toLowerCase();
    if (fullText.includes('deprecat') || fullText.includes('remove') || fullText.includes('sunset')) {
        return { label: 'Deprecation', class: 'type-deprecation' };
    }
    if (fullText.includes('feature') || fullText.includes('introducing') || fullText.includes('support') || fullText.includes('new')) {
        return { label: 'Feature', class: 'type-feature' };
    }
    return { label: 'Update', class: 'type-general' };
}

// Render the actual list of cards
function renderList() {
    if (filteredReleases.length === 0) {
        releasesContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary); background: var(--bg-surface); border-radius: 16px; border: 1px solid var(--border-color);">
                <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--text-muted);"></i>
                <p>No release notes found matching your search.</p>
            </div>
        `;
        return;
    }

    releasesContainer.innerHTML = filteredReleases.map((item, index) => {
        const formattedDate = formatDate(item.date);
        const badge = getReleaseType(item.title, item.content);
        const sourceUrl = item.link || 'https://cloud.google.com/bigquery/docs/release-notes';
        
        return `
            <article class="release-card" data-id="${item.id || index}">
                <div class="card-header">
                    <div class="card-meta">
                        <span class="date-badge">${formattedDate}</span>
                        <span class="type-badge ${badge.class}">${badge.label}</span>
                    </div>
                    <button class="btn btn-card-action tweet-trigger" data-index="${index}">
                    <i class="fa-brands fa-x-twitter"></i> Tweet
                </button>
                <button class="btn btn-card-action copy-trigger" data-index="${index}">
                    <i class="fa-solid fa-copy"></i> Copy
                </button>
                </div>
                <h2 class="card-title">${item.title}</h2>
                <div class="card-content">${item.content}</div>
                <div class="card-footer">
                    <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" class="card-source-link">
                        <span>View official documentation</span> <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>
            </article>
        `;
    }).join('');

    // Attach tweet event listeners
    document.querySelectorAll('.tweet-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.getAttribute('data-index');
            openTweetComposer(filteredReleases[index]);
        });
    });
}

// Open Dialog & Generate Tweet Draft
function openTweetComposer(releaseItem) {
    const cleanTitle = stripHtml(releaseItem.title);
    const cleanContent = stripHtml(releaseItem.content);
    
    // Create draft
    let draft = `BigQuery Update: ${cleanTitle}\n\n`;
    
    // Take a snippet of the content to fit Twitter limits
    const maxLength = 280 - draft.length - 25; // 25 chars buffer for URL/hashtags
    let snippet = cleanContent;
    if (snippet.length > maxLength) {
        snippet = snippet.substring(0, maxLength - 3) + "...";
    }
    
    draft += snippet + `\n\n#BigQuery #GCP`;
    
    // Configure composer
    tweetTextarea.value = draft;
    updateCharCounter();
    
    // Setup original note preview
    originalNotePreview.innerHTML = `
        <strong>${cleanTitle}</strong> (${formatDate(releaseItem.date)})<br>
        <span style="font-size: 0.8rem;">${cleanContent}</span>
    `;

    // Open Modal dialog
    tweetDialog.showModal();
}

// Character counter utility
function updateCharCounter() {
    const len = tweetTextarea.value.length;
    charCount.textContent = len;
    
    if (len > 280) {
        charCount.style.color = '#ef4444';
        publishTweetBtn.disabled = true;
    } else {
        charCount.style.color = 'var(--text-muted)';
        publishTweetBtn.disabled = false;
    }
}

// Publish/Redirect to Twitter/X Web Intent
function publishTweet() {
    const text = tweetTextarea.value;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    tweetDialog.close();
}

// Event Listeners
refreshBtn.addEventListener('click', fetchReleases);
searchInput.addEventListener('input', applyFilterAndRender);

// Export CSV button
const exportBtn = document.getElementById('export-btn');
exportBtn.addEventListener('click', () => {
    const csvHeaders = ['ID', 'Title', 'Date', 'Content', 'Link'];
    const rows = filteredReleases.map(r => [
        r.id,
        r.title.replace(/"/g, '\\"'),
        r.date,
        stripHtml(r.content).replace(/"/g, '\\"'),
        r.link
    ]);
    const csvContent = [csvHeaders, ...rows]
        .map(e => e.map(v => `"${v}"`).join(','))
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bigquery_release_notes.csv';
    a.click();
    URL.revokeObjectURL(url);
});

// Theme toggle switch
const themeToggle = document.getElementById('theme-toggle');
const toggleLabel = document.querySelector('.toggle-label');
function applyTheme(isLight) {
    if (isLight) {
        document.documentElement.classList.add('light-mode');
        toggleLabel.textContent = 'Dark Mode';
    } else {
        document.documentElement.classList.remove('light-mode');
        toggleLabel.textContent = 'Light Mode';
    }
}
themeToggle.addEventListener('change', (e) => {
    applyTheme(e.target.checked);
});
// Initialize based on default (dark)
applyTheme(false);

// Modal action listeners
closeModalBtn.addEventListener('click', () => tweetDialog.close());
cancelTweetBtn.addEventListener('click', () => tweetDialog.close());
publishTweetBtn.addEventListener('click', publishTweet);
tweetTextarea.addEventListener('input', updateCharCounter);

// Attach copy button listeners after rendering cards
function attachCopyListeners() {
    document.querySelectorAll('.copy-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = e.currentTarget.getAttribute('data-index');
            const item = filteredReleases[idx];
            const text = `Title: ${stripHtml(item.title)}\nDate: ${formatDate(item.date)}\nLink: ${item.link}\n\n${stripHtml(item.content)}`;
            navigator.clipboard.writeText(text).then(() => {
                // optional feedback
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy'; }, 1500);
            }).catch(err => console.error('Copy failed', err));
        });
    });
}

// Extend renderList to call attachCopyListeners
const originalRenderList = renderList;
renderList = function() {
    originalRenderList();
    attachCopyListeners();
};

// Initialize App
document.addEventListener('DOMContentLoaded', fetchReleases);
