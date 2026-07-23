/**
 * Lightweight Cookie Consent Banner for Google AdSense & GDPR Compliance
 */
(function() {
    if (localStorage.getItem('npl_cookie_consent') === 'accepted') {
        return;
    }

    document.addEventListener('DOMContentLoaded', function() {
        var banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.style.cssText = 'position: fixed; bottom: 0; left: 0; right: 0; background: #111827; color: #d1d5db; padding: 1rem 1.5rem; z-index: 9999; border-top: 2px solid #06b6d4; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; font-family: sans-serif; box-shadow: 0 -4px 15px rgba(0,0,0,0.5);';
        
        banner.innerHTML = '<div style="flex: 1; min-width: 280px; font-size: 0.9rem; line-height: 1.4;">' +
            'We use cookies to personalize content, ads, and analyze website traffic in compliance with Google AdSense policy. By continuing to use our website, you agree to our <a href="/privacy-policy" style="color: #06b6d4; text-decoration: underline;">Privacy Policy</a> and <a href="/disclaimer" style="color: #06b6d4; text-decoration: underline;">Disclaimer</a>.' +
            '</div>' +
            '<div style="display: flex; gap: 0.75rem;">' +
            '<button id="accept-cookie-consent" style="background: #06b6d4; color: #ffffff; border: none; padding: 0.5rem 1.25rem; border-radius: 0.375rem; font-weight: bold; cursor: pointer; transition: background 0.2s;">Accept</button>' +
            '</div>';

        document.body.appendChild(banner);

        document.getElementById('accept-cookie-consent').addEventListener('click', function() {
            localStorage.setItem('npl_cookie_consent', 'accepted');
            banner.style.display = 'none';
        });
    });
})();
