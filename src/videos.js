import manifest from './video-manifest.json';
import localVideoIDs from 'virtual:team-hawks-videos';

const safeURL = (value) => {
  if (!value) return '';
  try {
    const url = new URL(value, document.baseURI);
    return url.protocol === 'https:' || value.startsWith('data:video/mp4;base64,') || url.origin === location.origin ? url.href : '';
  } catch { return ''; }
};

export function initVideos(listen) {
  const players = new Set();
  const available = new Set(localVideoIDs);
  const onScreen = new Set();
  const resume = (video) => {
    if (!document.hidden && onScreen.has(video)) video.play().catch(() => {});
  };
  const loading = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      loading.unobserve(target);
      const spec = manifest.find((entry) => entry.id === target.dataset.videoId);
      mountPlayer(target, spec);
    }
  }, { rootMargin: '300px 0px' });
  const visible = new IntersectionObserver((entries) => {
    for (const { target: video, isIntersecting, intersectionRatio } of entries) {
      if (isIntersecting && intersectionRatio >= 0.25) {
        onScreen.add(video);
        resume(video);
      } else {
        onScreen.delete(video);
        video.pause();
      }
    }
  }, { threshold: [0, 0.25] });
  const pause = () => players.forEach((video) => video.pause());
  listen(document, 'visibilitychange', () => {
    if (document.hidden) pause();
    else onScreen.forEach(resume);
  });

  function mountPlayer(card, spec) {
    const src = safeURL(spec.src);
    if (!src) return;
    const frame = card.querySelector('.video-frame');
    const pending = card.querySelector('.video-pending');
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.muted = true;
    video.defaultMuted = true;
    video.preload = 'metadata';
    video.setAttribute('aria-label', spec.title);
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
    listen(video, 'loadedmetadata', () => {
      card.dataset.status = 'ready';
      pending.hidden = true;
      video.hidden = false;
    });
    listen(video, 'error', () => {
      video.pause();
      card.dataset.status = 'pending';
      pending.hidden = false;
      video.hidden = true;
      visible.unobserve(video);
      onScreen.delete(video);
      players.delete(video);
      video.remove();
    });
    card.dataset.status = 'loading';
    pending.hidden = true;
    players.add(video);
    frame.append(video);
    video.src = src;
    visible.observe(video);
  }

  for (const spec of manifest) {
    const card = document.querySelector(`[data-video-id="${spec.id}"]`);
    if (!card) continue;
    const remoteReady = /^https:\/\//.test(spec.src) && spec.status === 'ready';
    if (available.has(spec.id) || remoteReady) loading.observe(card);
  }
  return {
    pause,
    destroy() { loading.disconnect(); visible.disconnect(); pause(); },
  };
}
