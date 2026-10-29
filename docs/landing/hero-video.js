'use strict';
(() => {
  const video = document.getElementById('hero-video');
  const toggle = document.getElementById('hero-video-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = reduced.matches;
  let onHero = !location.hash || location.hash === '#top';
  video.muted = true;
  video.defaultMuted = true;
  const label = () => {
    const en = document.documentElement.lang.startsWith('en');
    toggle.textContent = video.paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', video.paused ? (en ? 'Play background video' : '播放背景视频') : (en ? 'Pause background video' : '暂停背景视频'));
  };
  const sync = () => {
    if (userPaused || !onHero || document.hidden) video.pause();
    else video.play().catch(label);
    label();
  };
  toggle.addEventListener('click', () => { userPaused = !video.paused; sync(); });
  video.addEventListener('play', label);
  video.addEventListener('pause', label);
  document.addEventListener('paperrepro:pagechange', e => { onHero = e.detail.id === 'top'; sync(); });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => { userPaused = reduced.matches; sync(); });
  new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  sync();
})();
