(function () {
  const SF = window.__SubFreeze;
  const state = SF.state;

  function activeCues() {
    if (state.cues[0].length) return state.cues[0];
    if (state.cues[1].length) return state.cues[1];
    return null;
  }

  SF.jump = function (delta) {
    const video = document.querySelector('video');
    if (!video) return;
    SF.seekTo(video.currentTime + delta);
  };

  function seekSubtitle(dir) {
    const cues = activeCues();
    if (!cues) return;
    const video = document.querySelector('video');
    if (!video) return;
    const t = video.currentTime;
    if (dir > 0) {
      const next = cues.find(function (c) { return c.start > t + 0.05; });
      if (next) SF.seekTo(next.start);
    } else {
      let prev = null;
      for (let i = 0; i < cues.length; i++) {
        if (cues[i].start < t - 0.4) prev = cues[i];
        else break;
      }
      if (prev) SF.seekTo(prev.start);
    }
  }

  SF.initNavigation = function () {
    window.addEventListener('keydown', function (e) {
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === ',') SF.jump(-state.skip);
      else if (e.key === '.') SF.jump(state.skip);
    }, true);

    let lastWheel = 0;
    window.addEventListener('wheel', function (e) {
      if (!state.scrollSeek) return;
      if (!/\/watch\//.test(location.href)) return;
      if (!activeCues()) return;
      const video = document.querySelector('video');
      if (!video) return;
      const rect = video.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right ||
        e.clientY < rect.top || e.clientY > rect.bottom) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheel < SF.config.wheelCooldown) {
        lastWheel = now;
        return;
      }
      lastWheel = now;
      seekSubtitle(e.deltaY > 0 ? 1 : -1);
    }, { passive: false });
  };
})();
