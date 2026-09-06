function filterTable() {
    // 1. Get input element and search term
    const input = document.getElementById("tableSearch");
    const filter = input.value.toLowerCase().trim();
    
    // 2. Get table and all body rows
    const table = document.getElementById("eventsTable");
    const rows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr");

    // 3. Loop through rows and toggle display based on match
    for (let i = 0; i < rows.length; i++) {
        const rowText = rows[i].textContent || rows[i].innerText;
        
        if (rowText.toLowerCase().indexOf(filter) > -1) {
            rows[i].style.display = ""; // Show row
        } else {
            rows[i].style.display = "none"; // Hide row
        }
    }
}

function filterCards() {
    const input = document.getElementById("eventSearch");
    const filter = input.value.toLowerCase().trim();
    const cards = document.querySelectorAll(".festival-card");
    let visibleCount = 0;

    cards.forEach(card => {
        const text = (card.textContent || card.innerText).toLowerCase();
        const keywords = (card.getAttribute("data-keywords") || "").toLowerCase();
        const fullContent = text + " " + keywords;

        if (fullContent.indexOf(filter) > -1) {
            card.style.display = "flex"; // Restores flexbox layout
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
                badge.innerHTML = "🌟 ಮುಂದಿನ ಉತ್ಸವ / Next Event";
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

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUpcomingEvents);
} else {
    initUpcomingEvents();
}