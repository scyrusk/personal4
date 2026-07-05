// Client-side journey events for the visitor-flow sankey. The public site is
// a single scrolling page, so server-side pageviews alone can't show what a
// visitor does; this reports section views, outbound/email clicks, and CV
// downloads to POST /analytics/event, where Analytics::Tracker sessionizes
// them like any other journey step.
(function() {
  'use strict';

  var ENDPOINT = '/analytics/event';
  // Must match AnalyticsEventsController::SECTIONS and the section ids in
  // static_pages/index.html.haml.
  var SECTIONS = ['about', 'recruiting', 'students', 'publications'];
  // Hosts that are this site (papers are linked absolutely under both).
  var INTERNAL_HOSTS = ['sauvikdas.com', 'sauvik.me'];
  // A section only counts as viewed after staying on screen this long, so
  // sections flashing past during a jump to #publications aren't recorded.
  var DWELL_MS = 1000;
  // The server chains journey steps by arrival order, so events are sent one
  // at a time with a gap instead of racing each other.
  var SEND_SPACING_MS = 400;

  if (window.location.pathname.indexOf('/admin') === 0) return;
  if (!window.URLSearchParams || !(navigator.sendBeacon || window.fetch)) return;

  var queue = [];
  var sendTimer = null;

  function transmit(data) {
    var body = new URLSearchParams(data);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, body);
    } else {
      window.fetch(ENDPOINT, {
        method: 'POST', body: body, keepalive: true, credentials: 'same-origin'
      }).catch(function() {});
    }
  }

  function pump() {
    if (sendTimer || !queue.length) return;
    transmit(queue.shift());
    sendTimer = setTimeout(function() { sendTimer = null; pump(); }, SEND_SPACING_MS);
  }

  function enqueue(data) {
    queue.push(data);
    pump();
  }

  // Don't lose queued events when the visitor leaves mid-gap; beacons
  // survive unload.
  window.addEventListener('pagehide', function() {
    while (queue.length) transmit(queue.shift());
  });

  document.addEventListener('click', function(e) {
    var target = e.target;
    if (!target || !target.closest) return;
    var anchor = target.closest('a[href]');
    if (!anchor) return;

    var tracked = anchor.getAttribute('data-analytics-event');
    if (tracked) return enqueue({ event: tracked });
    if (anchor.protocol === 'mailto:') return enqueue({ event: 'email_click' });
    if (anchor.protocol !== 'http:' && anchor.protocol !== 'https:') return;

    var host = anchor.hostname.toLowerCase().replace(/^www\./, '');
    if (host === window.location.hostname.toLowerCase().replace(/^www\./, '')) return;
    if (INTERNAL_HOSTS.indexOf(host) !== -1) return;
    enqueue({ event: 'outbound_click', url: anchor.href });
  }, true);

  function observeSections() {
    if (!window.IntersectionObserver) return;
    var targets = SECTIONS.map(function(id) { return document.getElementById(id); })
                          .filter(function(el) { return el; });
    if (!targets.length) return;

    var sent = {};
    var dwell = {};
    // Fine-grained thresholds so tall sections (which never reach ratio 0.5)
    // still get callbacks as their visible height changes.
    var thresholds = [];
    for (var t = 0; t <= 20; t++) thresholds.push(t / 20);

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        var id = entry.target.id;
        if (sent[id]) return;
        var inView = entry.isIntersecting &&
          (entry.intersectionRatio >= 0.5 ||
           entry.intersectionRect.height >= window.innerHeight * 0.5);
        if (inView && !dwell[id]) {
          dwell[id] = setTimeout(function() {
            delete dwell[id];
            sent[id] = true;
            observer.unobserve(entry.target);
            enqueue({ event: 'section_view', section: id });
          }, DWELL_MS);
        } else if (!inView && dwell[id]) {
          clearTimeout(dwell[id]);
          delete dwell[id];
        }
      });
    }, { threshold: thresholds });

    targets.forEach(function(el) { observer.observe(el); });
  }

  function init() {
    if (!document.body || document.body.hasAttribute('data-journey-init')) return;
    document.body.setAttribute('data-journey-init', '');

    // Sections initially on screen only count once the visitor actually
    // engages; a bounce that never scrolls stays a one-step journey.
    var engaged = false;
    function engage() {
      if (engaged) return;
      engaged = true;
      observeSections();
    }
    ['scroll', 'wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function(type) {
      window.addEventListener(type, engage, { passive: true, capture: true, once: true });
    });
  }

  document.addEventListener('turbolinks:load', init);
  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
