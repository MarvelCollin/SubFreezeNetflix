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

  SF.showConfirmModal = function (title, message, onConfirm) {
    var modal = document.createElement('div');
    modal.className = 'sf-confirm-overlay';

    var box = document.createElement('div');
    box.className = 'sf-confirm-box';

    var titleEl = document.createElement('div');
    titleEl.className = 'sf-confirm-title';
    titleEl.textContent = title;

    var msgEl = document.createElement('div');
    msgEl.className = 'sf-confirm-msg';
    msgEl.textContent = message;

    var actions = document.createElement('div');
    actions.className = 'sf-confirm-actions';

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'sf-confirm-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', function () {
      modal.remove();
    });

    var confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.className = 'sf-confirm-yes';
    confirmBtn.textContent = 'Yes, Clear';
    confirmBtn.addEventListener('click', function () {
      modal.remove();
      onConfirm();
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    box.appendChild(titleEl);
    box.appendChild(msgEl);
    box.appendChild(actions);
    modal.appendChild(box);

    var target = document.fullscreenElement || document.body;
    target.appendChild(modal);
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

    const cardInner = document.createElement('div');
    cardInner.className = 'sf-fc-card-inner';

    const front = document.createElement('div');
    front.className = 'sf-fc-front';
    front.textContent = entry.word;

    const back = document.createElement('div');
    back.className = 'sf-fc-back';
    back.textContent = entry.translation || '(no translation)';

    cardInner.appendChild(front);
    cardInner.appendChild(back);
    card.appendChild(cardInner);

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

    const actions = document.createElement('div');
    actions.className = 'sf-fc-actions';

    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 'sf-fc-export';
    exportBtn.textContent = 'Export to Anki';
    exportBtn.addEventListener('click', function () {
      SF.exportAnki();
    });

    actions.appendChild(deleteBtn);
    actions.appendChild(exportBtn);

    container.appendChild(header);
    container.appendChild(card);
    container.appendChild(nav);
    container.appendChild(actions);
    fcOverlay.appendChild(container);

    const target = document.fullscreenElement || document.body;
    if (fcOverlay.parentElement !== target) target.appendChild(fcOverlay);
  }

  SF.exportAnki = function () {
    if (!SF.savedWords.length) return;
    var lines = SF.savedWords.map(function (entry) {
      var w = entry.word.replace(/\t/g, ' ');
      var t = (entry.translation || '').replace(/\t/g, ' ');
      return w + '\t' + t;
    });
    var content = lines.join('\n');
    var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'subfreeze-anki-' + new Date().toISOString().slice(0, 10) + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    SF.showToast('Exported ' + SF.savedWords.length + ' cards', '');
  };

  SF.quizStats = {};

  SF.loadQuizStats = function () {
    try {
      var raw = localStorage.getItem('subfreeze-quiz-stats');
      if (raw) SF.quizStats = JSON.parse(raw) || {};
    } catch (err) {}
  };

  SF.saveQuizStats = function () {
    try {
      localStorage.setItem('subfreeze-quiz-stats', JSON.stringify(SF.quizStats));
    } catch (err) {}
  };

  SF.loadQuizStats();

  function getWordStats(word) {
    if (!SF.quizStats[word]) {
      SF.quizStats[word] = { correct: 0, wrong: 0, streak: 0, lastSeen: 0 };
    }
    return SF.quizStats[word];
  }

  var quizOverlay = null;
  var quizQueue = [];
  var quizCurrent = 0;
  var quizScore = 0;
  var quizTotal = 0;
  var quizAnswered = false;

  SF.openQuiz = function () {
    var pool = SF.savedWords.filter(function (e) { return e.translation; });
    if (pool.length < 4) {
      SF.showToast('Need at least 4 translated words', '');
      return;
    }
    quizQueue = shuffle(pool.slice()).slice(0, Math.min(10, pool.length));
    quizCurrent = 0;
    quizScore = 0;
    quizTotal = quizQueue.length;
    quizAnswered = false;
    renderQuiz();
  };

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function pickChoices(correct, pool) {
    var choices = [correct.translation];
    var others = pool.filter(function (e) { return e.word !== correct.word && e.translation; });
    others = shuffle(others);
    for (var i = 0; i < others.length && choices.length < 4; i++) {
      if (choices.indexOf(others[i].translation) === -1) {
        choices.push(others[i].translation);
      }
    }
    return shuffle(choices);
  }

  function renderQuiz() {
    if (!quizOverlay) {
      quizOverlay = document.createElement('div');
      quizOverlay.className = 'sf-quiz-overlay';
    }
    quizOverlay.textContent = '';

    if (quizCurrent >= quizTotal) {
      renderQuizResults();
      return;
    }

    var entry = quizQueue[quizCurrent];
    var choices = pickChoices(entry, SF.savedWords.filter(function (e) { return e.translation; }));
    quizAnswered = false;

    var container = document.createElement('div');
    container.className = 'sf-quiz-container';

    var header = document.createElement('div');
    header.className = 'sf-quiz-header';

    var title = document.createElement('span');
    title.textContent = 'Quiz';

    var progress = document.createElement('span');
    progress.textContent = (quizCurrent + 1) + ' / ' + quizTotal;

    var scoreEl = document.createElement('span');
    scoreEl.className = 'sf-quiz-score';
    scoreEl.textContent = quizScore + ' correct';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sf-quiz-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', function () {
      quizOverlay.remove();
    });

    header.appendChild(title);
    header.appendChild(progress);
    header.appendChild(scoreEl);
    header.appendChild(closeBtn);

    var prompt = document.createElement('div');
    prompt.className = 'sf-quiz-prompt';

    var promptLabel = document.createElement('div');
    promptLabel.className = 'sf-quiz-prompt-label';
    promptLabel.textContent = 'What does this mean?';

    var promptWord = document.createElement('div');
    promptWord.className = 'sf-quiz-prompt-word';
    promptWord.textContent = entry.word;

    prompt.appendChild(promptLabel);
    prompt.appendChild(promptWord);

    var optionsEl = document.createElement('div');
    optionsEl.className = 'sf-quiz-options';

    choices.forEach(function (choice) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sf-quiz-option';
      btn.textContent = choice;
      btn.addEventListener('click', function () {
        if (quizAnswered) return;
        quizAnswered = true;
        var isCorrect = (choice === entry.translation);
        var ws = getWordStats(entry.word);
        ws.lastSeen = Date.now();
        if (isCorrect) {
          quizScore++;
          ws.correct++;
          ws.streak++;
          btn.classList.add('sf-quiz-correct');
        } else {
          ws.wrong++;
          ws.streak = 0;
          btn.classList.add('sf-quiz-wrong');
          var allBtns = optionsEl.querySelectorAll('.sf-quiz-option');
          for (var i = 0; i < allBtns.length; i++) {
            if (allBtns[i].textContent === entry.translation) {
              allBtns[i].classList.add('sf-quiz-correct');
            }
          }
        }
        SF.saveQuizStats();
        setTimeout(function () {
          quizCurrent++;
          renderQuiz();
        }, 1200);
      });
      optionsEl.appendChild(btn);
    });

    var progressBar = document.createElement('div');
    progressBar.className = 'sf-quiz-progress';
    var progressFill = document.createElement('div');
    progressFill.className = 'sf-quiz-progress-fill';
    progressFill.style.width = ((quizCurrent / quizTotal) * 100) + '%';
    progressBar.appendChild(progressFill);

    container.appendChild(header);
    container.appendChild(progressBar);
    container.appendChild(prompt);
    container.appendChild(optionsEl);
    quizOverlay.appendChild(container);

    var target = document.fullscreenElement || document.body;
    if (quizOverlay.parentElement !== target) target.appendChild(quizOverlay);
  }

  function renderQuizResults() {
    var container = document.createElement('div');
    container.className = 'sf-quiz-container';

    var header = document.createElement('div');
    header.className = 'sf-quiz-header';
    var title = document.createElement('span');
    title.textContent = 'Results';
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sf-quiz-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', function () {
      quizOverlay.remove();
    });
    header.appendChild(title);
    header.appendChild(closeBtn);

    var resultCard = document.createElement('div');
    resultCard.className = 'sf-quiz-result-card';

    var pct = Math.round((quizScore / quizTotal) * 100);
    var emoji = pct === 100 ? '🎉' : pct >= 70 ? '👍' : pct >= 40 ? '📚' : '💪';

    var emojiEl = document.createElement('div');
    emojiEl.className = 'sf-quiz-result-emoji';
    emojiEl.textContent = emoji;

    var scoreText = document.createElement('div');
    scoreText.className = 'sf-quiz-result-score';
    scoreText.textContent = quizScore + ' / ' + quizTotal;

    var pctText = document.createElement('div');
    pctText.className = 'sf-quiz-result-pct';
    pctText.textContent = pct + '% correct';

    resultCard.appendChild(emojiEl);
    resultCard.appendChild(scoreText);
    resultCard.appendChild(pctText);

    var actions = document.createElement('div');
    actions.className = 'sf-quiz-result-actions';

    var retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'sf-quiz-retry';
    retryBtn.textContent = 'Try Again';
    retryBtn.addEventListener('click', function () {
      SF.openQuiz();
    });

    var doneBtn = document.createElement('button');
    doneBtn.type = 'button';
    doneBtn.className = 'sf-quiz-done';
    doneBtn.textContent = 'Done';
    doneBtn.addEventListener('click', function () {
      quizOverlay.remove();
    });

    actions.appendChild(retryBtn);
    actions.appendChild(doneBtn);

    container.appendChild(header);
    container.appendChild(resultCard);
    container.appendChild(actions);
    quizOverlay.appendChild(container);

    var target = document.fullscreenElement || document.body;
    if (quizOverlay.parentElement !== target) target.appendChild(quizOverlay);
  }

  var statsOverlay = null;

  SF.openStats = function () {
    if (!statsOverlay) {
      statsOverlay = document.createElement('div');
      statsOverlay.className = 'sf-stats-overlay';
    }
    statsOverlay.textContent = '';

    var container = document.createElement('div');
    container.className = 'sf-stats-container';

    var header = document.createElement('div');
    header.className = 'sf-stats-header';
    var title = document.createElement('span');
    title.textContent = 'Statistics';
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sf-stats-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', function () {
      statsOverlay.remove();
    });
    header.appendChild(title);
    header.appendChild(closeBtn);

    var words = Object.keys(SF.quizStats);
    var totalCorrect = 0;
    var totalWrong = 0;
    var wordData = [];

    words.forEach(function (w) {
      var s = SF.quizStats[w];
      totalCorrect += s.correct;
      totalWrong += s.wrong;
      wordData.push({ word: w, correct: s.correct, wrong: s.wrong, streak: s.streak, total: s.correct + s.wrong });
    });

    var totalAttempts = totalCorrect + totalWrong;
    var accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    var summaryCards = document.createElement('div');
    summaryCards.className = 'sf-stats-summary';

    var statItems = [
      { label: 'Total Quizzes', value: totalAttempts },
      { label: 'Accuracy', value: accuracy + '%' },
      { label: 'Words Learned', value: SF.savedWords.length },
      { label: 'Mastered', value: wordData.filter(function (d) { return d.streak >= 3; }).length }
    ];

    statItems.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'sf-stats-card';
      var val = document.createElement('div');
      val.className = 'sf-stats-card-val';
      val.textContent = item.value;
      var lbl = document.createElement('div');
      lbl.className = 'sf-stats-card-label';
      lbl.textContent = item.label;
      card.appendChild(val);
      card.appendChild(lbl);
      summaryCards.appendChild(card);
    });

    container.appendChild(header);
    container.appendChild(summaryCards);

    if (wordData.length > 0) {
      var mostWrong = wordData.slice().sort(function (a, b) { return b.wrong - a.wrong; }).slice(0, 5).filter(function (d) { return d.wrong > 0; });
      var mastered = wordData.slice().sort(function (a, b) { return b.streak - a.streak; }).slice(0, 5).filter(function (d) { return d.streak >= 2; });

      if (mostWrong.length > 0) {
        var section1 = document.createElement('div');
        section1.className = 'sf-stats-section';
        var h1 = document.createElement('div');
        h1.className = 'sf-stats-section-title';
        h1.textContent = 'Needs Practice';
        section1.appendChild(h1);
        mostWrong.forEach(function (d) {
          var row = document.createElement('div');
          row.className = 'sf-stats-row';
          var w = document.createElement('span');
          w.className = 'sf-stats-word';
          w.textContent = d.word;
          var bar = document.createElement('div');
          bar.className = 'sf-stats-bar';
          var correctPct = d.total > 0 ? (d.correct / d.total) * 100 : 0;
          var fill = document.createElement('div');
          fill.className = 'sf-stats-bar-fill sf-stats-bar-red';
          fill.style.width = (100 - correctPct) + '%';
          bar.appendChild(fill);
          var info = document.createElement('span');
          info.className = 'sf-stats-info';
          info.textContent = d.wrong + ' wrong / ' + d.total;
          row.appendChild(w);
          row.appendChild(bar);
          row.appendChild(info);
          section1.appendChild(row);
        });
        container.appendChild(section1);
      }

      if (mastered.length > 0) {
        var section2 = document.createElement('div');
        section2.className = 'sf-stats-section';
        var h2 = document.createElement('div');
        h2.className = 'sf-stats-section-title';
        h2.textContent = 'Mastered';
        section2.appendChild(h2);
        mastered.forEach(function (d) {
          var row = document.createElement('div');
          row.className = 'sf-stats-row';
          var w = document.createElement('span');
          w.className = 'sf-stats-word';
          w.textContent = d.word;
          var bar = document.createElement('div');
          bar.className = 'sf-stats-bar';
          var correctPct = d.total > 0 ? (d.correct / d.total) * 100 : 0;
          var fill = document.createElement('div');
          fill.className = 'sf-stats-bar-fill sf-stats-bar-green';
          fill.style.width = correctPct + '%';
          bar.appendChild(fill);
          var info = document.createElement('span');
          info.className = 'sf-stats-info';
          info.textContent = d.streak + '× streak';
          row.appendChild(w);
          row.appendChild(bar);
          row.appendChild(info);
          section2.appendChild(row);
        });
        container.appendChild(section2);
      }
    }

    if (words.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'sf-stats-empty';
      empty.textContent = 'No quiz data yet. Take a quiz to see statistics!';
      container.appendChild(empty);
    }

    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'sf-stats-reset';
    resetBtn.textContent = 'Reset Statistics';
    resetBtn.addEventListener('click', function () {
      SF.quizStats = {};
      SF.saveQuizStats();
      SF.openStats();
    });
    container.appendChild(resetBtn);

    statsOverlay.appendChild(container);

    var target = document.fullscreenElement || document.body;
    if (statsOverlay.parentElement !== target) target.appendChild(statsOverlay);
  };
})();
