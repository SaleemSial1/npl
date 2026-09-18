function buildContactDraft(values) {
    const recipient = values.category === 'partnership'
        ? 'partnerships@nplcricketleague.com'
        : ['technical', 'feedback'].includes(values.category)
            ? 'admin@nplcricketleague.com' : 'info@nplcricketleague.com';
    const body = `Name: ${values.name}\nReply email: ${values.email}\nCategory: ${values.category}\n\n${values.message}`;
    return `mailto:${recipient}?subject=${encodeURIComponent(values.subject)}&body=${encodeURIComponent(body)}`;
}

if (typeof module !== 'undefined') module.exports = { buildContactDraft };

if (typeof document !== 'undefined') {
    const form = document.querySelector('.contact-form');
    const draft = document.getElementById('contact-draft');
    const status = document.getElementById('contact-status');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        draft.href = buildContactDraft(Object.fromEntries(new FormData(form)));
        draft.hidden = false;
        status.textContent = 'Your draft is ready. Open it in your email app, review it, and send it there. Nothing has been sent yet.';
    });
    form.addEventListener('input', () => {
        draft.hidden = true;
        draft.removeAttribute('href');
        status.textContent = '';
    });
}
