(function () {
  const SF = window.__SubFreeze;
  const state = SF.state;

  let uiReady = false;

  function ensureUI() {
    if (uiReady) return true;
    if (!document.body) return false;
    SF.createOverlay();
    SF.createPanel();
    SF.startMenuObserver();
    uiReady = true;
    return true;
  }

  function render() {
    if (!ensureUI()) return;
    if (state.tracksDirty) SF.refreshDropdowns();

    const onWatch = /\/watch\//.test(location.href);
    SF.updatePanelVisibility(onWatch && state.tracks.length > 0 && !state.collapsed);

    const anyActive = state.enabled && (state.cues[0].length > 0 || state.cues[1].length > 0);
    SF.updateHideStyle(onWatch && state.hideNetflix && anyActive);

    const video = document.querySelector('video');
    if (!onWatch || !video || !state.enabled) {
      SF.hideOverlay();
      return;
    }
    const rect = video.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      SF.hideOverlay();
      return;
    }
    SF.drawSubtitles(video, rect);
  }

  SF.loadSettings();
  SF.loadWords();
  SF.installManifestHook();
  SF.initNavigation();

  window.addEventListener('message', function (e) {
    if (e.source !== window) return;
    const d = e.data;
    if (d && d.__subfreeze && d.action === 'toggle') {
      state.collapsed = !state.collapsed;
    }
  });

  setInterval(render, SF.config.renderInterval);
})();
