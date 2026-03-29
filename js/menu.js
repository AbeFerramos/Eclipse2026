(() => {
    const header = document.querySelector('.site-header');
    const button = document.querySelector('.menu-toggle');
    const nav = document.getElementById('site-nav');

    if (!header || !button || !nav) {
        return;
    }

    const closeMenu = () => {
        header.classList.remove('menu-open');
        button.setAttribute('aria-expanded', 'false');
    };

    button.addEventListener('click', () => {
        const isOpen = header.classList.toggle('menu-open');
        button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 760) {
            closeMenu();
        }
    });
})();
