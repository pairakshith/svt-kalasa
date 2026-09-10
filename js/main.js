/**
 * Event Table & Cards Search Filter Logic
 */

// 1. Card Filter Function
function filterCards() {
    const input = document.getElementById("eventSearch");
    if (!input) return;

    const filter = input.value.toLowerCase().trim();
    const cards = document.querySelectorAll(".festival-card");
    let visibleCount = 0;

    cards.forEach(card => {
        const text = (card.textContent || card.innerText).toLowerCase();
        const keywords = (card.getAttribute("data-keywords") || "").toLowerCase();
        const fullContent = text + " " + keywords;

        if (fullContent.indexOf(filter) > -1) {
            card.style.display = "flex";
            visibleCount++;
        } else {
            card.style.display = "none";
        }
    });

    const noResults = document.getElementById("noResultsMsg");
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? "block" : "none";
    }
}

// 2. Table Filter Function
function filterTable() {
    const input = document.getElementById("tableSearch");
    if (!input) return;

    const filter = input.value.toLowerCase().trim();
    const table = document.getElementById("eventsTable");
    if (!table) return;

    const rows = table.getElementsByTagName("tbody")[0]?.getElementsByTagName("tr") || [];

    for (let i = 0; i < rows.length; i++) {
        const rowText = rows[i].textContent || rows[i].innerText;
        rows[i].style.display = (rowText.toLowerCase().indexOf(filter) > -1) ? "" : "none";
    }
}

// 3. Highlight Next Upcoming Event
function initUpcomingEvents() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const cards = document.querySelectorAll(".festival-card");
    let foundUpcoming = false;

    cards.forEach(card => {
        const eventDate = card.getAttribute("data-date");
        if (!eventDate) return;

        if (!foundUpcoming && eventDate >= todayStr) {
            card.classList.add("upcoming-next");
            
            const cardTop = card.querySelector(".card-top");
            if (cardTop && !cardTop.querySelector(".upcoming-badge")) {
                const badge = document.createElement("span");
                badge.className = "upcoming-badge";
                badge.innerHTML = "🌟 ಮುಂದಿನ ಉತ್ಸವ ";
                cardTop.appendChild(badge);
            }

            foundUpcoming = true;

            setTimeout(() => {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        } else if (eventDate < todayStr) {
            card.classList.add("past-event");
        }
    });
}

// Initialize listeners and highlight on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    initUpcomingEvents();

    const cardSearchInput = document.getElementById("eventSearch");
    if (cardSearchInput) {
        cardSearchInput.addEventListener("input", filterCards);
    }

    const tableSearchInput = document.getElementById("tableSearch");
    if (tableSearchInput) {
        tableSearchInput.addEventListener("input", filterTable);
    }
});