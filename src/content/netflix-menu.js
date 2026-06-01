(function () {
  const SF = window.__SubFreeze;
  const state = SF.state;

  function extractMenuStyle(mainNode) {
    const style = { maindiv: '', subdiv: '', h3: '', ul: '', li: '', selected: '' };
    if (mainNode.firstChild && typeof mainNode.firstChild.className === 'string') {
      style.maindiv = mainNode.firstChild.className;
    }
    const subdiv = mainNode.querySelector('li div div');
    if (subdiv) style.subdiv = subdiv.className;
    const h3 = mainNode.querySelector('h3');
    if (h3) style.h3 = h3.className;
    const ul = mainNode.querySelector('ul');
    if (ul) style.ul = ul.className;
    const li = mainNode.querySelector('li');
    if (li) style.li = li.className;
    const sel = mainNode.querySelector('li[data-uia*="selected"] svg');
    if (sel && sel.className && sel.className.baseVal) style.selected = sel.className.baseVal;
    return style;
  }

  function renderMenu(wrap, style) {
    const checkIcon = '<svg viewBox="0 0 24 24" class="' + style.selected + '"><path fill="currentColor" d="M3.707 12.293l-1.414 1.414L8 19.414 21.707 5.707l-1.414-1.414L8 16.586z"></path></svg>';
    wrap.innerHTML = '<h3 class="' + style.h3 + '">Second Subtitle</h3>';

    const ul = document.createElement('ul');
    if (style.ul) ul.className = style.ul;

    const items = [{ id: '', label: 'Off' }].concat(state.tracks.map(function (t) {
      return { id: t.id, label: t.label };
    }));
    items.forEach(function (it) {
      const li = document.createElement('li');
      if (style.li) li.className = style.li;
      const active = (it.id || '') === (state.selected[1] || '');
      if (active) {
        li.classList.add('selected');
        li.innerHTML = '<div>' + checkIcon + '<div class="' + style.subdiv + '">' + it.label + '</div></div>';
      } else {
        li.innerHTML = '<div><div class="' + style.subdiv + '">' + it.label + '</div></div>';
        li.addEventListener('click', function () {
          SF.selectTrack(1, it.id);
          renderMenu(wrap, style);
        });
      }
      ul.appendChild(li);
    });
    wrap.appendChild(ul);

    const sizeRow = document.createElement('div');
    sizeRow.className = 'subfreeze-size-row';
    const label = document.createElement('span');
    label.textContent = 'Second subtitle size';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = 'A-';
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = 'A+';
    minus.addEventListener('click', function () {
      state.scale[1] = Math.max(SF.config.minScale, Math.round((state.scale[1] - 0.25) * 100) / 100);
      SF.syncControls();
      SF.saveSettings();
    });
    plus.addEventListener('click', function () {
      state.scale[1] = Math.min(SF.config.maxScale, Math.round((state.scale[1] + 0.25) * 100) / 100);
      SF.syncControls();
      SF.saveSettings();
    });
    sizeRow.appendChild(label);
    sizeRow.appendChild(minus);
    sizeRow.appendChild(plus);
    wrap.appendChild(sizeRow);
  }

  function injectMenu(mainNode) {
    try {
      const style = extractMenuStyle(mainNode);
      const wrap = document.createElement('div');
      wrap.className = SF.config.menuClass + (style.maindiv ? ' ' + style.maindiv : '');
      renderMenu(wrap, style);
      mainNode.appendChild(wrap);
    } catch (err) {}
  }

  SF.startMenuObserver = function () {
    const observer = new MutationObserver(function () {
      if (!state.tracks.length) return;
      const mainNode = document.querySelector(SF.config.subMenuSelector);
      if (!mainNode) return;
      if (mainNode.querySelector('.' + SF.config.menuClass)) return;
      injectMenu(mainNode);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };
})();
