/**
 * Entry point.
 *   - URL with a #    → reveal screen (participant)
 *   - URL without #   → organizer screens
 */

import { selfTest } from './selftest.js';
import { startOrganizer } from './ui/organizer.js';
import { startReveal } from './ui/reveal.js';

// Available from the browser console: selfTest()
window.selfTest = selfTest;

// If we got here the modules loaded: remove the boot warning.
document.getElementById('boot-warning')?.remove();

if (window.location.hash.length > 1) startReveal(window.location.hash);
else startOrganizer();

// If the fragment changes in the same tab (e.g. another link pasted), reload into the right screen.
window.addEventListener('hashchange', () => window.location.reload());
