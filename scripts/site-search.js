(() => {
  const input = document.querySelector('header .search-input');
  if (!input) return;
  const box = input.closest('.search-box');
  if (!box) return;
  const results = document.createElement('div');
  results.id = 'site-search-results';
  results.className = 'site-search-results';
  results.hidden = true;
  results.setAttribute('role', 'region');
  results.setAttribute('aria-label', 'Search results');
  results.setAttribute('aria-live', 'polite');
  box.appendChild(results);
  input.setAttribute('aria-label', 'Search site');
  input.setAttribute('aria-controls', results.id);
  input.setAttribute('autocomplete', 'off');
  input.type = 'search';
  let indexPromise;
  let version = 0;
  const close = () => { version++; results.hidden = true; };
  async function search() {
    const request = ++version;
    const query = input.value.trim().toLowerCase();
    if (query.length < 2) { results.hidden = true; return; }
    results.hidden = false;
    results.textContent = 'Searching…';
    try {
      indexPromise ||= fetch('/data/search-index.json').then(response => {
        if (!response.ok) throw new Error('Search unavailable');
        return response.json();
      }).catch(error => { indexPromise = null; throw error; });
      const entries = await indexPromise;
      if (request !== version) return;
      const words = query.split(/\s+/);
      const matches = entries.filter(entry => words.every(word => `${entry.title} ${entry.keywords}`.toLowerCase().includes(word)))
        .sort((a, b) => Number(b.title.toLowerCase().includes(query)) - Number(a.title.toLowerCase().includes(query)))
        .slice(0, 8);
      results.replaceChildren();
      if (!matches.length) results.textContent = 'No matching pages. Try a player, team, or topic.';
      for (const entry of matches) {
        if (!/^\/(?!\/)/.test(entry.url)) continue;
        const link = document.createElement('a');
        link.href = entry.url;
        link.textContent = entry.title;
        results.appendChild(link);
      }
    } catch {
      if (request === version) results.textContent = 'Search is unavailable. Please use the navigation links.';
    }
  }
  input.addEventListener('input', search);
  input.addEventListener('focus', search);
  box.addEventListener('keydown', event => {
    const links = [...results.querySelectorAll('a')];
    if (event.key === 'Escape') { input.focus(); close(); }
    if (!results.hidden && ['ArrowDown', 'ArrowUp'].includes(event.key) && links.length) {
      event.preventDefault();
      const current = links.indexOf(document.activeElement);
      const next = event.key === 'ArrowDown' ? (current + 1) % links.length : (current <= 0 ? links.length - 1 : current - 1);
      links[next].focus();
    }
    if (event.key === 'Enter' && event.target === input && !results.hidden && links.length) {
      event.preventDefault();
      links[0].click();
    }
  });
  box.addEventListener('focusout', event => { if (!box.contains(event.relatedTarget)) close(); });
  document.addEventListener('click', event => { if (!box.contains(event.target)) close(); });
})();
