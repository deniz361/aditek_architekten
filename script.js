(() => {
  'use strict';

  document.body.classList.add('js-ready');

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const watchMedia = (query, callback) => {
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', callback);
    } else if (typeof query.addListener === 'function') {
      query.addListener(callback);
    }
  };

  const focusDestination = (element) => {
    if (!element) return;
    const temporaryTabindex = !element.hasAttribute('tabindex');
    if (temporaryTabindex) element.setAttribute('tabindex', '-1');
    element.focus({ preventScroll: true });
    if (temporaryTabindex) {
      element.addEventListener('blur', () => element.removeAttribute('tabindex'), { once: true });
    }
  };

  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (menuToggle && mobileNav) {
    const desktopViewport = window.matchMedia('(min-width: 651px)');
    const setMenuOpen = (open, restoreFocus = false) => {
      mobileNav.hidden = !open;
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      document.body.classList.toggle('menu-open', open);
      if (restoreFocus) menuToggle.focus();
    };

    setMenuOpen(false);
    menuToggle.addEventListener('click', () => {
      setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        setMenuOpen(false);
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          focusDestination(document.getElementById(href.slice(1)));
        }
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !mobileNav.hidden) setMenuOpen(false, true);
    });

    document.addEventListener('click', (event) => {
      if (!mobileNav.hidden && !mobileNav.contains(event.target) && !menuToggle.contains(event.target)) {
        setMenuOpen(false);
      }
    });

    watchMedia(desktopViewport, (event) => {
      if (event.matches) setMenuOpen(false);
    });
  }

  if ('IntersectionObserver' in window) {
    const navigationLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
    const navigationSections = navigationLinks.map((link) => ({
      link,
      section: document.getElementById(link.getAttribute('href').slice(1)),
    })).filter(({ section }) => section);
    const visibleSections = new Set();

    if (navigationSections.length) {
      const navigationObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleSections.add(entry.target);
          else visibleSections.delete(entry.target);
        });

        const current = navigationSections
          .filter(({ section }) => visibleSections.has(section))
          .sort((a, b) => Math.abs(a.section.getBoundingClientRect().top - window.innerHeight * 0.25)
            - Math.abs(b.section.getBoundingClientRect().top - window.innerHeight * 0.25))[0];

        navigationSections.forEach(({ link, section }) => {
          const active = Boolean(current && current.section === section);
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });

      navigationSections.forEach(({ section }) => navigationObserver.observe(section));
    }

    const revealElements = [...document.querySelectorAll('[data-reveal]')];
    if (!reducedMotion.matches && revealElements.length) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -24px 0px', threshold: 0.03 });

      revealElements.forEach((element) => {
        element.classList.add('reveal-ready');
        revealObserver.observe(element);
      });

      watchMedia(reducedMotion, (event) => {
        if (!event.matches) return;
        revealObserver.disconnect();
        revealElements.forEach((element) => element.classList.add('is-visible'));
      });
    }
  }

  const contactEmail = document.getElementById('contact-email');
  const contactInterest = document.getElementById('contact-interest');
  const setContactInterest = (interest) => {
    if (!contactEmail || !interest) return;
    contactEmail.href = `mailto:info@aditek.de?subject=${encodeURIComponent(`Projektanfrage – ${interest}`)}`;
    if (contactInterest) {
      contactInterest.hidden = false;
      contactInterest.textContent = `Ihr Thema: ${interest}`;
    }
  };

  document.querySelectorAll('[data-interest]').forEach((link) => {
    link.addEventListener('click', () => setContactInterest(link.dataset.interest));
  });

  const dialog = document.getElementById('project-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const dialogTitle = document.getElementById('dialog-title');
  const dialogMeta = document.getElementById('dialog-meta');
  const dialogDescription = document.getElementById('dialog-description');
  const dialogImage = document.getElementById('dialog-image');
  const dialogFacts = document.getElementById('dialog-facts');
  const dialogClose = dialog.querySelector('.dialog-close');
  const dialogContact = document.getElementById('dialog-contact');
  if (![dialogTitle, dialogMeta, dialogDescription, dialogImage, dialogFacts, dialogClose, dialogContact].every(Boolean)) return;

  const projects = new Map([
    ['effizienzhaus', {
      title: 'Substanz erhalten. Potenziale entfalten.',
      meta: 'BAUEN IM BESTAND · EINBLICK IN DIE UMSETZUNG',
      description: 'Die Referenzdokumentation von aditek zeigt ein Mehrfamilienhaus während der Bauphase. Das Projekt ist dort als Effizienzhaus geführt — ein Einblick in das Weiterbauen im Bestand.',
      image: 'assets/effizienzhaus.webp',
      alt: 'Mehrfamilienhaus mit Baugerüst während der Sanierung',
      facts: [['Projekt', 'Effizienzhaus'], ['Einblick', 'Bauphase']],
      interest: 'Energetische Sanierung',
    }],
    ['johanneswerkstrasse', {
      title: 'Neue Energie für ein Haus von 1932.',
      meta: 'JOHANNESWERKSTRASSE · BIELEFELD',
      description: 'Das Wohnhaus von 1932 wurde 2012 zu einem KfW-Effizienzhaus modernisiert. Das Maßnahmenpaket umfasste Dach, Fenster, Fassade, Kellerdecke und Heizung einschließlich Fernwärme.',
      image: 'assets/johanneswerkstrasse.webp',
      alt: 'Modernisiertes Bielefelder Wohnhaus in der Johanneswerkstraße',
      facts: [['Baujahr', '1932'], ['Modernisierung', '2012'], ['Standort', 'Bielefeld']],
      interest: 'Sanierung wie beim Projekt Johanneswerkstraße',
    }],
    ['modernisierung', {
      title: 'Ein neues Kapitel für ein Haus von 1936.',
      meta: 'ENERGETISCHE MODERNISIERUNG · BIELEFELD',
      description: 'Das Bielefelder Wohnhaus aus dem Jahr 1936 wurde 2014 zu einem KfW-Effizienzhaus modernisiert. Neben Dach, Fenstern, Fassade und Kellerdecke wurden die Heizung mit Fernwärme und eine Lüftungsanlage in das Konzept einbezogen.',
      image: 'assets/modernisierung.webp',
      alt: 'Energetisch modernisiertes Wohnhaus von 1936 in Bielefeld',
      facts: [['Baujahr', '1936'], ['Modernisierung', '2014'], ['Standort', 'Bielefeld']],
      interest: 'Modernisierung wie beim Projekt von 2014',
    }],
  ]);

  let lastProjectTrigger = null;
  let currentProject = null;
  let contactRequested = false;
  let backdropPressed = false;

  const openProject = (key, trigger) => {
    const project = projects.get(key);
    if (!project) return;
    currentProject = project;
    lastProjectTrigger = trigger || document.activeElement;
    contactRequested = false;
    dialogTitle.textContent = project.title;
    dialogMeta.textContent = project.meta;
    dialogDescription.textContent = project.description;
    dialogImage.src = project.image;
    dialogImage.alt = project.alt;
    dialogFacts.replaceChildren();
    project.facts.forEach(([label, value]) => {
      const fact = document.createElement('div');
      const name = document.createElement('span');
      const content = document.createElement('strong');
      name.textContent = label;
      content.textContent = value;
      fact.append(name, content);
      dialogFacts.append(fact);
    });
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('dialog-open');
    dialogClose.focus({ preventScroll: true });
  };

  dialog.setAttribute('aria-describedby', 'dialog-description');
  document.querySelectorAll('[data-project]').forEach((link) => {
    if (!projects.has(link.dataset.project)) return;
    link.setAttribute('aria-haspopup', 'dialog');
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openProject(link.dataset.project, link);
    });
  });

  const projectFallbacks = document.getElementById('project-fallbacks');
  if (projectFallbacks) projectFallbacks.hidden = true;

  dialogClose.addEventListener('click', () => dialog.close());
  const outsideDialog = (event) => {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  dialog.addEventListener('pointerdown', (event) => {
    backdropPressed = event.target === dialog && outsideDialog(event);
  });
  dialog.addEventListener('click', (event) => {
    if (backdropPressed && event.target === dialog && outsideDialog(event)) dialog.close();
    backdropPressed = false;
  });

  dialogContact.addEventListener('click', (event) => {
    event.preventDefault();
    if (currentProject) setContactInterest(currentProject.interest);
    contactRequested = true;
    dialog.close();
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (contactRequested) {
      window.location.hash = 'kontakt';
      focusDestination(document.getElementById('contact-title'));
      contactRequested = false;
    } else if (lastProjectTrigger && lastProjectTrigger.isConnected) {
      lastProjectTrigger.focus({ preventScroll: true });
    }
  });

  const openProjectHash = () => {
    const key = window.location.hash.slice(1).replace(/^projekt-/, '');
    if (!window.location.hash.startsWith('#projekt-') || !projects.has(key)) return;
    const trigger = [...document.querySelectorAll('[data-project]')].find((link) => link.dataset.project === key);
    openProject(key, trigger);
  };
  window.addEventListener('hashchange', openProjectHash);
  openProjectHash();
})();
