import manifest from './video-manifest.json';
import localVideoIDs from 'virtual:team-hawks-videos';

const safeURL = (value) => {
  if (!value) return '';
  try {
    const url = new URL(value, document.baseURI);
    return url.protocol === 'https:' || url.origin === location.origin ? url.href : '';
  } catch { return ''; }
};

export function initVideos(listen) {
  const players = new Set();
  const available = new Set(localVideoIDs);
  const loading = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      loading.unobserve(target);
      const spec = manifest.find((entry) => entry.id === target.dataset.videoId);
      mountPlayer(target, spec);
    }
  }, { rootMargin: '300px 0px' });
  const visible = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) target.querySelector('video')?.pause();
    }
  });
  const pause = () => players.forEach((video) => video.pause());
  listen(document, 'visibilitychange', () => { if (document.hidden) pause(); });

  function mountPlayer(card, spec) {
    const src = safeURL(spec.src);
    if (!src) return;
    const frame = card.querySelector('.video-frame');
    const poster = card.querySelector('.video-poster');
    const pending = card.querySelector('.video-pending');
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.hidden = true;
    video.setAttribute('aria-label', spec.title);
    video.poster = poster.src;
    for (const subtitle of spec.tracks || []) {
      const url = safeURL(subtitle.src);
      if (!url) continue;
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.src = url;
      track.srclang = subtitle.lang || 'pt-BR';
      track.label = subtitle.label || 'Português';
      track.default = !!subtitle.default;
      video.append(track);
    }
    listen(video, 'loadeddata', () => {
      card.dataset.status = 'ready';
      poster.hidden = true;
      pending.hidden = true;
      video.hidden = false;
    });
    listen(video, 'error', () => {
      video.pause();
      card.dataset.status = 'pending';
      poster.hidden = false;
      pending.hidden = false;
      video.hidden = true;
      // Remove the unusable control while keeping its permanent heading/poster.
      players.delete(video);
      video.remove();
    });
    listen(video, 'play', () => {
      players.forEach((other) => { if (other !== video) other.pause(); });
    });
    card.dataset.status = 'loading';
    players.add(video);
    frame.append(video);
    video.src = src;
  }

  for (const spec of manifest) {
    const card = document.querySelector(`[data-video-id="${spec.id}"]`);
    if (!card) continue;
    const remoteReady = /^https:\/\//.test(spec.src) && spec.status === 'ready';
    if (available.has(spec.id) || remoteReady) loading.observe(card);
    visible.observe(card);
  }
  return {
    pause,
    destroy() { loading.disconnect(); visible.disconnect(); pause(); },
  };
}
