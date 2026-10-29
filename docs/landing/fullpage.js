'use strict';

/* One deliberate gesture, one complete screen. No native document scrolling. */
(() => {
  const root = document.documentElement;
  const body = document.body;
  const viewport = document.querySelector('#main');
  const track = document.querySelector('#page-track');
  if (!viewport || !track) return;

  const panels = [...track.children].filter(el => el.matches('section'));
  if (!panels.length) return;
  const dots = [...document.querySelectorAll('#page-pagination [data-page-index]')];
  const previous = document.querySelector('#page-prev');
  const next = document.querySelector('#page-next');
  const currentCounter = document.querySelector('#page-current');
  const totalCounter = document.querySelector('#page-total');
  const pageLabel = document.querySelector('#page-label');
  const announcement = document.querySelector('#page-announcement');
  const menu = document.querySelector('#menu-toggle');
  const headerInner = document.querySelector('.site-header .header-inner');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ids = panels.map(panel => panel.id);
  const pageNames = {
    zh: ['概览', '论文解读', '复现实例', '工作流程', '开始使用'],
    en: ['Overview', 'Understand', 'A real run', 'How it works', 'Get started']
  };
  const WHEEL_IDLE_MS = 210;
  const WHEEL_THRESHOLD = 45;
  const SWIPE_THRESHOLD = 45;
  let pageHeight = 1;
  let currentIndex = indexForHash();
  let locked = false;
  let finishTimer = 0;
  let restoreFrame = 0;
  let resizeFrame = 0;
  let wheelLastAt = -Infinity;
  let wheelSum = 0;
  let wheelDirection = 0;
  let wheelConsumed = false;
  let touch = null;

  const isEnglish = () => root.lang.toLowerCase().startsWith('en');
  const text = (zh, en) => isEnglish() ? en : zh;
  const pad = value => String(value).padStart(2, '0');
  const paused = () => Boolean(document.querySelector('dialog[open]')) || menu?.getAttribute('aria-expanded') === 'true';

  function indexForHash() {
    let hash = location.hash.slice(1);
    try { hash = decodeURIComponent(hash); } catch (_) {}
    const match = ids ? ids.indexOf(hash) : -1;
    return match < 0 ? 0 : match;
  }

  function duration() {
    if (reducedMotion.matches) return 0;
    const value = getComputedStyle(root).getPropertyValue('--fp-duration').trim();
    const number = parseFloat(value);
    if (!Number.isFinite(number)) return 950;
    return Math.max(0, value.endsWith('ms') ? number : value.endsWith('s') ? number * 1000 : number);
  }

  function restoreTransition() {
    if (restoreFrame) cancelAnimationFrame(restoreFrame);
    restoreFrame = 0;
    track.style.transition = '';
    track.style.transitionDuration = reducedMotion.matches ? '0ms' : '';
  }

  // Native dialog focus restoration can scroll overflow:hidden containers.
  // CSS overflow:clip prevents that; this also pins browsers using the fallback.
  function pinViewport() {
    if (viewport.scrollTop) viewport.scrollTop = 0;
    if (viewport.scrollLeft) viewport.scrollLeft = 0;
  }

  viewport.addEventListener('scroll', pinViewport, { passive: true });

  function placeTrack() {
    pinViewport();
    track.style.transform = `translate3d(0, ${-currentIndex * pageHeight}px, 0)`;
  }

  function updateControls(announce = false) {
    const names = pageNames[isEnglish() ? 'en' : 'zh'];
    const name = names[currentIndex] || panels[currentIndex].getAttribute('aria-label') || panels[currentIndex].id;
    if (currentCounter) currentCounter.textContent = pad(currentIndex + 1);
    if (totalCounter) totalCounter.textContent = pad(panels.length);
    if (pageLabel) pageLabel.textContent = name;
    body.dataset.pageTone = currentIndex === 0 || currentIndex === panels.length - 1 ? 'dark' : 'light';
    body.dataset.pageId = panels[currentIndex].id;
    body.dataset.pageIndex = String(currentIndex);
    dots.forEach(button => {
      const index = Number(button.dataset.pageIndex);
      const active = index === currentIndex;
      const title = names[index] || panels[index]?.id || '';
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
      button.classList.toggle('is-active', active);
      button.dataset.label = title;
      button.title = title;
      button.setAttribute('aria-label', text(`第 ${index + 1} 屏：${title}`, `Page ${index + 1}: ${title}`));
    });
    if (previous) {
      previous.disabled = currentIndex === 0;
      previous.setAttribute('aria-label', text('上一屏', 'Previous page'));
      previous.title = text('上一屏 · ↑', 'Previous page · ↑');
    }
    if (next) {
      next.disabled = currentIndex === panels.length - 1;
      next.setAttribute('aria-label', text('下一屏', 'Next page'));
      next.title = text('下一屏 · ↓', 'Next page · ↓');
    }
    if (announce && announcement) {
      announcement.textContent = text(`第 ${currentIndex + 1} 屏，共 ${panels.length} 屏：${name}`, `Page ${currentIndex + 1} of ${panels.length}: ${name}`);
    }
  }

  function activatePanels(oldIndex, allowFocus = true) {
    const activePanel = panels[currentIndex];
    const focused = document.activeElement;
    const focusWasInOutgoingPanel = oldIndex !== currentIndex && panels[oldIndex]?.contains(focused);
    activePanel.inert = false;
    activePanel.removeAttribute('aria-hidden');
    if (allowFocus && focusWasInOutgoingPanel) activePanel.focus({ preventScroll: true });
    panels.forEach((panel, index) => {
      const active = index === currentIndex;
      panel.classList.toggle('is-active', active);
      panel.inert = !active;
      if (active) panel.removeAttribute('aria-hidden');
      else panel.setAttribute('aria-hidden', 'true');
    });
  }

  function endTransition(announce = true) {
    if (finishTimer) clearTimeout(finishTimer);
    finishTimer = 0;
    locked = false;
    root.classList.remove('is-paging');
    body.dataset.pageTransition = 'idle';
    updateControls(announce);
  }

  function saveHash(mode) {
    if (mode === 'none') return;
    const wanted = '#' + panels[currentIndex].id;
    if (location.hash === wanted) return;
    const oldState = history.state && typeof history.state === 'object' ? history.state : {};
    const state = { ...oldState, paperReproPage: panels[currentIndex].id };
    try {
      if (mode === 'replace') history.replaceState(state, '', wanted);
      else history.pushState(state, '', wanted);
    } catch (_) {
      // Paging still works when a restricted embedding disallows history writes.
    }
  }

  function goTo(index, options = {}) {
    if (!Number.isFinite(Number(index))) return false;
    const target = Math.max(0, Math.min(panels.length - 1, Math.trunc(Number(index))));
    if (paused() && !options.force) return false;
    if (locked && !options.force) return false;
    if (target === currentIndex) return false;
    if (options.force) endTransition(false);
    restoreTransition();
    const oldIndex = currentIndex;
    const milliseconds = options.animate === false ? 0 : duration();
    if (!milliseconds) track.style.transition = 'none';
    // Commit the old position before starting a transition after a resize.
    void track.offsetHeight;
    currentIndex = target;
    activatePanels(oldIndex, options.focus !== false);
    updateControls(false);
    saveHash(options.history || 'push');
    locked = milliseconds > 0;
    root.classList.toggle('is-paging', locked);
    body.dataset.pageTransition = locked ? 'animating' : 'idle';
    placeTrack();
    document.dispatchEvent(new CustomEvent('paperrepro:pagechange', {
      detail: { index: currentIndex, previousIndex: oldIndex, id: panels[currentIndex].id }
    }));
    if (locked) finishTimer = window.setTimeout(() => endTransition(), milliseconds + 100);
    else {
      endTransition();
      restoreFrame = requestAnimationFrame(restoreTransition);
    }
    return true;
  }

  function refresh() {
    // Pinch zoom remains native; do not resize the composition under the pinch.
    if (window.visualViewport && Math.abs(window.visualViewport.scale - 1) > .02) return;
    endTransition(false);
    restoreTransition();
    const headerHeight = Math.round(headerInner?.getBoundingClientRect().height || 0);
    const screenHeight = Math.round(window.visualViewport?.height || window.innerHeight);
    pageHeight = Math.max(1, screenHeight - headerHeight);
    root.style.setProperty('--fp-header-height', `${headerHeight}px`);
    root.style.setProperty('--fp-page-height', `${pageHeight}px`);
    track.style.transition = 'none';
    placeTrack();
    // Flush this snap, then restore the shared CSS easing on the next frame.
    void track.offsetHeight;
    restoreFrame = requestAnimationFrame(restoreTransition);
    activatePanels(currentIndex, false);
    updateControls(false);
  }

  function scheduleRefresh() {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; refresh(); });
  }

  function onWheel(event) {
    // Trackpad pinch and browser zoom must keep their native behavior.
    if (event.ctrlKey || event.metaKey) return;
    const scrollBox = event.target.closest('.cinema-panel > .wrap');
    if (scrollBox && scrollBox.scrollHeight > scrollBox.clientHeight + 2 && ((event.deltaY > 0 && scrollBox.scrollTop + scrollBox.clientHeight < scrollBox.scrollHeight - 2) || (event.deltaY < 0 && scrollBox.scrollTop > 1))) return;
    const now = performance.now();
    if (paused() || isEditing(event.target)) {
      wheelLastAt = now;
      wheelConsumed = true;
      wheelSum = 0;
      return;
    }
    if (event.cancelable) event.preventDefault();
    if (now - wheelLastAt > WHEEL_IDLE_MS) {
      wheelConsumed = false;
      wheelSum = 0;
      wheelDirection = 0;
    }
    wheelLastAt = now;
    if (locked) {
      wheelConsumed = true;
      wheelSum = 0;
      return;
    }
    if (wheelConsumed || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? pageHeight : 1;
    const delta = event.deltaY * multiplier;
    if (Math.abs(delta) < .5) return;
    const direction = Math.sign(delta);
    if (direction !== wheelDirection) wheelSum = 0;
    wheelDirection = direction;
    wheelSum += delta;
    if (Math.abs(wheelSum) < WHEEL_THRESHOLD) return;
    wheelConsumed = true;
    wheelSum = 0;
    goTo(currentIndex + direction);
  }

  function isEditing(element) {
    return element instanceof Element && (element.isContentEditable || Boolean(element.closest('input, textarea, select, [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"]')));
  }

  function onKey(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || paused()) return;
    const target = event.target;
    if (isEditing(target) || target instanceof Element && target.closest('[role="tab"], [role="tablist"]')) return;
    const isSpace = event.key === ' ' || event.key === 'Spacebar';
    if (isSpace && target instanceof Element && target.closest('button, a, summary, [role="button"]')) return;
    let destination;
    if (event.key === 'ArrowDown' || event.key === 'PageDown' || isSpace && !event.shiftKey) destination = currentIndex + 1;
    else if (event.key === 'ArrowUp' || event.key === 'PageUp' || isSpace && event.shiftKey) destination = currentIndex - 1;
    else if (event.key === 'Home') destination = 0;
    else if (event.key === 'End') destination = panels.length - 1;
    else return;
    event.preventDefault();
    if (!event.repeat && !locked) goTo(destination);
  }

  function onTouchStart(event) {
    const box = event.target.closest('.cinema-panel > .wrap');
    if (box && box.scrollHeight > box.clientHeight + 2) { touch = null; return; }
    if (event.touches.length !== 1 || paused() || locked || isEditing(event.target)) { touch = null; return; }
    const point = event.touches[0];
    touch = { id: point.identifier, x: point.clientX, y: point.clientY, vertical: false };
  }

  function onTouchMove(event) {
    if (!touch || event.touches.length !== 1 || paused()) { touch = null; return; }
    const point = event.touches[0];
    const dx = point.clientX - touch.x;
    const dy = point.clientY - touch.y;
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx) * 1.15) {
      touch.vertical = true;
      if (event.cancelable) event.preventDefault();
    }
  }

  function onTouchEnd(event) {
    const start = touch;
    touch = null;
    if (!start || paused() || locked || event.touches.length) return;
    const point = [...event.changedTouches].find(item => item.identifier === start.id);
    if (!point) return;
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    if (Math.abs(dy) >= SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx) * 1.15) {
      if (event.cancelable) event.preventDefault();
      goTo(currentIndex + (dy < 0 ? 1 : -1));
    }
  }

  function onAnchor(event) {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    if (!link || link.hasAttribute('download') || link.target === '_blank') return;
    const hash = link.getAttribute('href').slice(1);
    if (hash === 'main') {
      event.preventDefault();
      panels[currentIndex].focus({ preventScroll: true });
      return;
    }
    const index = ids.indexOf(hash);
    if (index < 0) return;
    event.preventDefault();
    goTo(index);
  }

  function fromHistory() {
    const target = indexForHash();
    if (target !== currentIndex) goTo(target, { history: 'none', force: true, animate: !locked });
  }

  panels.forEach(panel => { if (!panel.hasAttribute('tabindex')) panel.tabIndex = -1; });
  viewport.tabIndex = -1;
  root.classList.add('fullpage-ready');
  try { history.scrollRestoration = 'manual'; } catch (_) {}
  dots.forEach(button => button.addEventListener('click', () => goTo(Number(button.dataset.pageIndex))));
  previous?.addEventListener('click', () => goTo(currentIndex - 1));
  next?.addEventListener('click', () => goTo(currentIndex + 1));
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd, { passive: false });
  document.addEventListener('touchcancel', () => { touch = null; }, { passive: true });
  document.addEventListener('click', onAnchor);
  window.addEventListener('hashchange', fromHistory);
  window.addEventListener('popstate', fromHistory);
  window.addEventListener('resize', scheduleRefresh);
  window.addEventListener('orientationchange', scheduleRefresh);
  window.visualViewport?.addEventListener('resize', scheduleRefresh);
  reducedMotion.addEventListener('change', scheduleRefresh);
  track.addEventListener('transitionend', event => {
    if (event.target === track && event.propertyName === 'transform' && locked) endTransition();
  });
  new MutationObserver(() => updateControls(false)).observe(root, { attributes: true, attributeFilter: ['lang'] });
  if (headerInner && 'ResizeObserver' in window) new ResizeObserver(scheduleRefresh).observe(headerInner);
  window.PaperReproPager = Object.freeze({
    goTo: index => goTo(index),
    refresh,
    get currentIndex() { return currentIndex; }
  });
  refresh();
})();
