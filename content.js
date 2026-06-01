(function () {
  if (window.__subFreezeLoaded) return;
  window.__subFreezeLoaded = true;

  const state = {
    tracks: [],
    selected: [null, null],
    selectedLang: [null, null],
    cues: [[], []],
    cache: {},
    tracksDirty: false,
    scale: [4, 3.4],
    skip: 10,
    enabled: true,
    hideNetflix: true,
    collapsed: true
  };

  window.addEventListener('message', function (e) {
    if (e.source !== window) return;
    const d = e.data;
    if (d && d.__subfreeze && d.action === 'toggle') {
      state.collapsed = !state.collapsed;
    }
  });

  function jump(delta) {
    const video = document.querySelector('video');
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime + delta);
  }

  window.addEventListener('keydown', function (e) {
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === ',') {
      jump(-state.skip);
    } else if (e.key === '.') {
      jump(state.skip);
    }
  }, true);

  function ttmlTime(value) {
    if (!value) return 0;
    const t = String(value).trim();
    if (t.indexOf(':') !== -1) {
      const parts = t.split(':');
      const h = parseFloat(parts[0]) || 0;
      const m = parseFloat(parts[1]) || 0;
      const s = parseFloat(parts[2]) || 0;
      return h * 3600 + m * 60 + s;
    }
    const num = parseFloat(t);
    if (isNaN(num)) return 0;
    return num / 10000000;
  }

  function extractText(node) {
    let out = '';
    const kids = node.childNodes;
    for (let i = 0; i < kids.length; i++) {
      const n = kids[i];
      if (n.nodeType === 1) {
        if (n.nodeName.toLowerCase() === 'br') out += '\n';
        else out += extractText(n);
      } else if (n.nodeType === 3) {
        out += n.nodeValue;
      }
    }
    return out;
  }

  function parseTTML(xmlText) {
    const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
    const ps = xml.getElementsByTagName('p');
    const cues = [];
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const start = ttmlTime(p.getAttribute('begin'));
      const end = ttmlTime(p.getAttribute('end'));
      const text = extractText(p)
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
      if (!text) continue;
      cues.push({ start: start, end: end, text: text });
    }
    cues.sort(function (a, b) {
      return a.start - b.start;
    });
    return cues;
  }

  function findCue(cues, time) {
    for (let i = 0; i < cues.length; i++) {
      if (time >= cues[i].start && time <= cues[i].end) return cues[i].text;
    }
    return '';
  }

  function isNoneTrack(track) {
    if (track.isNoneTrack) return true;
    if (typeof track.new_track_id === 'string' && track.new_track_id.split(';')[4] === '1') return true;
    if (track.rank !== undefined && track.rank < 0) return true;
    return false;
  }

  function getTrackUrls(track) {
    const downloadables = track.ttDownloadables;
    if (!downloadables) return null;
    const keys = Object.keys(downloadables);
    for (let i = 0; i < keys.length; i++) {
      const d = downloadables[keys[i]];
      if (!d || d.isImage) continue;
      if (d.downloadUrls) return Object.values(d.downloadUrls);
      if (d.urls) return d.urls.map(function (u) { return u.url; });
    }
    return null;
  }

  function buildTrackList(timedtexttracks) {
    const list = [];
    for (let i = 0; i < timedtexttracks.length; i++) {
      const t = timedtexttracks[i];
      if (isNoneTrack(t)) continue;
      const urls = getTrackUrls(t);
      if (!urls || !urls.length) continue;
      const label = t.languageDescription + (t.rawTrackType === 'closedcaptions' ? ' [CC]' : '');
      list.push({ id: t.new_track_id, label: label, bcp47: t.language, urls: urls });
    }
    return list;
  }

  function downloadTrack(track) {
    return fetch(track.urls[0]).then(function (r) {
      return r.text();
    }).then(parseTTML);
  }

  function selectTrack(slot, id) {
    if (!id) {
      state.selected[slot] = null;
      state.selectedLang[slot] = null;
      state.cues[slot] = [];
      return;
    }
    const track = state.tracks.find(function (t) { return t.id === id; });
    if (!track) return;
    state.selected[slot] = id;
    state.selectedLang[slot] = track.bcp47;
    if (state.cache[id]) {
      state.cues[slot] = state.cache[id];
      return;
    }
    state.cues[slot] = [];
    downloadTrack(track).then(function (cues) {
      state.cache[id] = cues;
      if (state.selected[slot] === id) state.cues[slot] = cues;
    });
  }

  function handleManifest(result) {
    const list = buildTrackList(result.timedtexttracks);
    if (!list.length) return;
    state.tracks = list;
    state.tracksDirty = true;
    for (let slot = 0; slot < 2; slot++) {
      const lang = state.selectedLang[slot];
      if (!lang) continue;
      const match = state.tracks.find(function (t) { return t.bcp47 === lang; });
      if (match) selectTrack(slot, match.id);
    }
  }

  const _parse = JSON.parse;
  JSON.parse = function () {
    const result = _parse.apply(this, arguments);
    if (result && result.result && result.result.movieId && result.result.timedtexttracks) {
      handleManifest(result.result);
    }
    return result;
  };

  let overlay, line1, line2, panel, hideStyle, sel1, sel2;

  function ensureUI() {
    if (overlay) return true;
    if (!document.body) return false;

    hideStyle = document.createElement('style');
    (document.head || document.documentElement).appendChild(hideStyle);

    overlay = document.createElement('div');
    overlay.className = 'sf-overlay';
    line1 = document.createElement('div');
    line1.className = 'sf-line sf-line1';
    line2 = document.createElement('div');
    line2.className = 'sf-line sf-line2';
    overlay.appendChild(line1);
    overlay.appendChild(line2);

    panel = document.createElement('div');
    panel.className = 'sf-panel';
    panel.innerHTML =
      '<div class="sf-head"><span>Dual Subtitles</span><button class="sf-close" type="button">&times;</button></div>' +
      '<div class="sf-body">' +
      '<label class="sf-row"><span>Subtitle 1</span><select class="sf-sel1"></select></label>' +
      '<label class="sf-row"><span>Size 1</span><input type="range" class="sf-size1" min="2" max="9" step="0.25" value="4"></label>' +
      '<label class="sf-row"><span>Subtitle 2</span><select class="sf-sel2"></select></label>' +
      '<label class="sf-row"><span>Size 2</span><input type="range" class="sf-size2" min="2" max="9" step="0.25" value="3.4"></label>' +
      '<label class="sf-row"><span>Skip seconds ( , and . )</span><input type="number" class="sf-skip" min="0.5" max="300" step="0.5" value="10"></label>' +
      '<div class="sf-skip-row"><button class="sf-back" type="button">&laquo; Back</button><button class="sf-fwd" type="button">Next &raquo;</button></div>' +
      '<label class="sf-row sf-toggle-row"><span>Hide Netflix subtitle</span><input type="checkbox" class="sf-hide" checked></label>' +
      '<label class="sf-row sf-toggle-row"><span>Show subtitles</span><input type="checkbox" class="sf-enabled" checked></label>' +
      '</div>';

    document.body.appendChild(panel);

    sel1 = panel.querySelector('.sf-sel1');
    sel2 = panel.querySelector('.sf-sel2');

    sel1.addEventListener('change', function (e) { selectTrack(0, e.target.value); });
    sel2.addEventListener('change', function (e) { selectTrack(1, e.target.value); });
    panel.querySelector('.sf-size1').addEventListener('input', function (e) {
      state.scale[0] = parseFloat(e.target.value) || 4;
    });
    panel.querySelector('.sf-size2').addEventListener('input', function (e) {
      state.scale[1] = parseFloat(e.target.value) || 4;
    });
    panel.querySelector('.sf-skip').addEventListener('input', function (e) {
      state.skip = parseFloat(e.target.value) || 10;
    });
    panel.querySelector('.sf-back').addEventListener('click', function () {
      jump(-state.skip);
    });
    panel.querySelector('.sf-fwd').addEventListener('click', function () {
      jump(state.skip);
    });
    panel.querySelector('.sf-hide').addEventListener('change', function (e) {
      state.hideNetflix = e.target.checked;
    });
    panel.querySelector('.sf-enabled').addEventListener('change', function (e) {
      state.enabled = e.target.checked;
    });
    panel.querySelector('.sf-close').addEventListener('click', function () {
      state.collapsed = true;
    });

    return true;
  }

  function refreshDropdowns() {
    state.tracksDirty = false;
    [sel1, sel2].forEach(function (sel, slot) {
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
  }

  function render() {
    if (!ensureUI()) return;
    if (state.tracksDirty) refreshDropdowns();

    const onWatch = /\/watch\//.test(location.href);
    const showUI = onWatch && state.tracks.length > 0 && !state.collapsed;
    panel.style.display = showUI ? 'block' : 'none';

    const anyActive = state.enabled && (state.cues[0].length > 0 || state.cues[1].length > 0);
    hideStyle.textContent = (onWatch && state.hideNetflix && anyActive)
      ? '.player-timedtext, .image-based-subtitles { display: none !important; }'
      : '';

    const video = document.querySelector('video');
    if (!onWatch || !video || !state.enabled) {
      overlay.style.display = 'none';
      return;
    }
    const rect = video.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      overlay.style.display = 'none';
      return;
    }
    const target = document.fullscreenElement || document.body;
    if (overlay.parentElement !== target) target.appendChild(overlay);
    overlay.style.display = 'flex';
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';

    const time = video.currentTime;
    const text1 = findCue(state.cues[0], time);
    const text2 = findCue(state.cues[1], time);
    line1.textContent = text1;
    line2.textContent = text2;
    line1.style.display = text1 ? 'block' : 'none';
    line2.style.display = text2 ? 'block' : 'none';
    line1.style.fontSize = Math.round(rect.height * state.scale[0] / 100) + 'px';
    line2.style.fontSize = Math.round(rect.height * state.scale[1] / 100) + 'px';
  }

  setInterval(render, 150);
})();
