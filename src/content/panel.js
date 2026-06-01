(function () {
  const SF = window.__SubFreeze;
  const state = SF.state;

  const TEMPLATE =
    '<div class="sf-head"><div class="sf-head-left"><svg class="sf-logo" viewBox="0 0 24 24" width="18" height="18"><path fill="#e50914" d="M4 2v20l5-4 5 4 5-4 5 4V2H4z"/><rect x="8" y="7" width="8" height="2" rx="1" fill="#fff"/><rect x="8" y="11" width="6" height="2" rx="1" fill="#fff" opacity="0.7"/></svg><span>SubFreeze</span></div><button class="sf-close" type="button">&times;</button></div>' +
    '<div class="sf-body">' +
    '<div class="sf-section">' +
    '<div class="sf-section-title">Subtitles</div>' +
    '<label class="sf-row"><span>Primary</span><select class="sf-sel1"></select></label>' +
    '<label class="sf-row sf-range-row"><span>Size</span><input type="range" class="sf-size1" min="2" max="9" step="0.25" value="4"><span class="sf-range-val"></span></label>' +
    '<label class="sf-row"><span>Secondary</span><select class="sf-sel2"></select></label>' +
    '<label class="sf-row sf-range-row"><span>Size</span><input type="range" class="sf-size2" min="2" max="9" step="0.25" value="3.4"><span class="sf-range-val"></span></label>' +
    '</div>' +
    '<div class="sf-section">' +
    '<div class="sf-section-title">Playback</div>' +
    '<label class="sf-row sf-range-row"><span>Skip (sec)</span><input type="number" class="sf-skip" min="0.5" max="300" step="0.5" value="10"></label>' +
    '<div class="sf-skip-row"><button class="sf-back" type="button">&#9664; Back</button><button class="sf-fwd" type="button">Next &#9654;</button></div>' +
    '</div>' +
    '<div class="sf-section">' +
    '<div class="sf-section-title">Display</div>' +
    '<label class="sf-row sf-toggle-row"><span>Scroll seek</span><label class="sf-switch"><input type="checkbox" class="sf-scroll" checked><span class="sf-slider"></span></label></label>' +
    '<label class="sf-row sf-toggle-row"><span>Previous subtitle</span><label class="sf-switch"><input type="checkbox" class="sf-prev-toggle"><span class="sf-slider"></span></label></label>' +
    '<label class="sf-row sf-range-row"><span>Previous size</span><input type="range" class="sf-prevsize" min="2" max="9" step="0.25" value="2"><span class="sf-range-val"></span></label>' +
    '<label class="sf-row sf-toggle-row"><span>Hide Netflix subs</span><label class="sf-switch"><input type="checkbox" class="sf-hide" checked><span class="sf-slider"></span></label></label>' +
    '<label class="sf-row sf-toggle-row"><span>Show subtitles</span><label class="sf-switch"><input type="checkbox" class="sf-enabled" checked><span class="sf-slider"></span></label></label>' +
    '</div>' +
    '<div class="sf-section">' +
    '<div class="sf-section-title">Dictionary</div>' +
    '<label class="sf-row"><span>Translate to</span><select class="sf-lang"></select></label>' +
    '<div class="sf-words-actions"><button class="sf-flashcard-btn" type="button">&#9733; Flash Cards</button><button class="sf-export-btn" type="button">&#8595; Anki</button><button class="sf-clear" type="button">&#10005; Clear</button></div>' +
    '<div class="sf-words"></div>' +
    '</div>' +
    '</div>';

  SF.createPanel = function () {
    const ui = SF.ui;

    ui.panel = document.createElement('div');
    ui.panel.className = 'sf-panel';
    ui.panel.innerHTML = TEMPLATE;
    document.body.appendChild(ui.panel);

    ui.sel1 = ui.panel.querySelector('.sf-sel1');
    ui.sel2 = ui.panel.querySelector('.sf-sel2');
    const size1El = ui.panel.querySelector('.sf-size1');
    const size2El = ui.panel.querySelector('.sf-size2');
    const skipEl = ui.panel.querySelector('.sf-skip');
    const scrollEl = ui.panel.querySelector('.sf-scroll');
    const prevEl = ui.panel.querySelector('.sf-prev-toggle');
    const prevSizeEl = ui.panel.querySelector('.sf-prevsize');
    const hideEl = ui.panel.querySelector('.sf-hide');
    const enabledEl = ui.panel.querySelector('.sf-enabled');
    const langEl = ui.panel.querySelector('.sf-lang');
    ui.wordList = ui.panel.querySelector('.sf-words');

    SF.LANGS.forEach(function (l) {
      const o = document.createElement('option');
      o.value = l.code;
      o.textContent = l.name;
      langEl.appendChild(o);
    });
    langEl.value = state.targetLang;

    size1El.value = state.scale[0];
    size2El.value = state.scale[1];
    skipEl.value = state.skip;
    scrollEl.checked = state.scrollSeek;
    prevEl.checked = state.showPrev;
    prevSizeEl.value = state.prevScale;
    hideEl.checked = state.hideNetflix;
    enabledEl.checked = state.enabled;

    ui.sel1.addEventListener('change', function (e) { SF.selectTrack(0, e.target.value); });
    ui.sel2.addEventListener('change', function (e) { SF.selectTrack(1, e.target.value); });
    size1El.addEventListener('input', function (e) {
      state.scale[0] = parseFloat(e.target.value) || 4;
      SF.saveSettings();
    });
    size2El.addEventListener('input', function (e) {
      state.scale[1] = parseFloat(e.target.value) || 4;
      SF.saveSettings();
    });
    skipEl.addEventListener('input', function (e) {
      state.skip = parseFloat(e.target.value) || 10;
      SF.saveSettings();
    });
    ui.panel.querySelector('.sf-back').addEventListener('click', function () { SF.jump(-state.skip); });
    ui.panel.querySelector('.sf-fwd').addEventListener('click', function () { SF.jump(state.skip); });
    scrollEl.addEventListener('change', function (e) {
      state.scrollSeek = e.target.checked;
      SF.saveSettings();
    });
    prevEl.addEventListener('change', function (e) {
      state.showPrev = e.target.checked;
      SF.saveSettings();
    });
    prevSizeEl.addEventListener('input', function (e) {
      state.prevScale = parseFloat(e.target.value) || 3;
      SF.saveSettings();
    });
    hideEl.addEventListener('change', function (e) {
      state.hideNetflix = e.target.checked;
      SF.saveSettings();
    });
    enabledEl.addEventListener('change', function (e) {
      state.enabled = e.target.checked;
      SF.saveSettings();
    });
    langEl.addEventListener('change', function (e) {
      state.targetLang = e.target.value;
      SF.saveSettings();
    });
    ui.panel.querySelector('.sf-clear').addEventListener('click', function () {
      SF.savedWords = [];
      SF.saveWords();
      SF.renderWordList();
    });
    ui.panel.querySelector('.sf-flashcard-btn').addEventListener('click', function () {
      SF.openFlashCards();
    });
    ui.panel.querySelector('.sf-export-btn').addEventListener('click', function () {
      SF.exportAnki();
    });
    ui.panel.querySelector('.sf-close').addEventListener('click', function () {
      state.collapsed = true;
    });

    SF.renderWordList();
  };

  SF.syncControls = function () {
    if (!SF.ui.panel) return;
    SF.ui.panel.querySelector('.sf-size1').value = state.scale[0];
    SF.ui.panel.querySelector('.sf-size2').value = state.scale[1];
  };

  SF.refreshDropdowns = function () {
    state.tracksDirty = false;
    [SF.ui.sel1, SF.ui.sel2].forEach(function (sel, slot) {
      sel.innerHTML = '';
      const off = document.createElement('option');
      off.value = '';
      off.textContent = 'Off';
      sel.appendChild(off);
      state.tracks.forEach(function (tr) {
        const o = document.createElement('option');
        o.value = tr.id;
        o.textContent = tr.label;
        sel.appendChild(o);
      });
      const lang = state.selectedLang[slot];
      if (lang) {
        const match = state.tracks.find(function (t) { return t.bcp47 === lang; });
        if (match) sel.value = match.id;
      }
    });
  };

  SF.updatePanelVisibility = function (show) {
    if (SF.ui.panel) SF.ui.panel.style.display = show ? 'block' : 'none';
  };
})();
