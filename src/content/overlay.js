(function () {
  const SF = window.__SubFreeze;
  const state = SF.state;

  SF.createOverlay = function () {
    const ui = SF.ui;

    ui.hideStyle = document.createElement('style');
    (document.head || document.documentElement).appendChild(ui.hideStyle);

    ui.overlay = document.createElement('div');
    ui.overlay.className = 'sf-overlay';
    ui.line1 = document.createElement('div');
    ui.line1.className = 'sf-line sf-line1';
    ui.line2 = document.createElement('div');
    ui.line2.className = 'sf-line sf-line2';
    ui.prevBox = document.createElement('div');
    ui.prevBox.className = 'sf-prev';
    ui.linePrev1 = document.createElement('div');
    ui.linePrev1.className = 'sf-prev-line sf-prev1';
    ui.linePrev2 = document.createElement('div');
    ui.linePrev2.className = 'sf-prev-line sf-prev2';
    ui.prevBox.appendChild(ui.linePrev1);
    ui.prevBox.appendChild(ui.linePrev2);

    ui.overlay.appendChild(ui.prevBox);
    ui.overlay.appendChild(ui.line1);
    ui.overlay.appendChild(ui.line2);
  };

  SF.updateHideStyle = function (active) {
    SF.ui.hideStyle.textContent = active
      ? '.player-timedtext, .image-based-subtitles { display: none !important; }'
      : '';
  };

  SF.hideOverlay = function () {
    if (SF.ui.overlay) SF.ui.overlay.style.display = 'none';
  };

  SF.drawSubtitles = function (video, rect, timeOverride) {
    const ui = SF.ui;
    const target = document.fullscreenElement || document.body;
    if (ui.overlay.parentElement !== target) target.appendChild(ui.overlay);

    ui.overlay.style.display = 'flex';
    ui.overlay.style.left = rect.left + 'px';
    ui.overlay.style.top = rect.top + 'px';
    ui.overlay.style.width = rect.width + 'px';
    ui.overlay.style.height = rect.height + 'px';

    const time = (typeof timeOverride === 'number') ? timeOverride : video.currentTime;
    const text1 = SF.findCue(state.cues[0], time);
    const text2 = SF.findCue(state.cues[1], time);
    ui.line1.textContent = text1;
    ui.line2.textContent = text2;
    ui.line1.style.display = text1 ? 'block' : 'none';
    ui.line2.style.display = text2 ? 'block' : 'none';
    ui.line1.style.fontSize = Math.round(rect.height * state.scale[0] / 100) + 'px';
    ui.line2.style.fontSize = Math.round(rect.height * state.scale[1] / 100) + 'px';

    let prev1 = '';
    let prev2 = '';
    if (state.showPrev) {
      if (state.cues[0].length) prev1 = SF.findPrevCue(state.cues[0], time);
      if (state.cues[1].length) prev2 = SF.findPrevCue(state.cues[1], time);
    }
    const prevScale1 = state.prevFollow ? state.scale[0] : state.prevScale;
    const prevScale2 = state.prevFollow ? state.scale[1] : state.prevScale;
    ui.linePrev1.textContent = prev1;
    ui.linePrev2.textContent = prev2;
    ui.linePrev1.style.display = prev1 ? 'block' : 'none';
    ui.linePrev2.style.display = prev2 ? 'block' : 'none';
    ui.linePrev1.style.fontSize = Math.round(rect.height * prevScale1 / 100) + 'px';
    ui.linePrev2.style.fontSize = Math.round(rect.height * prevScale2 / 100) + 'px';
  };

  SF.showAtTime = function (time) {
    if (!SF.ui.overlay || !state.enabled) return;
    if (!/\/watch\//.test(location.href)) return;
    const video = document.querySelector('video');
    if (!video) return;
    const rect = video.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    SF.drawSubtitles(video, rect, time);
  };
})();
