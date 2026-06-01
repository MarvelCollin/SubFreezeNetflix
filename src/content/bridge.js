chrome.runtime.onMessage.addListener(function (msg) {
  if (msg && msg.type === 'subfreeze-toggle') {
    window.postMessage({ __subfreeze: true, action: 'toggle' }, '*');
  }
});
