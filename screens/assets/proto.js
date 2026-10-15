/*
 * Shared prototype layer, loaded by every screen.
 *
 * - Proto.goals / getGoal / addGoal / updateGoal: a tiny goals store kept in
 *   localStorage so a goal created or edited on one screen shows up on the
 *   others (Home, Goals, Goal details, Edit goal).
 * - Proto.go(href, dir): navigation. Inside the phone shell (../index.html)
 *   it hands the link to the shell so screens slide in like a native app;
 *   opened on its own, a screen just follows the link.
 */
(function () {
  'use strict';

  var KEY = 'finance-proto:goals:v1';
  var TODAY = new Date(2026, 9, 10); // the prototype's "today": Sat 10 Oct 2026
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAY = 86400000;

  var PRIORITY = {
    high: { label: 'High', colour: '#B93A2B' },
    medium: { label: 'Medium', colour: '#F2BE2E' },
    minimal: { label: 'Minimal', colour: '#5FA83F' }
  };

  // Lucide icons flattened to a single path so they can be bound to one <path d>.
  function c(cx, cy, r) {
    return 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0';
  }
  function rect(x, y, w, h, r) {
    return 'M' + (x + r) + ' ' + y + 'h' + (w - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + r + 'v' + (h - 2 * r) +
      'a' + r + ' ' + r + ' 0 0 1 ' + -r + ' ' + r + 'h' + -(w - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1 ' + -r + ' ' + -r +
      'v' + -(h - 2 * r) + 'a' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + -r + 'z';
  }
  var ICONS = {
    route: [c(6, 19, 3), 'M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15', c(18, 5, 3)],
    gift: [rect(3, 8, 18, 4, 1), 'M12 8v13', 'M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7', 'M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5'],
    game: ['M6 11h4', 'M8 9v4', 'M15 12h.01', 'M18 10h.01', 'M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z'],
    ticket: ['M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z', 'M13 5v2', 'M13 17v2', 'M13 11v2'],
    car: ['M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2', c(7, 17, 2), 'M9 17h6', c(17, 17, 2)],
    bike: [c(18.5, 17.5, 3.5), c(5.5, 17.5, 3.5), c(15, 5, 1), 'M12 17.5V14l-3-3 4-3 2 3h2'],
    home: ['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
    card: [rect(2, 5, 20, 14, 2), 'M2 10h20'],
    smile: [c(12, 12, 10), 'M8 14s1.5 2 4 2 4-2 4-2', 'M9 9h.01', 'M15 9h.01'],
    umbrella: ['M22 12a10.06 10.06 1 0 0-20 0Z', 'M12 12v8a2 2 0 0 0 4 0', 'M12 2v1'],
    target: [c(12, 12, 10), c(12, 12, 6), c(12, 12, 2)]
  };
  Object.keys(ICONS).forEach(function (k) { ICONS[k] = ICONS[k].join(''); });

  // Goal types offered on "New goal · type" → icon used for the new goal.
  var TYPES = {
    home: { icon: 'home', label: 'Buy a home' },
    debt: { icon: 'card', label: 'Pay off debt' },
    car: { icon: 'car', label: 'Buy a car' },
    retirement: { icon: 'smile', label: 'Plan for retirement' },
    vacation: { icon: 'umbrella', label: 'Plan a vacation' },
    other: { icon: 'target', label: 'Other' }
  };

  var SEED = [
    { id: 'road-trip', name: 'North Island road trip', icon: 'route', saved: 100, target: 600, priority: 'medium', pinned: true, started: '2026-09-21', due: '2027-02-13',
      desc: 'Return fuel from Hamilton to Whangārei (about $140), 3 nights in a holiday park cabin (about $330), and food and activities (about $130).' },
    { id: 'birthday', name: "Matt's birthday gift", icon: 'gift', saved: 50, target: 100, priority: 'high', pinned: true, started: '2026-09-26', due: '2026-11-14',
      desc: "Noise-cancelling headphones for Matt's birthday on 14 November." },
    { id: 'switch-2', name: 'Switch 2', icon: 'game', saved: 200, target: 1000, priority: 'minimal', pinned: false, started: '2026-06-06', due: '2027-06-05',
      desc: 'Console plus one game. Waiting for a sale is fine.' },
    { id: 'concert', name: 'Concert tickets', icon: 'ticket', saved: 15, target: 199, priority: 'minimal', pinned: false, started: '2026-10-03', due: '2027-03-20',
      desc: 'Two general admission tickets at Spark Arena.' },
    { id: 'car', name: 'Pay off car', icon: 'car', saved: 200, target: 12500, priority: 'medium', pinned: false, started: '2026-08-01', due: '2028-12-01',
      desc: 'Remaining balance on the car loan.' },
    { id: 'bike', name: 'Bike repair', icon: 'bike', saved: 170, target: 170, priority: 'minimal', pinned: false, started: '2026-08-15', due: '2026-10-02',
      desc: 'New chain, brake pads and a service at the bike shop.' }
  ];

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { /* storage unavailable: fall back to the seed data */ }
    return SEED.map(function (g) { return Object.assign({}, g); });
  }
  var memory = null;
  function all() {
    if (!memory) memory = load();
    return memory;
  }
  function save(list) {
    memory = list;
    try { window.localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* in-memory only */ }
  }

  function parseISO(s) {
    var p = String(s).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function money(n) {
    var whole = Math.round(n * 100) % 100 === 0;
    return '$' + n.toLocaleString('en-NZ', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
  }

  // Everything a screen needs to draw a goal.
  function view(g) {
    var due = parseISO(g.due);
    var started = parseISO(g.started);
    var pctExact = g.target > 0 ? (g.saved / g.target) * 100 : 0;
    var done = g.saved >= g.target;
    var pct = done ? 100 : Math.min(99, Math.round(pctExact));
    var daysLeft = Math.max(0, Math.round((due - TODAY) / DAY));
    var total = Math.max(1, Math.round((due - started) / DAY));
    var expected = Math.min(1, Math.max(0, (TODAY - started) / DAY / total));
    var behind = !done && daysLeft > 0 && g.saved / g.target < expected * 0.8;
    var overdue = !done && daysLeft === 0;
    var weekly = Math.ceil((g.target - g.saved) / Math.max(1, daysLeft / 7));
    var pr = PRIORITY[g.priority] || PRIORITY.minimal;
    var dueShort = due.getDate() + ' ' + MONTHS[due.getMonth()];
    return {
      id: g.id,
      name: g.name,
      desc: g.desc || '',
      hasDesc: !!(g.desc && g.desc.trim()),
      icon: ICONS[g.icon] || ICONS.target,
      href: 'Goal-details.dc.html?id=' + encodeURIComponent(g.id),
      editHref: 'Edit-goal.dc.html?id=' + encodeURIComponent(g.id),
      pinned: !!g.pinned && !done,
      done: done,
      active: !done,
      pct: pct,
      progress: money(g.saved) + ' of ' + money(g.target) + ' · ' + pct + '%',
      saved: g.saved,
      target: g.target,
      savedOfTarget: money(g.saved) + ' of ' + money(g.target),
      colour: done ? '#2E7333' : pr.colour,
      priorityLabel: pr.label,
      priorityColour: pr.colour,
      srPriority: done ? '' : ' · ' + pr.label + ' priority',
      iconBg: done ? '#2E7333' : '#E6F4D8',
      iconFg: done ? '#FFFFFF' : '#2E7333',
      strike: done ? 'line-through' : 'none',
      // ring: r = 70 → circumference 439.82
      ringDash: (439.82 * pct / 100).toFixed(1) + ' 439.82',
      dueLong: due.getDate() + ' ' + MONTHS_LONG[due.getMonth()] + ' ' + due.getFullYear(),
      dueLine: done ? 'Completed' : (g.pinned ? 'Pinned · ' : '') + 'save by ' + due.getDate() + ' ' + MONTHS_LONG[due.getMonth()] + ' ' + due.getFullYear(),
      startedLong: started.getDate() + ' ' + MONTHS[started.getMonth()] + ' ' + started.getFullYear(),
      remaining: done ? 'Done' : daysLeft === 1 ? '1 day' : daysLeft + ' days',
      status: done ? 'Goal reached' : overdue ? 'Past the save-by date' : behind ? 'Behind schedule' : 'On schedule',
      statusColour: done || (!behind && !overdue) ? '#2E7333' : '#A15C07',
      plan: done
        ? 'You saved ' + money(g.target) + '. Nice work.'
        : overdue
          ? money(g.target - g.saved) + ' still to go. Edit the goal to pick a new date.'
          : 'Put in ' + money(weekly) + ' a week to reach ' + money(g.target) + ' by ' + dueShort + '.',
      day: String(due.getDate()).padStart(2, '0'),
      month: String(due.getMonth() + 1).padStart(2, '0'),
      year: String(due.getFullYear()),
      amount: g.target.toFixed(2),
      priority: g.priority
    };
  }

  function param(name) {
    try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; }
  }

  var Proto = {
    TODAY: TODAY,
    ICONS: ICONS,
    TYPES: TYPES,
    money: money,
    param: param,
    goals: function () { return all().map(view); },
    getGoal: function (id) {
      var list = all();
      var g = list.filter(function (x) { return x.id === id; })[0] || list[0];
      return g ? view(g) : null;
    },
    addGoal: function (data) {
      var list = all().slice();
      var id = 'g' + Date.now().toString(36);
      list.push({
        id: id, name: data.name, icon: data.icon || 'target', saved: 0, target: data.target,
        priority: data.priority, pinned: !!data.pinned, started: iso(TODAY), due: data.due, desc: data.desc || ''
      });
      save(list);
      return id;
    },
    updateGoal: function (id, patch) {
      save(all().map(function (g) { return g.id === id ? Object.assign({}, g, patch) : g; }));
    },
    reset: function () {
      memory = null;
      try { window.localStorage.removeItem(KEY); } catch (e) { /* nothing stored */ }
    },
    // dir: 'forward' | 'back' | 'tab' | 'auto'
    go: function (href, dir) {
      var shell = null;
      try { shell = window.parent !== window && window.parent.__phoneShell; } catch (e) { shell = null; }
      if (shell) shell.navigate(href, dir || 'auto');
      else window.location.href = href;
    }
  };
  window.Proto = Proto;

  // Inside the phone shell the status bar and home indicator are drawn over
  // the screen, so leave room for them (overlays still cover that space).
  (function () {
    var shell = null;
    try { shell = window.parent !== window && window.parent.__phoneShell; } catch (e) { shell = null; }
    var inset = shell && shell.insets ? shell.insets() : null;
    if (!inset || (!inset.top && !inset.bottom)) return;
    var css = document.createElement('style');
    css.textContent =
      '#dc-root>div>div{padding-top:' + inset.top + 'px!important}' +
      'nav[aria-label="Main"]{padding-bottom:' + inset.bottom + 'px!important}';
    document.head.appendChild(css);
  })();

  // Route every screen link through Proto.go so the shell can animate it.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href');
    if (href === '#' || href === '') { e.preventDefault(); return; }
    if (!/\.dc\.html(\?|#|$)/.test(href)) return;
    e.preventDefault();
    var label = a.getAttribute('aria-label') || '';
    var dir = a.closest('nav[aria-label="Main"]') ? 'tab' : /^back\b/i.test(label) ? 'back' : 'auto';
    Proto.go(href, dir);
  }, true);
})();
