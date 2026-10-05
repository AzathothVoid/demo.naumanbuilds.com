// Shows the phone number and the recorded call once they are set in config.js.
(function () {
  var cfg = window.DEMO_CONFIG || {};

  if (cfg.phone && cfg.phone.tel && cfg.phone.display) {
    var link = document.getElementById('phone-link');
    link.href = 'tel:' + cfg.phone.tel;
    link.textContent = cfg.phone.display;
    document.getElementById('phone').hidden = false;
  }

  if (cfg.recording) {
    document.getElementById('recording').src = cfg.recording;
    document.getElementById('recording-sec').hidden = false;
  }
})();
