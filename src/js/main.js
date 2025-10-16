document.addEventListener("DOMContentLoaded", () => {
  let currentLanguage = localStorage.getItem('language') || 'es';
  let translations = {};

  const includeHTML = (el, url) => {
    if (!el) return Promise.resolve();
    return fetch(url)
      .then((response) => response.text())
      .then((data) => { el.innerHTML = data; })
      .catch((error) => console.error(`Error loading ${url}:`, error));
  };

  const translatePage = () => {
    document.querySelectorAll('[data-translate]').forEach(el => {
      const key = el.dataset.translate;
      if (translations[key]) {
        el.innerHTML = translations[key];
      }
    });
    document.querySelector('.lang-btn[data-lang="es"]').classList.toggle('text-white', currentLanguage === 'es');
    document.querySelector('.lang-btn[data-lang="en"]').classList.toggle('text-white', currentLanguage === 'en');
  };

  
  const transitionTo = (url) => {
    const pageContent = document.getElementById('page-content');
    if (!pageContent) return;

    pageContent.classList.add('is-leaving');

    pageContent.addEventListener('animationend', () => {
      fetch(url)
        .then(response => response.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const newContent = doc.getElementById('page-content');

          if (newContent) {
            pageContent.innerHTML = newContent.innerHTML;
            document.title = doc.title;
            
            history.pushState({}, doc.title, url);

            pageContent.classList.remove('is-leaving');

            translatePage();
          }
        });
    }, { once: true }); 
  };

  const initApp = () => {
    document.body.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.host === window.location.host && !link.pathname.includes('#') && link.target !== '_blank') {
        e.preventDefault();
        transitionTo(link.href);
      }
    });
    window.addEventListener('popstate', () => { window.location.reload(); });
  };
  
  const loadLanguage = async (lang) => {
    const response = await fetch(`./src/lang/${lang}.json`);
    translations = await response.json();
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    translatePage();
  };

  Promise.all([
    includeHTML(document.querySelector('header[data-include]'), './src/components/header.html'),
    includeHTML(document.querySelector('footer[data-include]'), './src/components/footer.html')
  ]).then(() => {
    initApp();
    loadLanguage(currentLanguage);

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        loadLanguage(e.target.dataset.lang);
      });
    });
  });
});
