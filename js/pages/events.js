/**
 * Events Page Logic
 * Fetches data/events.json, renders festival cards, and initializes search filter & upcoming highlight.
 */

import { filterCards, initUpcomingEvents } from '../modules/search-filter.js';

export async function loadEventsData() {
    const container = document.getElementById('eventsContainer');
    if (!container) return;

    try {
        const response = await fetch('../data/events.json');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const events = await response.json();
        container.innerHTML = '';

        events.forEach(event => {
            const article = document.createElement('article');
            article.className = 'festival-card';
            article.setAttribute('data-date', event.date || '');
            article.setAttribute('data-keywords', event.keywords || '');

            article.innerHTML = `
                <div class="date-badge">
                    <span class="day">${event.day || ''}</span>
                    <span class="month-year">${event.monthYear || ''}</span>
                </div>
                <div class="card-content">
                    <div class="card-top">
                        <h3 class="event-title">${event.title || ''}</h3>
                        <span class="tithi-tag">${event.tithi || ''}</span>
                    </div>
                    <div class="card-bottom">
                        <div class="sevadaara-info">
                            <span class="label"> ಸೇವಾದಾರರು:</span>
                            <span class="name">${event.sevadaarara || ''}</span>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(article);
        });

        initUpcomingEvents('.festival-card');

        filterCards({
            inputSelector: '#eventSearch',
            cardSelector: '.festival-card',
            noResultsSelector: '#noResultsMsg'
        });

    } catch (error) {
        console.error('Error loading events JSON:', error);
        container.innerHTML = `
            <div class="error-box">
                <p><strong>ಕಾರ್ಯಕ್ರಮದ ಮಾಹಿತಿಯನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.</strong></p>
                <p class="error-help">(ಫೈಲ್ ಮಾರ್ಗ <code>../data/events.json</code> ಸರಿಯಾಗಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ)</p>
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadEventsData();

    const searchInput = document.getElementById('eventSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterCards({
                inputSelector: '#eventSearch',
                cardSelector: '.festival-card',
                noResultsSelector: '#noResultsMsg'
            });
        });
    }
});
