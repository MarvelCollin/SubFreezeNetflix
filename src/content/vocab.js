(function () {
  const SF = window.__SubFreeze;
  const state = SF.state;

  SF.LANGS = [
    { code: 'id', name: 'Indonesian' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'th', name: 'Thai' },
    { code: 'vi', name: 'Vietnamese' }
  ];

  SF.savedWords = [];

  SF.loadWords = function () {
    try {
      const raw = localStorage.getItem('subfreeze-words');
      if (raw) SF.savedWords = JSON.parse(raw) || [];
    } catch (err) {}
  };

  SF.saveWords = function () {
    try {
      localStorage.setItem('subfreeze-words', JSON.stringify(SF.savedWords));
    } catch (err) {}
  };

  let reqId = 0;
  const pending = {};

  function requestTranslate(word) {
    return new Promise(function (resolve) {
      const id = ++reqId;
      pending[id] = resolve;
      window.postMessage({ __subfreeze: true, action: 'translate', id: id, word: word, tl: state.targetLang }, '*');
    });
  }

  window.addEventListener('message', function (e) {
    if (e.source !== window) return;
    const d = e.data;
    if (d && d.__subfreeze && d.action === 'translated' && pending[d.id]) {
      pending[d.id](d.translation || '');
      delete pending[d.id];
    }
  });

  function cleanWord(raw) {
    return raw.replace(/[^\p{L}\p{N}'-]/gu, ' ').replace(/\s+/g, ' ').trim();
  }

  SF.saveWord = function (raw) {
    const word = cleanWord(raw);
    if (!word) return;
    requestTranslate(word).then(function (translation) {
      SF.savedWords.unshift({ word: word, translation: translation, lang: state.targetLang, ts: Date.now() });
      SF.saveWords();
      SF.renderWordList();
      SF.showToast(word, translation);
    });
  };

  SF.attachWordHandler = function (el) {
    el.addEventListener('dblclick', function () {
      const sel = window.getSelection();
      const word = sel ? sel.toString() : '';
      if (word) SF.saveWord(word);
    });
  };

  SF.renderWordList = function () {
    const list = SF.ui.wordList;
    if (!list) return;
    list.textContent = '';
    if (!SF.savedWords.length) {
      const empty = document.createElement('div');
      empty.className = 'sf-word-empty';
      empty.textContent = 'Double-click a subtitle word to save it.';
      list.appendChild(empty);
      return;
    }
    SF.savedWords.forEach(function (entry, idx) {
      const row = document.createElement('div');
      row.className = 'sf-word';

      const txt = document.createElement('div');
      txt.className = 'sf-word-text';
      const w = document.createElement('span');
      w.className = 'sf-word-w';
      w.textContent = entry.word;
      const t = document.createElement('span');
      t.className = 'sf-word-t';
      t.textContent = entry.translation || '...';
      txt.appendChild(w);
      txt.appendChild(t);

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'sf-word-del';
      del.textContent = '×';
      del.addEventListener('click', function () {
        SF.savedWords.splice(idx, 1);
        SF.saveWords();
        SF.renderWordList();
      });

      row.appendChild(txt);
      row.appendChild(del);
      list.appendChild(row);
    });
  };

  let toastEl = null;
  let toastTimer = 0;

  SF.showToast = function (word, translation) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'sf-toast';
    }
    toastEl.textContent = '';
    const check = document.createElement('span');
    check.className = 'sf-toast-check';
    check.textContent = '✓';
    const label = document.createElement('span');
    label.textContent = ' Saved: ' + word + (translation ? '  →  ' + translation : '');
    toastEl.appendChild(check);
    toastEl.appendChild(label);

    const target = document.fullscreenElement || document.body;
    if (toastEl.parentElement !== target) target.appendChild(toastEl);

    void toastEl.offsetWidth;
    toastEl.classList.add('sf-toast-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('sf-toast-show');
    }, 2500);
  };

  let fcOverlay = null;
  let fcIndex = 0;
  let fcFlipped = false;

  SF.openFlashCards = function () {
    if (!SF.savedWords.length) {
      SF.showToast('No words saved yet', '');
      return;
    }
    fcIndex = 0;
    fcFlipped = false;
    renderFlashCard();
  };

  function renderFlashCard() {
    if (!fcOverlay) {
      fcOverlay = document.createElement('div');
      fcOverlay.className = 'sf-fc-overlay';
    }

    const total = SF.savedWords.length;
    const entry = SF.savedWords[fcIndex];

    fcOverlay.textContent = '';

    const container = document.createElement('div');
    container.className = 'sf-fc-container';

    const header = document.createElement('div');
    header.className = 'sf-fc-header';

    const title = document.createElement('span');
    title.textContent = 'Flash Cards';

    const counter = document.createElement('span');
    counter.textContent = (fcIndex + 1) + ' / ' + total;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sf-fc-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', function () {
      fcOverlay.remove();
    });

    header.appendChild(title);
    header.appendChild(counter);
    header.appendChild(closeBtn);

    const card = document.createElement('div');
    card.className = 'sf-fc-card';
    if (fcFlipped) card.classList.add('sf-fc-flipped');

    const front = document.createElement('div');
    front.className = 'sf-fc-front';
    front.textContent = entry.word;

    const back = document.createElement('div');
    back.className = 'sf-fc-back';
    back.textContent = entry.translation || '(no translation)';

    card.appendChild(front);
    card.appendChild(back);

    card.addEventListener('click', function () {
      fcFlipped = !fcFlipped;
      card.classList.toggle('sf-fc-flipped');
    });

    const nav = document.createElement('div');
    nav.className = 'sf-fc-nav';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'sf-fc-prev';
    prevBtn.textContent = '← Prev';
    prevBtn.addEventListener('click', function () {
      if (fcIndex > 0) {
        fcIndex--;
        fcFlipped = false;
        renderFlashCard();
      }
    });

    const flipBtn = document.createElement('button');
    flipBtn.type = 'button';
    flipBtn.className = 'sf-fc-flip';
    flipBtn.textContent = 'Flip';
    flipBtn.addEventListener('click', function () {
      fcFlipped = !fcFlipped;
      card.classList.toggle('sf-fc-flipped');
    });

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'sf-fc-next';
    nextBtn.textContent = 'Next →';
    nextBtn.addEventListener('click', function () {
      if (fcIndex < total - 1) {
        fcIndex++;
        fcFlipped = false;
        renderFlashCard();
      }
    });

    nav.appendChild(prevBtn);
    nav.appendChild(flipBtn);
    nav.appendChild(nextBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'sf-fc-delete';
    deleteBtn.textContent = 'Remove this word';
    deleteBtn.addEventListener('click', function () {
      SF.savedWords.splice(fcIndex, 1);
      SF.saveWords();
      SF.renderWordList();
      if (!SF.savedWords.length) {
        fcOverlay.remove();
        return;
      }
      if (fcIndex >= SF.savedWords.length) fcIndex = SF.savedWords.length - 1;
      fcFlipped = false;
      renderFlashCard();
    });

    container.appendChild(header);
    container.appendChild(card);
    container.appendChild(nav);
    container.appendChild(deleteBtn);
    fcOverlay.appendChild(container);

    const target = document.fullscreenElement || document.body;
    if (fcOverlay.parentElement !== target) target.appendChild(fcOverlay);
  }
})();
