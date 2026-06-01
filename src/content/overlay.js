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

  SF.drawSubtitles = function (video, rect) {
    const ui = SF.ui;
    const target = document.fullscreenElement || document.body;
    if (ui.overlay.parentElement !== target) target.appendChild(ui.overlay);

    ui.overlay.style.display = 'flex';
    ui.overlay.style.left = rect.left + 'px';
    ui.overlay.style.top = rect.top + 'px';
    ui.overlay.style.width = rect.width + 'px';
    ui.overlay.style.height = rect.height + 'px';

    const time = video.currentTime;
    const text1 = SF.findCue(state.cues[0], time);
    const text2 = SF.findCue(state.cues[1], time);
    ui.line1.textContent = text1;
    ui.line2.textContent = text2;
    ui.line1.style.display = text1 ? 'block' : 'none';
    ui.line2.style.display = text2 ? 'block' : 'none';
    ui.line1.style.fontSize = Math.round(rect.height * state.scale[0] / 100) + 'px';
    ui.line2.style.fontSize = Math.round(rect.height * state.scale[1] / 100) + 'px';
  };
})();
