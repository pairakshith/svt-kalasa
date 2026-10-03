/**
 * SVT Kalasa main.js - Entrypoint & Backwards Compatibility Layer
 * Re-exports core modules and initializes search filters and upcoming events if elements are present.
 */

import { filterCards, filterTable, initUpcomingEvents } from './modules/search-filter.js';
import './modules/audio-player.js';
import './core/layout-loader.js';

export { filterCards, filterTable, initUpcomingEvents };

document.addEventListener('DOMContentLoaded', () => {
    initUpcomingEvents();

    const cardSearchInput = document.getElementById('eventSearch');
    if (cardSearchInput) {
        cardSearchInput.addEventListener('input', () => filterCards());
    }

    const tableSearchInput = document.getElementById('tableSearch');
    if (tableSearchInput) {
        tableSearchInput.addEventListener('input', () => filterTable());
    }
});
