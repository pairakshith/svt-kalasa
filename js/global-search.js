/**
 * Mobile-Optimized Global Search Engine for SVT Kalasa
 * Works from Root and Subpages with JSON & Markdown Support
 */
(function () {
  let searchIndex = [];

  // Detect project root (handles local server, root domain, or GitHub Pages subfolders)
  function getRootPath() {
    const path = window.location.pathname;
    if (path.includes('/svt-kalasa/')) {
      return '/svt-kalasa/';
    }
    return '/';
  }

  function initSearchUI() {
    const modalHTML = `
      <div id="globalSearchModal" class="search-modal-overlay">
        <div class="search-modal-container">
          <div class="search-drag-handle"></div>
          <div class="search-header">
            <input 
              type="search" 
              id="globalSearchInput" 
              class="search-input" 
              placeholder="Search / ಹುಡುಕಿ (e.g. kalasa, pooja)..." 
              autocomplete="off" 
              autocorrect="off"
              autocapitalize="none"
              enterkeyhint="search"
            />
            <button id="closeSearchBtn" class="search-close-btn" aria-label="Close search">&times;</button>
          </div>
          <ul id="searchResultsList" class="search-results-list"></ul>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    document.getElementById('closeSearchBtn').addEventListener('click', closeSearch);
    document.getElementById('globalSearchModal').addEventListener('click', (e) => {
      if (e.target.id === 'globalSearchModal') closeSearch();
    });

    document.getElementById('globalSearchInput').addEventListener('input', handleSearchInput);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSearch();
    });
  }

  // Load and index Markdown (.md) and JSON (.json) files listed in data/search-index.json
  async function loadMarkdownData() {
    const root = getRootPath();
    const manifestUrl = `${root}data/search-index.json`.replace(/\/+/g, '/');

    console.log('[Search Engine] Attempting to load manifest from:', manifestUrl);

    try {
      const indexResponse = await fetch(manifestUrl);
      if (!indexResponse.ok) {
        console.error('[Search Engine] Failed to load search-index.json. Status:', indexResponse.status);
        return;
      }

      const filesToIndex = await indexResponse.json();

      for (const item of filesToIndex) {
        const targetUrl = item.type === 'json' ? item.dataUrl : item.mdUrl;
        if (!targetUrl) continue;

        const cleanTargetUrl = targetUrl.replace(/^\//, '');
        const cleanPageUrl = item.pageUrl.replace(/^\//, '');

        const fullTargetUrl = `${root}${cleanTargetUrl}`.replace(/\/+/g, '/');
        const fullPageUrl = `${root}${cleanPageUrl}`.replace(/\/+/g, '/');

        try {
          const res = await fetch(fullTargetUrl);
          if (!res.ok) {
            console.error(`[Search Engine] Could not fetch file: ${fullTargetUrl} (Status: ${res.status})`);
            continue;
          }

          // Process JSON data
          if (item.type === 'json') {
            const jsonData = await res.json();

            // Extract all string and number values recursively
            const extractTextValues = (obj) => {
              if (typeof obj === 'string' || typeof obj === 'number') return obj + ' ';
              if (Array.isArray(obj)) return obj.map(extractTextValues).join(' ');
              if (typeof obj === 'object' && obj !== null) {
                return Object.values(obj).map(extractTextValues).join(' ');
              }
              return '';
            };

            const cleanText = extractTextValues(jsonData).replace(/\s+/g, ' ').trim();

            searchIndex.push({
              title: item.title,
              content: cleanText,
              pageUrl: fullPageUrl
            });
            console.log(`[Search Engine] Indexed JSON: "${item.title}" (${cleanText.length} chars)`);
          } 
          // Process Markdown data
          else {
            const text = await res.text();
            
            // Clean markdown syntax (#, *, `, >, -, links)
            const cleanText = text
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
              .replace(/#|\*|`|>|-|_/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            searchIndex.push({
              title: item.title,
              content: cleanText,
              pageUrl: fullPageUrl
            });
            console.log(`[Search Engine] Indexed MD: "${item.title}" (${cleanText.length} chars)`);
          }
        } catch (err) {
          console.error(`[Search Engine] Error loading ${fullTargetUrl}:`, err);
        }
      }
      console.log(`[Search Engine] Total items ready in search index: ${searchIndex.length}`);
    } catch (err) {
      console.error('[Search Engine] Critical error fetching search-index.json:', err);
    }
  }

  // Matching algorithm
  function calculateScore(query, text) {
    if (!query || !text) return 0;
    
    const q = query.toLowerCase().trim();
    const t = text.toLowerCase();

    // Substring match
    if (t.includes(q)) return 100;

    // Partial word matches
    const queryWords = q.split(/\s+/);
    let matchCount = 0;
    for (let word of queryWords) {
      if (word.length > 1 && t.includes(word)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      return (matchCount / queryWords.length) * 75;
    }

    return 0;
  }

  function handleSearchInput(e) {
    const rawQuery = e.target.value.trim();
    const resultsContainer = document.getElementById('searchResultsList');
    resultsContainer.innerHTML = '';

    if (!rawQuery) return;

    const kannadaQuery = (window.Transliterate && typeof window.Transliterate.toKannada === 'function') 
      ? window.Transliterate.toKannada(rawQuery) 
      : '';

    let matchedResults = [];

    searchIndex.forEach(item => {
      let score = 0;
      let matchedBy = '';

      const titleScore = calculateScore(rawQuery, item.title) * 1.5;
      const contentScore = calculateScore(rawQuery, item.content);
      const directScore = Math.max(titleScore, contentScore);

      if (directScore > score) {
        score = directScore;
      }

      if (kannadaQuery && kannadaQuery !== rawQuery) {
        const kanTitleScore = calculateScore(kannadaQuery, item.title) * 1.5;
        const kanContentScore = calculateScore(kannadaQuery, item.content);
        const transliteratedScore = Math.max(kanTitleScore, kanContentScore);

        if (transliteratedScore > score) {
          score = transliteratedScore;
          matchedBy = `ಕನ್ನಡ: ${kannadaQuery}`;
        }
      }

      if (score > 0) {
        matchedResults.push({ ...item, score, matchedBy });
      }
    });

    matchedResults.sort((a, b) => b.score - a.score);

    renderResults(matchedResults, rawQuery, kannadaQuery);
  }

  function renderResults(results, rawQuery, kannadaQuery) {
    const resultsContainer = document.getElementById('searchResultsList');

    if (results.length === 0) {
      resultsContainer.innerHTML = `<li class="search-no-results">No results found for "${rawQuery}"</li>`;
      return;
    }

    results.forEach(res => {
      let matchIndex = res.content.toLowerCase().indexOf(rawQuery.toLowerCase());
      if (matchIndex === -1 && kannadaQuery) {
        matchIndex = res.content.indexOf(kannadaQuery);
      }

      let snippetStart = Math.max(0, matchIndex - 20);
      let snippet = res.content.substring(snippetStart, snippetStart + 110) + '...';

      const li = document.createElement('li');
      li.className = 'search-result-item';
      li.innerHTML = `
        <div class="search-result-title">
          <span>${res.title}</span>
          ${res.matchedBy ? `<span class="search-result-match-tag">${res.matchedBy}</span>` : ''}
        </div>
        <div class="search-result-snippet">${snippet}</div>
      `;
      li.onclick = () => {
        closeSearch();
        window.location.href = res.pageUrl;
      };
      resultsContainer.appendChild(li);
    });
  }

  window.openSearch = function () {
    const modal = document.getElementById('globalSearchModal');
    const input = document.getElementById('globalSearchInput');
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      input.focus();
    }, 100);
  };

  window.closeSearch = function () {
    const modal = document.getElementById('globalSearchModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  document.addEventListener('DOMContentLoaded', () => {
    initSearchUI();
    loadMarkdownData();
  });
})();