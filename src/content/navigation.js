(function () {
  const SF = window.__SubFreeze;
  const state = SF.state;

  function activeCues() {
    if (state.cues[0].length) return state.cues[0];
    if (state.cues[1].length) return state.cues[1];
    return null;
  }

  const SKIP_SELECTOR = '.sf-panel, [role="menu"], [role="dialog"], [role="listbox"]';

  function inMenu(el) {
    if (!el || !el.closest) return false;
    if (el.closest(SKIP_SELECTOR)) return true;
    let node = el;
    while (node && node.nodeType === 1 && node !== document.body) {
      const oy = getComputedStyle(node).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 2) return true;
      node = node.parentElement;
    }
    return false;
  }

  let navTime = null;
  let navAt = 0;

  function refTime(video) {
    if (navTime !== null) {
      if (Date.now() - navAt > 1500 || Math.abs(video.currentTime - navTime) < 0.3) {
        navTime = null;
        return video.currentTime;
      }
      return navTime;
    }
    return video.currentTime;
  }

  function applySeek(target) {
    navTime = target;
    navAt = Date.now();
    SF.seekTo(target);
    SF.showAtTime(target);
  }

  SF.jump = function (delta) {
    const video = document.querySelector('video');
    if (!video) return;
    applySeek(Math.max(0, refTime(video) + delta));
  };

  function seekSubtitle(dir) {
    const cues = activeCues();
    if (!cues) return;
    const video = document.querySelector('video');
    if (!video) return;
    const t = refTime(video);
    let target = null;
    if (dir > 0) {
      const next = cues.find(function (c) { return c.start > t + 0.05; });
      if (next) target = next.start;
    } else {
      let prev = null;
      for (let i = 0; i < cues.length; i++) {
        if (cues[i].start < t - 0.4) prev = cues[i];
        else break;
      }
      if (prev) target = prev.start;
    }
    if (target === null) return;
    applySeek(target);
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
      if (inMenu(e.target)) return;
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
