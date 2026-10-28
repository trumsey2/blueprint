document.documentElement.classList.remove('no-js');

document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- Nav: scrolled state, hide on scroll down ----------
    const nav = document.querySelector('.nav');
    const actionBar = document.querySelector('.action-bar');
    let lastY = window.scrollY;

    const onScroll = () => {
        const y = window.scrollY;
        if (nav) {
            nav.classList.toggle('is-scrolled', y > 24);
            const menuOpen = document.body.classList.contains('menu-open');
            nav.classList.toggle('is-hidden', !menuOpen && y > 400 && y > lastY + 4);
            if (y < lastY - 4) nav.classList.remove('is-hidden');
        }
        if (actionBar) {
            const nearBooking = document.querySelector('#book')?.getBoundingClientRect().top < window.innerHeight * 0.8;
            actionBar.classList.toggle('is-visible', y > window.innerHeight * 0.7 && !nearBooking);
        }
        lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ---------- Mobile menu ----------
    const burger = document.querySelector('.burger');
    const menu = document.querySelector('.menu');
    const setMenu = (open) => {
        document.body.classList.toggle('menu-open', open);
        burger?.setAttribute('aria-expanded', String(open));
        burger?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        menu?.setAttribute('aria-hidden', String(!open));
        if (open) nav?.classList.remove('is-hidden');
    };
    burger?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
    menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
    });

    // ---------- Reveal on scroll ----------
    const revealEls = document.querySelectorAll('.reveal, .reveal-stagger, .clip-reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-in');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
        revealEls.forEach(el => io.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('is-in'));
    }

    // ---------- Statement: words light up as you scroll ----------
    const statement = document.querySelector('[data-words]');
    if (statement) {
        const accents = (statement.dataset.accent || '').split(',').map(s => s.trim().toLowerCase());
        const words = statement.textContent.trim().split(/\s+/);
        statement.innerHTML = words.map(w => {
            const clean = w.replace(/[^\w']/g, '').toLowerCase();
            return `<span class="w${accents.includes(clean) ? ' accent' : ''}">${w}</span>`;
        }).join(' ');
        const spans = statement.querySelectorAll('.w');
        const lightWords = () => {
            const r = statement.getBoundingClientRect();
            const vh = window.innerHeight;
            const progress = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
            const lit = Math.round(progress * spans.length);
            spans.forEach((s, i) => s.classList.toggle('is-lit', i < lit));
        };
        if (reduceMotion) spans.forEach(s => s.classList.add('is-lit'));
        else {
            window.addEventListener('scroll', lightWords, { passive: true });
            lightWords();
        }
    }

    // ---------- Count-up numbers ----------
    const counters = document.querySelectorAll('[data-count]');
    if (counters.length && 'IntersectionObserver' in window) {
        const co = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const target = parseInt(el.dataset.count, 10);
                co.unobserve(el);
                if (reduceMotion) { el.textContent = target; return; }
                const start = performance.now();
                const dur = 1400;
                const tick = (now) => {
                    const t = Math.min(1, (now - start) / dur);
                    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
                    if (t < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            });
        }, { threshold: 0.6 });
        counters.forEach(c => co.observe(c));
    }

    // ---------- Before / after compare ----------
    const compare = document.querySelector('.compare');
    if (compare) {
        const range = compare.querySelector('.compare__range');
        const imgs = compare.querySelectorAll('.compare__img');
        const tabs = document.querySelectorAll('.ba__tab');
        const setPos = (v) => compare.style.setProperty('--pos', `${v}%`);
        range.addEventListener('input', () => setPos(range.value));

        const loadCase = (tab) => {
            tabs.forEach(t => {
                t.setAttribute('aria-selected', String(t === tab));
                t.tabIndex = t === tab ? 0 : -1;
            });
            imgs.forEach(i => { i.style.opacity = 0; });
            const srcs = [tab.dataset.before, tab.dataset.after];
            let loaded = 0;
            srcs.forEach(src => {
                const pre = new Image();
                pre.onload = () => {
                    if (++loaded < srcs.length) return;
                    imgs.forEach((img, i) => {
                        img.style.backgroundImage = `url("${srcs[i]}")`;
                        img.style.opacity = 1;
                    });
                };
                pre.src = src;
            });
            range.value = 50;
            setPos(50);
        };
        tabs.forEach((tab, idx) => {
            tab.addEventListener('click', () => loadCase(tab));
            tab.addEventListener('keydown', (e) => {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                const next = tabs[(idx + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
                next.focus();
                loadCase(next);
            });
        });

        // Gentle hint sweep the first time it scrolls into view
        if (!reduceMotion && 'IntersectionObserver' in window) {
            const ho = new IntersectionObserver((entries) => {
                if (!entries[0].isIntersecting) return;
                ho.disconnect();
                const start = performance.now();
                const sweep = (now) => {
                    const t = Math.min(1, (now - start) / 1600);
                    const v = 50 + Math.sin(t * Math.PI * 2) * 22 * (1 - t);
                    range.value = v;
                    setPos(v);
                    if (t < 1) requestAnimationFrame(sweep);
                };
                requestAnimationFrame(sweep);
            }, { threshold: 0.6 });
            ho.observe(compare);
        }
    }

    // ---------- Process rail progress ----------
    const process = document.querySelector('.process');
    if (process) {
        const steps = process.querySelectorAll('.step');
        const updateRail = () => {
            const r = process.getBoundingClientRect();
            const vh = window.innerHeight;
            const p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / (r.height + vh * 0.1)));
            process.style.setProperty('--progress', `${p * 100}%`);
            steps.forEach((s, i) => s.classList.toggle('is-active', p >= i / steps.length + 0.02 || p === 1));
        };
        window.addEventListener('scroll', updateRail, { passive: true });
        window.addEventListener('resize', updateRail);
        updateRail();
    }

    // ---------- Gallery lightbox ----------
    const items = Array.from(document.querySelectorAll('.gallery__item'));
    const lightbox = document.querySelector('.lightbox');
    if (items.length && lightbox) {
        const lbImg = lightbox.querySelector('img');
        const count = lightbox.querySelector('.lightbox__count');
        let current = 0;
        let lastFocus = null;
        const show = (i) => {
            current = (i + items.length) % items.length;
            const img = items[current].querySelector('img');
            lbImg.src = items[current].dataset.full || img.src;
            lbImg.alt = img.alt;
            count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
        };
        const open = (i) => {
            lastFocus = document.activeElement;
            show(i);
            lightbox.classList.add('is-open');
            lightbox.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            lightbox.querySelector('.lightbox__close').focus();
        };
        const close = () => {
            lightbox.classList.remove('is-open');
            lightbox.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            lastFocus?.focus();
        };
        items.forEach((item, i) => item.addEventListener('click', () => open(i)));
        lightbox.querySelector('.lightbox__close').addEventListener('click', close);
        lightbox.querySelector('.lightbox__prev').addEventListener('click', () => show(current - 1));
        lightbox.querySelector('.lightbox__next').addEventListener('click', () => show(current + 1));
        lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('is-open')) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowRight') show(current + 1);
            if (e.key === 'ArrowLeft') show(current - 1);
        });
        let touchX = null;
        lightbox.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
        lightbox.addEventListener('touchend', (e) => {
            if (touchX === null) return;
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
            touchX = null;
        });
    }

    // ---------- PPF coverage packages ----------
    const packages = document.querySelectorAll('.package');
    const zones = document.querySelectorAll('.zone');
    if (packages.length && zones.length) {
        const select = (pkg) => {
            packages.forEach(p => p.setAttribute('aria-pressed', String(p === pkg)));
            const on = (pkg.dataset.zones || '').split(',');
            zones.forEach(z => z.classList.toggle('is-on', on.includes('all') || on.includes(z.dataset.zone)));
        };
        packages.forEach(p => p.addEventListener('click', () => select(p)));
        select(document.querySelector('.package[aria-pressed="true"]') || packages[0]);
    }

    // ---------- Open / closed badge (Central Time, Mon–Fri 9–5) ----------
    const badge = document.querySelector('.open-badge');
    if (badge) {
        try {
            const parts = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', hour12: false
            }).formatToParts(new Date());
            const day = parts.find(p => p.type === 'weekday').value;
            const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
            const open = !['Sat', 'Sun'].includes(day) && hour >= 9 && hour < 17;
            badge.classList.toggle('is-open', open);
            badge.textContent = open ? 'Open now' : 'Closed now';
        } catch (e) {
            badge.remove();
        }
    }

    // ---------- Copy email ----------
    document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => {
            const note = btn.querySelector('.info__note');
            navigator.clipboard?.writeText(btn.dataset.copy).then(() => {
                if (note) note.textContent = 'Copied to clipboard ✓';
                setTimeout(() => { if (note) note.textContent = 'Tap to copy'; }, 2000);
            }).catch(() => {
                window.location.href = `mailto:${btn.dataset.copy}`;
            });
        });
    });

    // ---------- Hero video: pause when offscreen ----------
    const video = document.querySelector('.hero video');
    if (video) {
        if (reduceMotion) video.pause();
        else if ('IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) video.play().catch(() => {});
                else video.pause();
            }).observe(video);
        }
    }

    // ---------- Magnetic buttons (fine pointers only) ----------
    if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
        document.querySelectorAll('[data-magnetic]').forEach(el => {
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - r.left - r.width / 2) * 0.25;
                const y = (e.clientY - r.top - r.height / 2) * 0.35;
                el.style.transform = `translate(${x}px, ${y}px)`;
            });
            el.addEventListener('pointerleave', () => { el.style.transform = ''; });
        });
    }

    // ---------- Jump back: return to where you were after an anchor link ----------
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'jump-back';
    backBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M12 19V5M5 12l7-7 7 7"/></svg><span>Back to where you were</span>';
    document.body.appendChild(backBtn);

    let returnY = null;
    let armed = false;
    let armTimer;
    const hideBack = () => {
        backBtn.classList.remove('is-visible');
        returnY = null;
        armed = false;
    };

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        if (link.classList.contains('skip-link')) return;
        link.addEventListener('click', () => {
            const target = document.querySelector(link.getAttribute('href'));
            if (!target) return;
            const fromY = window.scrollY;
            const toY = target.getBoundingClientRect().top + fromY;
            if (Math.abs(toY - fromY) < 400) return;
            returnY = fromY;
            backBtn.classList.toggle('is-down', returnY > toY);
            backBtn.classList.add('is-visible');
            // Ignore the scroll caused by the jump itself before watching for a manual return
            armed = false;
            clearTimeout(armTimer);
            armTimer = setTimeout(() => { armed = true; }, 1200);
        });
    });

    backBtn.addEventListener('click', () => {
        if (returnY === null) return;
        window.scrollTo({ top: returnY, behavior: reduceMotion ? 'auto' : 'smooth' });
        hideBack();
    });

    window.addEventListener('scroll', () => {
        if (armed && returnY !== null && Math.abs(window.scrollY - returnY) < 200) hideBack();
    }, { passive: true });

    // ---------- Footer year ----------
    document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
});
