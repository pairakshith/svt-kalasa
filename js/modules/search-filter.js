/**
 * Generic Search & Filter Module
 * Reusable card and table filtering logic.
 */

export function filterCards({
    inputSelector = '#eventSearch',
    cardSelector = '.festival-card',
    noResultsSelector = '#noResultsMsg',
    keywordAttr = 'data-keywords',
    displayStyle = 'flex'
} = {}) {
    const input = document.querySelector(inputSelector);
    if (!input) return;

    const filter = input.value.toLowerCase().trim();
    const cards = document.querySelectorAll(cardSelector);
    let visibleCount = 0;

    cards.forEach(card => {
        const text = (card.textContent || card.innerText).toLowerCase();
        const keywords = (card.getAttribute(keywordAttr) || '').toLowerCase();
        const fullContent = `${text} ${keywords}`;

        if (fullContent.indexOf(filter) > -1) {
            card.style.display = displayStyle;
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const noResults = document.querySelector(noResultsSelector);
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

export function filterTable({
    inputSelector = '#tableSearch',
    tableSelector = '#eventsTable'
} = {}) {
    const input = document.querySelector(inputSelector);
    if (!input) return;

    const filter = input.value.toLowerCase().trim();
    const table = document.querySelector(tableSelector);
    if (!table) return;

    const rows = table.getElementsByTagName('tbody')[0]?.getElementsByTagName('tr') || [];

    for (let i = 0; i < rows.length; i++) {
        const rowText = rows[i].textContent || rows[i].innerText;
        rows[i].style.display = (rowText.toLowerCase().indexOf(filter) > -1) ? '' : 'none';
    }
}

export function initUpcomingEvents(cardSelector = '.festival-card') {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const cards = document.querySelectorAll(cardSelector);
    let foundUpcoming = false;

    cards.forEach(card => {
        const eventDate = card.getAttribute('data-date');
        if (!eventDate) return;

        if (!foundUpcoming && eventDate >= todayStr) {
            card.classList.add('upcoming-next');
            
            const cardTop = card.querySelector('.card-top');
            if (cardTop && !cardTop.querySelector('.upcoming-badge')) {
                const badge = document.createElement('span');
                badge.className = 'upcoming-badge';
                badge.innerHTML = '🌟 ಮುಂದಿನ ಉತ್ಸವ ';
                cardTop.appendChild(badge);
            }

            foundUpcoming = true;

            setTimeout(() => {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        } else if (eventDate < todayStr) {
            card.classList.add('past-event');
        }
    });
}

if (typeof window !== 'undefined') {
    window.filterCards = () => filterCards();
    window.filterTable = () => filterTable();
    window.initUpcomingEvents = initUpcomingEvents;
}
