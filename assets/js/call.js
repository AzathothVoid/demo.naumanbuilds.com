// Browser call button for demo.naumanbuilds.com.
// Flow: POST the n8n webhook (CONTRACT.md) -> it creates the Retell web call server-side and
// returns a short-lived access token -> the Retell SDK joins the call with that token.
// The Retell API key never reaches this page.
(function () {
  var cfg = window.DEMO_CONFIG || {};
  var panel = document.getElementById('call');
  if (!panel) return;

  var SDK_URL = 'assets/vendor/retell-client-3.0.2.min.js';
  var TIMEOUT_MS = 8000;
  var els = {
    start: document.getElementById('call-start'),
    end: document.getElementById('call-end'),
    mute: document.getElementById('call-mute'),
    status: document.getElementById('call-status'),
    detail: document.getElementById('call-detail'),
    timer: document.getElementById('call-timer'),
    level: document.getElementById('call-level')
  };

  // Local testing only: ?mock=ok|busy|limited|offline|error on localhost.
  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var mock = isLocal ? new URLSearchParams(location.search).get('mock') : null;

  var session = null, timerId = null, levelId = null, startedAt = 0, muted = false;
  var wentLive = false, failed = false; // per call

  var listen = cfg.recording ? 'Listen to the recorded call below, or ' : '';
  var copy = {
    ready: ['Ready', 'Your browser will ask to use your microphone.'],
    connecting: ['Connecting…', 'Allow microphone access if your browser asks.'],
    live: ['Live', 'Say hello. The receptionist speaks first.'],
    ended: ['Call ended', 'If the receptionist confirmed a booking, it is now in the demo calendar and CRM sheet.'],
    busy: ['Demo line is busy', "Today's demo calls are used up. " + (listen ? listen + 'try again tomorrow.' : 'Please try again tomorrow.')],
    limited: ['Please wait a little', 'You just made a call. You can try again in {min} min.'],
    offline: ['Demo offline', 'The demo is offline right now. ' + (listen || 'You can ') + "email nauman@naumanbuilds.com and I'll walk you through it live."],
    mic: ['Microphone blocked', 'Allow microphone access for this site in your browser settings, then try again.'],
    error: ['Something went wrong', 'The call could not start. Please try again in a minute.']
  };

  function show(state, vars) {
    panel.setAttribute('data-state', state);
    var c = copy[state];
    els.status.textContent = c[0];
    var d = c[1];
    if (vars) Object.keys(vars).forEach(function (k) { d = d.replace('{' + k + '}', vars[k]) });
    els.detail.textContent = d;
    var inCall = state === 'connecting' || state === 'live';
    els.start.hidden = inCall;
    els.end.hidden = !inCall;
    els.mute.hidden = state !== 'live';
    els.start.disabled = state === 'busy' || state === 'offline';
    els.start.textContent = state === 'ended' ? 'Call again' : 'Talk in your browser';
    if (!inCall) stopClock();
  }

  function visitorId() {
    var id = null;
    try { id = localStorage.getItem('nsd_visitor') } catch (e) {}
    if (!id) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
      try { localStorage.setItem('nsd_visitor', id) } catch (e) {}
    }
    return id;
  }

  function startClock() {
    startedAt = Date.now();
    els.timer.hidden = false;
    tick();
    timerId = setInterval(tick, 1000);
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) levelId = requestAnimationFrame(meter);
  }
  function tick() {
    var s = Math.floor((Date.now() - startedAt) / 1000);
    els.timer.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' / ' + (cfg.maxMinutes || 8) + ':00';
  }
  function meter() {
    var v = 0;
    try { v = session && session.analyzerComponent ? session.analyzerComponent.calculateVolume() : 0 } catch (e) {}
    els.level.style.setProperty('--level', Math.min(1, v * 4).toFixed(2));
    levelId = requestAnimationFrame(meter);
  }
  function stopClock() {
    clearInterval(timerId); timerId = null;
    if (levelId) cancelAnimationFrame(levelId); levelId = null;
    els.level.style.setProperty('--level', 0);
    els.timer.hidden = true;
  }

  // Ask the webhook for a call. Resolves to {state} or {state:'ok', call}.
  function requestCall() {
    if (mock) return mockRequest(mock);
    if (!cfg.webcallUrl) return Promise.resolve({ state: 'offline' });
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort() }, TIMEOUT_MS);
    return fetch(cfg.webcallUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitor_id: visitorId(), page_version: '1' }),
      signal: ctrl.signal
    }).then(function (res) {
      return res.json().catch(function () { return {} }).then(function (body) {
        if (res.ok && body.status === 'ok' && body.access_token && body.call_id) return { state: 'ok', call: body };
        if (body.status === 'cap_reached') return { state: 'busy' };
        if (body.status === 'rate_limited') return { state: 'limited', min: Math.max(1, Math.ceil((body.retry_after_s || 60) / 60)) };
        if (res.status === 503 || body.status === 'unavailable') return { state: 'offline' };
        return { state: 'error' };
      });
    }).catch(function () {
      return { state: 'offline' }; // timeout, tunnel down, CORS, network
    }).finally(function () { clearTimeout(t) });
  }

  function mockRequest(kind) {
    return new Promise(function (r) {
      setTimeout(function () {
        if (kind === 'ok') r({ state: 'ok', call: null });
        else if (kind === 'limited') r({ state: 'limited', min: 3 });
        else r({ state: kind });
      }, 600);
    });
  }

  // Join the call with the Retell SDK. The SDK's own create-call request is answered
  // locally with the token our webhook returned, so it never contacts Retell's API with a key.
  function join(call) {
    return import(new URL(SDK_URL, document.baseURI).href).then(function (mod) {
      var token = {
        call_id: call.call_id,
        access_token: call.access_token,
        transport: call.transport,
        url: call.url,
        ice_servers: call.ice_servers,
        expires_at: call.expires_at
      };
      var client = new mod.RetellClient({
        key: 'server-side-token',
        fetch: function (url) {
          if (String(url).indexOf('/v3/create-web-call') > -1) {
            return Promise.resolve(new Response(JSON.stringify(token), { status: 201, headers: { 'Content-Type': 'application/json' } }));
          }
          return Promise.reject(new Error('Blocked request from page: ' + url));
        }
      });
      session = client.createWebCall({
        agent_id: 'server-selected',
        hooks: {
          onStatus: function (s) {
            if (s === 'live') { wentLive = true; show('live'); startClock(); try { session.startAudioPlayback() } catch (e) {} }
          },
          onEnd: function () {
            session = null;
            if (!failed) show(wentLive ? 'ended' : 'error'); // never connected: don't claim a call happened
          },
          onError: function (err) {
            if (wentLive) return; // mid-call errors end the call; onEnd reports it
            failed = true;
            var name = err && (err.name || '') + ' ' + (err.message || '');
            show(/NotAllowed|Permission|denied/i.test(name) ? 'mic' : 'error');
            if (session) { try { session.end() } catch (e) {} }
            session = null;
          }
        }
      });
    });
  }

  function mockLive() {
    wentLive = true; show('live'); startClock();
    session = { end: function () { session = null; show('ended'); return Promise.resolve() }, mute: function () {}, unmute: function () {} };
  }

  els.start.addEventListener('click', function () {
    wentLive = false; failed = false; muted = false;
    els.mute.setAttribute('aria-pressed', 'false'); els.mute.textContent = 'Mute';
    show('connecting');
    requestCall().then(function (r) {
      if (r.state !== 'ok') { show(r.state, { min: r.min }); return; }
      if (!r.call) { mockLive(); return; }
      return join(r.call);
    }).catch(function () { show('error') });
  });

  els.end.addEventListener('click', function () {
    if (session) session.end(); else show('ready');
  });

  els.mute.addEventListener('click', function () {
    if (!session) return;
    muted = !muted;
    if (muted) session.mute(); else session.unmute();
    els.mute.setAttribute('aria-pressed', String(muted));
    els.mute.textContent = muted ? 'Unmute' : 'Mute';
  });

  window.addEventListener('pagehide', function () { if (session) session.end() });

  show(cfg.webcallUrl || mock ? 'ready' : 'offline');
})();
