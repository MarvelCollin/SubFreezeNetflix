(function () {
  const SF = window.__SubFreeze;
  const state = SF.state;

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
    }).then(SF.parseTTML);
  }

  SF.selectTrack = function (slot, id) {
    if (!id) {
      state.selected[slot] = null;
      state.selectedLang[slot] = null;
      state.cues[slot] = [];
      SF.saveSettings();
      return;
    }
    const track = state.tracks.find(function (t) { return t.id === id; });
    if (!track) return;
    state.selected[slot] = id;
    state.selectedLang[slot] = track.bcp47;
    SF.saveSettings();
    if (state.cache[id]) {
      state.cues[slot] = state.cache[id];
      return;
    }
    state.cues[slot] = [];
    SF.log('downloading subtitle', track.label, track.urls[0]);
    downloadTrack(track).then(function (cues) {
      SF.log('downloaded', track.label, cues.length, 'cues');
      state.cache[id] = cues;
      if (state.selected[slot] === id) state.cues[slot] = cues;
    });
  };

  SF.handleManifest = function (result) {
    SF.log('manifest intercepted, movieId', result.movieId, 'raw tracks', result.timedtexttracks.length);
    const list = buildTrackList(result.timedtexttracks);
    SF.log('usable text tracks', list.length, list.map(function (t) { return t.label; }));
    if (!list.length) {
      SF.log('no text-based subtitle tracks found in this title');
      return;
    }
    state.tracks = list;
    state.tracksDirty = true;
    for (let slot = 0; slot < 2; slot++) {
      const lang = state.selectedLang[slot];
      if (!lang) continue;
      const match = state.tracks.find(function (t) { return t.bcp47 === lang; });
      if (match) SF.selectTrack(slot, match.id);
    }
  };

  SF.installManifestHook = function () {
    const _parse = JSON.parse;
    JSON.parse = function () {
      const result = _parse.apply(this, arguments);
      try {
        if (result && result.result && result.result.movieId) {
          if (result.result.timedtexttracks) {
            SF.handleManifest(result.result);
          } else {
            SF.log('manifest seen but no timedtexttracks, movieId', result.result.movieId);
          }
        }
      } catch (err) {
        SF.log('error handling manifest', err);
      }
      return result;
    };
  };
})();
