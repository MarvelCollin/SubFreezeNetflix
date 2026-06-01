(function () {
  const SF = window.__SubFreeze;

  SF.getPlayer = function () {
    const nf = window.netflix;
    if (!nf || !nf.appContext || !nf.appContext.state) return null;
    const playerApp = nf.appContext.state.playerApp;
    if (!playerApp || !playerApp.getAPI) return null;
    const api = playerApp.getAPI();
    const videoPlayer = api && api.videoPlayer;
    if (!videoPlayer) return null;
    const ids = videoPlayer.getAllPlayerSessionIds();
    if (!ids || !ids.length) return null;
    let id = ids[0];
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i]).indexOf('watch') !== -1) {
        id = ids[i];
        break;
      }
    }
    return videoPlayer.getVideoPlayerBySessionId(id);
  };

  SF.seekTo = function (seconds) {
    const player = SF.getPlayer();
    if (!player) return;
    player.seek(Math.max(0, Math.round(seconds * 1000)));
  };
})();
