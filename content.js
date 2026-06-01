(function () {
  if (window.__subFreezeLoaded) return;
  window.__subFreezeLoaded = true;

  const state = {
    tracks: [[], []],
    offsets: [0, 0],
    fontSize: 28,
    enabled: true
  };

  function parseTimestamp(value) {
    const t = value.trim().replace(',', '.');
    const parts = t.split(':');
    let h = 0;
    let m = 0;
    let s = 0;
    if (parts.length === 3) {
      h = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      s = parseFloat(parts[2]);
    } else if (parts.length === 2) {
      m = parseInt(parts[0], 10);
      s = parseFloat(parts[1]);
    } else {
      s = parseFloat(parts[0]);
    }
    if (isNaN(h)) h = 0;
    if (isNaN(m)) m = 0;
    if (isNaN(s)) s = 0;
    return h * 3600 + m * 60 + s;
  }

  function cleanText(value) {
    return value
      .replace(/\{[^}]*\}/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  function parseCues(raw) {
    const normalized = raw.replace(/\r/g, '');
    const blocks = normalized.split(/\n\s*\n/);
    const cues = [];
    for (let b = 0; b < blocks.length; b++) {
      const lines = blocks[b].split('\n');
      let timeIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].indexOf('-->') !== -1) {
          timeIndex = i;
          break;
        }
      }
      if (timeIndex === -1) continue;
      const pieces = lines[timeIndex].split('-->');
      if (pieces.length < 2) continue;
      const start = parseTimestamp(pieces[0]);
      const end = parseTimestamp(pieces[1].trim().split(/\s+/)[0]);
      const textLines = [];
      for (let i = timeIndex + 1; i < lines.length; i++) {
        const cleaned = cleanText(lines[i]);
        if (cleaned.length > 0) textLines.push(cleaned);
      }
      if (textLines.length === 0) continue;
      cues.push({ start: start, end: end, text: textLines.join('\n') });
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

  function loadFile(input, index) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      state.tracks[index] = parseCues(String(reader.result));
    };
    reader.readAsText(file);
  }

  const overlay = document.createElement('div');
  overlay.className = 'sf-overlay';
  const line1 = document.createElement('div');
  line1.className = 'sf-line sf-line1';
  const line2 = document.createElement('div');
  line2.className = 'sf-line sf-line2';
  overlay.appendChild(line1);
  overlay.appendChild(line2);

  const panel = document.createElement('div');
  panel.className = 'sf-panel';
  panel.innerHTML =
    '<div class="sf-head"><span>Dual Subtitles</span><button class="sf-close" type="button">&times;</button></div>' +
    '<div class="sf-body">' +
    '<label class="sf-row"><span>Subtitle 1 (.srt / .vtt)</span><input type="file" class="sf-file1" accept=".srt,.vtt"></label>' +
    '<label class="sf-row"><span>Offset 1 (seconds)</span><input type="number" class="sf-off1" step="0.5" value="0"></label>' +
    '<label class="sf-row"><span>Subtitle 2 (.srt / .vtt)</span><input type="file" class="sf-file2" accept=".srt,.vtt"></label>' +
    '<label class="sf-row"><span>Offset 2 (seconds)</span><input type="number" class="sf-off2" step="0.5" value="0"></label>' +
    '<label class="sf-row"><span>Font size</span><input type="range" class="sf-font" min="14" max="60" value="28"></label>' +
    '<label class="sf-row sf-toggle-row"><span>Show subtitles</span><input type="checkbox" class="sf-enabled" checked></label>' +
    '</div>';

  const launcher = document.createElement('button');
  launcher.className = 'sf-launcher';
  launcher.type = 'button';
  launcher.textContent = 'DS';

  document.body.appendChild(panel);
  document.body.appendChild(launcher);
  launcher.style.display = 'none';

  panel.querySelector('.sf-file1').addEventListener('change', function (e) {
    loadFile(e.target, 0);
  });
  panel.querySelector('.sf-file2').addEventListener('change', function (e) {
    loadFile(e.target, 1);
  });
  panel.querySelector('.sf-off1').addEventListener('input', function (e) {
    state.offsets[0] = parseFloat(e.target.value) || 0;
  });
  panel.querySelector('.sf-off2').addEventListener('input', function (e) {
    state.offsets[1] = parseFloat(e.target.value) || 0;
  });
  panel.querySelector('.sf-font').addEventListener('input', function (e) {
    state.fontSize = parseInt(e.target.value, 10) || 28;
  });
  panel.querySelector('.sf-enabled').addEventListener('change', function (e) {
    state.enabled = e.target.checked;
  });
  panel.querySelector('.sf-close').addEventListener('click', function () {
    panel.style.display = 'none';
    launcher.style.display = 'block';
  });
  launcher.addEventListener('click', function () {
    panel.style.display = 'block';
    launcher.style.display = 'none';
  });

  function render() {
    const video = document.querySelector('video');
    if (!video || !state.enabled) {
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
    const text1 = findCue(state.tracks[0], time - state.offsets[0]);
    const text2 = findCue(state.tracks[1], time - state.offsets[1]);
    line1.textContent = text1;
    line2.textContent = text2;
    line1.style.display = text1 ? 'block' : 'none';
    line2.style.display = text2 ? 'block' : 'none';
    line1.style.fontSize = state.fontSize + 'px';
    line2.style.fontSize = state.fontSize + 'px';
  }

  setInterval(render, 150);
})();
