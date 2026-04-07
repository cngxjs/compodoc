/**
 * "On this page" Table of Contents with ScrollSpy.
 * Generates a right-side sticky nav from h3 headings in the info tab panel.
 * Active section indicator glides via transform: translateY().
 */

const TOC_CONTAINER_ID = 'cdx-toc';

const buildToc = () => {
    // Remove existing ToC
    document.getElementById(TOC_CONTAINER_ID)?.remove();

    // Only show on entity detail pages (pages with tabs)
    const infoPanel = document.querySelector('.cdx-tab-panel#info.active, .cdx-tab-panel#info');
    if (!infoPanel) return;

    // Collect h3 headings with text content
    const headings = Array.from(infoPanel.querySelectorAll<HTMLHeadingElement>('h3'));
    if (headings.length < 2) return;

    // Ensure headings have IDs for anchor links
    headings.forEach((h, i) => {
        if (!h.id) {
            h.id = `section-${h.textContent?.trim().toLowerCase().replace(/\s+/g, '-') ?? i}`;
        }
    });

    // Build ToC element
    const nav = document.createElement('nav');
    nav.id = TOC_CONTAINER_ID;
    nav.className = 'cdx-toc';
    nav.setAttribute('aria-label', 'On this page');

    const title = document.createElement('p');
    title.className = 'cdx-toc-title';
    title.textContent = 'On this page';
    nav.appendChild(title);

    const indicator = document.createElement('span');
    indicator.className = 'cdx-toc-indicator';
    indicator.setAttribute('aria-hidden', 'true');

    const list = document.createElement('ul');
    list.appendChild(indicator);
    headings.forEach(h => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${h.id}`;
        a.textContent = h.textContent?.trim() ?? '';
        a.addEventListener('click', (e) => {
            e.preventDefault();
            h.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState(null, '', `#${h.id}`);
        });
        li.appendChild(a);
        list.appendChild(li);
    });
    nav.appendChild(list);

    // Insert as first child so it appears at top on narrow screens
    const contentData = document.querySelector('.content-data');
    if (!contentData) return;
    contentData.prepend(nav);

    // ScrollSpy: observe headings
    const links = Array.from(list.querySelectorAll('a'));
    let activeIndex = 0;

    const updateIndicator = (index: number) => {
        if (index === activeIndex && links[index]?.classList.contains('active')) return;
        activeIndex = index;
        links.forEach(l => l.classList.remove('active'));
        if (links[index]) {
            links[index].classList.add('active');
            const li = links[index].parentElement!;
            const listTop = list.getBoundingClientRect().top;
            const liTop = li.getBoundingClientRect().top;
            indicator.style.transform = `translateY(${liTop - listTop}px)`;
            indicator.style.height = `${li.offsetHeight}px`;
            indicator.style.opacity = '1';
        }
    };

    const scrollContainer = document.querySelector('.content') as HTMLElement;
    if (!scrollContainer) return;

    const onScroll = () => {
        let current = 0;
        for (let i = headings.length - 1; i >= 0; i--) {
            const rect = headings[i].getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();
            if (rect.top - containerRect.top <= 100) {
                current = i;
                break;
            }
        }
        updateIndicator(current);
    };

    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    requestAnimationFrame(() => updateIndicator(0));
};

export const initToc = () => {
    buildToc();
};
