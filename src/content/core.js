(function () {
  if (window.__subFreezeLoaded) return;
  window.__subFreezeLoaded = true;

  const SF = (window.__SubFreeze = {});

  SF.config = {
    settingsKey: 'subfreeze-settings',
    menuClass: 'subfreeze-secondary-menu',
    subMenuSelector: 'div[data-uia="selector-audio-subtitle"]',
    renderInterval: 150,
    wheelCooldown: 220,
    minScale: 2,
    maxScale: 9
  };

  SF.state = {
    tracks: [],
    selected: [null, null],
    selectedLang: [null, null],
    cues: [[], []],
    cache: {},
    tracksDirty: false,
    scale: [4, 3.4],
    skip: 10,
    scrollSeek: true,
    showPrev: false,
    prevScale: 2,
    enabled: true,
    hideNetflix: true,
    collapsed: true
  };

  SF.ui = {
    overlay: null,
    line1: null,
    line2: null,
    panel: null,
    hideStyle: null,
    sel1: null,
    sel2: null
  };

  SF.log = function () {
    const args = Array.prototype.slice.call(arguments);
    window.console.log.apply(window.console, ['[SubFreeze]'].concat(args));
  };

  SF.loadSettings = function () {
    try {
      const raw = localStorage.getItem(SF.config.settingsKey);
      if (!raw) return;
      const s = JSON.parse(raw);
      const state = SF.state;
      if (typeof s.lang0 !== 'undefined') state.selectedLang[0] = s.lang0;
      if (typeof s.lang1 !== 'undefined') state.selectedLang[1] = s.lang1;
      if (typeof s.scale0 === 'number') state.scale[0] = s.scale0;
      if (typeof s.scale1 === 'number') state.scale[1] = s.scale1;
      if (typeof s.skip === 'number') state.skip = s.skip;
      if (typeof s.scrollSeek === 'boolean') state.scrollSeek = s.scrollSeek;
      if (typeof s.showPrev === 'boolean') state.showPrev = s.showPrev;
      if (typeof s.prevScale === 'number') state.prevScale = s.prevScale;
      if (typeof s.hideNetflix === 'boolean') state.hideNetflix = s.hideNetflix;
      if (typeof s.enabled === 'boolean') state.enabled = s.enabled;
    } catch (err) {}
  };

  SF.saveSettings = function () {
    try {
      const state = SF.state;
      localStorage.setItem(SF.config.settingsKey, JSON.stringify({
        lang0: state.selectedLang[0],
        lang1: state.selectedLang[1],
        scale0: state.scale[0],
        scale1: state.scale[1],
        skip: state.skip,
        scrollSeek: state.scrollSeek,
        showPrev: state.showPrev,
        prevScale: state.prevScale,
        hideNetflix: state.hideNetflix,
        enabled: state.enabled
      }));
    } catch (err) {}
  };

  SF.log('content script loaded (MAIN world)');
})();
