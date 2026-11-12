import manifest from './video-manifest.json';
import localVideoIDs from 'virtual:team-hawks-videos';

const playIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
const pauseIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
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
  const reset = (video) => {
    video.pause();
    if (video.readyState > 0) video.currentTime = 0;
    const frame = video.closest('.video-frame');
    frame.querySelector('.video-poster').hidden = false;
    frame.querySelector('.video-play').innerHTML = playIcon;
    frame.querySelector('.video-play').setAttribute('aria-label', 'Reproduzir vídeo');
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

      } else {
        onScreen.delete(video);
        reset(video);
      }
    }
  }, { threshold: [0, 0.25] });
  const pause = () => players.forEach(reset);
  listen(document, 'visibilitychange', () => {
    if (document.hidden) pause();

  });

  function mountPlayer(card, spec) {
    const src = safeURL(spec.src);
    if (!src) return;
    const frame = card.querySelector('.video-frame');
    const pending = card.querySelector('.video-pending');
    const video = document.createElement('video');
    video.controls = false;
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true;
    video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
    video.poster = new URL('assets/team-hawks-logo.svg', document.baseURI).href;
    const poster = document.createElement('img');
    poster.className = 'video-poster';
    poster.src = video.poster;
    poster.alt = 'Team Hawks';
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'video-play';
    play.innerHTML = playIcon;
    play.setAttribute('aria-label', 'Reproduzir vídeo');
    frame.append(poster, play);
    listen(play, 'click', () => {
      if (video.paused) {
        video.play().catch(() => reset(video));
      } else {
        video.pause();
      }
    });
    listen(video, 'play', () => {
      players.forEach((other) => {
        if (other !== video) reset(other);
      });
    });
    listen(video, 'pause', () => {
      play.innerHTML = playIcon;
      play.setAttribute('aria-label', 'Reproduzir vídeo');
    });
    listen(video, 'playing', () => {
      if (document.hidden || !onScreen.has(video)) reset(video);
      else {
        poster.hidden = true;
        play.innerHTML = pauseIcon;
        play.setAttribute('aria-label', 'Pausar vídeo');
      }
    });
    listen(video, 'ended', () => reset(video));
    video.playsInline = true;
    video.muted = false;
    video.defaultMuted = false;
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
      poster.remove();
      play.remove();
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
