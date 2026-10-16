import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { content } from './content.js';
import { initVideos } from './videos.js';

gsap.registerPlugin(ScrollTrigger);
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const mobileQuery = matchMedia('(max-width: 600px)');
const trainingCompactQuery = matchMedia('(max-width: 1023px)');
const fineQuery = matchMedia('(hover: hover) and (pointer: fine)');
let motionContext;
let refreshFrame;
let destroyed = false;
const listeners = [];

function listen(target, event, callback, options) {
  target.addEventListener(event, callback, options);
  listeners.push(() => target.removeEventListener(event, callback, options));
}

function requestRefresh() {
  cancelAnimationFrame(refreshFrame);
  refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
}

// Essential navigation and content work independently of animation setup.
const header = $('[data-header]');
const toggle = $('[aria-controls="menu-mobile"]');
const drawer = $('#menu-mobile');
const menuMarkup = toggle.innerHTML;
let menuOpen = false;
const solidClasses = ['border-white/10', 'bg-ink/85', 'backdrop-blur-md'];
const clearClasses = ['border-transparent', 'bg-transparent'];
function paintHeader() {
  const welcome = $('.hero-morph');
  const welcomeStyle = welcome && getComputedStyle(welcome);
  const compact = (welcomeStyle && welcomeStyle.visibility !== 'hidden' && welcomeStyle.display !== 'none')
    || $('#manifesto').getBoundingClientRect().top <= header.offsetHeight;
  header.classList.toggle('is-compact', Boolean(compact));
  const sampleY = header.getBoundingClientRect().bottom / 2;
  const surface = [...$$('main > section'), $('footer')].filter(Boolean).find((section) => {
    const bounds = section.getBoundingClientRect();
    return bounds.top <= sampleY && bounds.bottom > sampleY;
  });
  const background = surface?.id === 'inicio' ? $('.hero-stage') : surface;
  const channels = background && getComputedStyle(background).backgroundColor.match(/[\d.]+/g)?.map(Number);
  const darkBackground = channels && (channels[3] === undefined || channels[3] > .5)
    && (channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722) < 128;
  header.classList.toggle('on-dark-section', Boolean(compact && darkBackground && !menuOpen));
  const solid = menuOpen || scrollY > 24;
  header.classList.remove(...(solid ? clearClasses : solidClasses));
  header.classList.add(...(solid ? solidClasses : clearClasses));
}
function setMenu(open) {
  menuOpen = open;
  drawer.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  toggle.innerHTML = open ? '<span aria-hidden="true" style="font-size:26px">×</span>' : menuMarkup;
  document.body.style.overflow = open ? 'hidden' : '';
  // The drawer is modal on mobile: keep background links out of the focus order.
  $$('main, footer').forEach((el) => { el.inert = open; });
  if (open) $('a', drawer)?.focus();
  paintHeader();
}
listen(toggle, 'click', () => setMenu(!menuOpen));
$$('a', drawer).forEach((a) => listen(a, 'click', () => setMenu(false)));
listen(document, 'keydown', (event) => {
  if (!menuOpen) return;
  if (event.key === 'Escape') {
    setMenu(false);
    toggle.focus();
  }
  if (event.key === 'Tab') {
    const items = [toggle, ...$$('a,button', drawer)];
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
listen(window, 'resize', () => { if (menuOpen && innerWidth >= 1024) setMenu(false); });
listen(window, 'scroll', paintHeader, { passive: true });
paintHeader();

const messages = {
  geral: 'Olá, Team Hawks! Vim pelo site e gostaria de conversar.',
  atleta: 'Olá, Team Hawks! Sou atleta e quero conhecer o Método Team Hawks.',
  arena: 'Olá, Team Hawks! Represento uma arena/clube e quero conhecer o método.',
  consultoria: 'Olá, Team Hawks! Quero conhecer a consultoria para o meu projeto.',
  parceria: 'Olá, Team Hawks! Tenho interesse em ser parceiro do projeto.',
  turmas: 'Olá, Team Hawks! Quero ser avisado(a) sobre novas turmas e projetos.',
};
const whatsapp = content.whatsapp.replace(/\D/g, '');
$$('[data-contact]').forEach((a) => {
  a.href = whatsapp.length >= 10
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(messages[a.dataset.contact] || messages.geral)}`
    : content.instagramDM;
});
if (whatsapp.length >= 10) $('[data-channel-label]').textContent = 'Atendimento via WhatsApp';
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
$$('button[aria-label^="Copiar cupom"]').forEach((button) => {
  const text = $('[aria-live]', button);
  const coupon = button.dataset.coupon || button.getAttribute('aria-label').replace('Copiar cupom ', '');
  let resetTimer;
  listen(button, 'click', async () => {
    try {
      await navigator.clipboard.writeText(coupon);
      text.textContent = 'Copiado';
    } catch {
      text.textContent = `Cupom: ${coupon}`;
    }
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { text.textContent = 'Copiar'; }, 2500);
  });
  listeners.push(() => clearTimeout(resetTimer));
});

// Optional photo bindings preserve their static HTML fallback and captions.
function mediaURL(value) {
  if (!value) return '';
  try {
    const parsed = new URL(value, document.baseURI);
    return parsed.protocol === 'https:' || parsed.protocol === 'data:' && value.startsWith('data:image/') || parsed.origin === location.origin ? parsed.href : '';
  } catch { return ''; }
}
for (const [key, spec] of Object.entries(content.media)) {
  const slot = $(`[data-media-slot="${key}"]`);
  const imageURL = mediaURL(spec.image);
  if (!slot || !imageURL) continue;
  const image = $('img', slot);
  // Pending photo slots have captions but no image to configure.
  if (!image) continue;
  const fallback = image.src;
  listen(image, 'error', () => { if (image.src !== fallback) image.src = fallback; });
  image.src = imageURL;
  if (spec.alt) image.alt = spec.alt;
}
const heroImage = $('.hero-media img');
function useHeroFallback() {
  const fallback = mediaURL(heroImage.dataset.fallback);
  if (fallback && heroImage.src !== fallback) heroImage.src = fallback;
}
listen(heroImage, 'error', useHeroFallback);
// A failed eager image may finish before the module installs its listener.
if (heroImage.complete && !heroImage.naturalWidth) useHeroFallback();
const videos = initVideos(listen);

// Physical image stack: keyboard, buttons and touch all select the same item.
const cards = $$('[data-stack-card]');
const stack = $('.image-stack');
for (const [index, spec] of (content.gallery || []).slice(0, cards.length).entries()) {
  const url = mediaURL(spec.image);
  if (!url) continue;
  const image = $('img', cards[index]);
  const fallback = image.src;
  listen(image, 'error', () => { if (image.src !== fallback) image.src = fallback; });
  listen(image, 'load', () => {
    if (image.src === url) {
      image.alt = spec.alt || spec.caption;
      $('figcaption', cards[index]).textContent = spec.caption;
      paintStack(false);
    }
  });
  image.src = url;
}
let stackIndex = 0;
let touchStart;
function paintStack(animate = true) {
  cards.forEach((card, index) => {
    const distance = (index - stackIndex + cards.length) % cards.length;
    card.style.zIndex = String(cards.length - distance);
    card.setAttribute('aria-hidden', String(distance !== 0));
    const properties = {
      xPercent: distance * 8,
      yPercent: distance * -3,
      rotation: distance === 0 ? -4 : distance * 7 - 4,
      rotationY: distance * -4,
      scale: 1 - distance * .055,
      opacity: distance === 3 ? .4 : 1,
    };
    if (animate && !reduceQuery.matches) {
      gsap.to(card, { ...properties, duration: .75, ease: 'power3.inOut', overwrite: true });
    } else gsap.set(card, properties);
  });
  $('[data-stack-status]').textContent = `${String(stackIndex + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')} — ${$('figcaption', cards[stackIndex]).textContent}`;
}
function changeStack(direction) {
  stackIndex = (stackIndex + direction + cards.length) % cards.length;
  paintStack();
}
listen($('[data-stack-prev]'), 'click', () => changeStack(-1));
listen($('[data-stack-next]'), 'click', () => changeStack(1));
listen(stack, 'keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    changeStack(event.key === 'ArrowRight' ? 1 : -1);
  }
});
listen(stack, 'pointerdown', (event) => {
  if (event.pointerType !== 'mouse') touchStart = { x: event.clientX, y: event.clientY };
});
listen(stack, 'pointerup', (event) => {
  if (!touchStart) return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) changeStack(dx < 0 ? 1 : -1);
  touchStart = undefined;
});
listen(stack, 'pointercancel', () => { touchStart = undefined; });
paintStack(false);

const viewer = $('.image-viewer');
let viewerTrigger;
function openImage(figure, trigger = figure) {
  const image = $('img', figure);
  viewerTrigger = trigger;
  $('img', viewer).src = image.currentSrc || image.src;
  $('img', viewer).alt = image.alt;
  $('#image-viewer-caption').textContent = $('figcaption, .slot-label', figure)?.textContent || image.alt;
  trigger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  viewer.showModal();
  $('.viewer-close').focus();
}
listen($('.viewer-close'), 'click', () => viewer.close());
listen(viewer, 'click', (event) => { if (event.target === viewer) viewer.close(); });
listen(viewer, 'close', () => {
  document.body.style.overflow = '';
  viewerTrigger?.setAttribute('aria-expanded', 'false');
  viewerTrigger?.focus({ preventScroll: true });
});
$$('.hover-image').forEach((figure) => {
  listen(figure, 'click', () => openImage(figure));
  listen(figure, 'keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openImage(figure); }
  });
});
listen($('.stack-open'), 'click', () => openImage(cards[stackIndex], $('.stack-open')));
$$('.spotlight-card, .motion-button').forEach((surface) => {
  let bounds;
  listen(surface, 'pointerenter', () => { bounds = surface.getBoundingClientRect(); });
  listen(surface, 'pointermove', (event) => {
    if (!fineQuery.matches || reduceQuery.matches) return;
    bounds ||= surface.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    surface.style.setProperty('--sx', `${x}px`);
    surface.style.setProperty('--sy', `${y}px`);
    surface.style.setProperty('--bx', `${(x / bounds.width - .5) * 8}px`);
    surface.style.setProperty('--by', `${(y / bounds.height - .5) * 6}px`);
  });
  listen(surface, 'pointerleave', () => {
    bounds = undefined;
    surface.style.setProperty('--bx', '0px');
    surface.style.setProperty('--by', '0px');
  });
});
const marquees = $$('.partner-marquee, .brand-marquee-track');
const marqueeObserver = new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => target.classList.toggle('is-offscreen', !isIntersecting));
});
marquees.forEach((el) => marqueeObserver.observe(el));

// Split text without changing semantics, nesting or screen-reader wording.
$$('[data-kinetic]').forEach((element) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    for (const token of node.textContent.split(/(\s+)/)) {
      if (!token.trim()) fragment.append(document.createTextNode(token));
      else {
        const span = document.createElement('span');
        span.className = 'kinetic-word';
        span.textContent = token;
        fragment.append(span);
      }
    }
    node.replaceWith(fragment);
  }
});

// A single GSAP context owns every scroll sequence. Native scrolling is untouched.
function buildMotion() {
  motionContext?.revert();
  const reduced = reduceQuery.matches;
  document.documentElement.classList.toggle('motion-disabled', reduced);
  paintStack(false);
  if (reduced) {
    videos.pause();
    requestRefresh();
    return;
  }
  const mobile = mobileQuery.matches;
  try {
    motionContext = gsap.context((context) => {
      const hero = gsap.timeline({
        onUpdate: paintHeader,
        scrollTrigger: {
          trigger: '#inicio', start: 'top top', end: () => `+=${innerHeight * (mobile ? 1.3 : 1.9)}`,
          pin: '.hero-stage', scrub: .75, invalidateOnRefresh: true,
        },
      });
      hero.fromTo('.hero-media', {
        top: () => innerWidth <= 600 ? '36%' : innerWidth < 1024 ? '33%' : '26%',
        right: () => innerWidth < 1024 ? '5%' : '4%',
        width: () => innerWidth <= 600 ? '87%' : innerWidth < 1024 ? '82%' : '64%',
        height: () => innerWidth <= 600 ? '47%' : innerWidth < 1024 ? '53%' : '66%',
        borderRadius: () => `${innerWidth <= 600 ? 80 : innerWidth < 1024 ? 100 : 180}px 8px 8px 8px`,
      }, { top: 0, right: 0, width: '100%', height: '100%', borderRadius: 0, duration: .5, ease: 'power2.inOut' }, 0)
        .to('.hero-media img, .hero-media video', { scale: 1.16, duration: .55, ease: 'none' }, 0)
        .to('.hero-intro', { yPercent: -35, scale: 1.08, transformOrigin: 'left top', duration: .5 }, 0)
        .to('.hero-intro, .hero-bottom', { autoAlpha: 0, yPercent: -60, duration: .2 }, .4)
        .to('.hero-stage', { backgroundColor: '#edeae5', duration: .25 }, .6)
        .to('.hero-media', { width: mobile ? '90%' : '52%', height: '54%', top: '25%', right: mobile ? '5%' : '24%', borderRadius: '50%', opacity: .22, duration: .35, ease: 'power2.inOut' }, .6)
        .fromTo('.hero-morph', { autoAlpha: 0, y: 120, scale: .85 }, { autoAlpha: 1, y: 0, scale: 1, duration: .3 }, .7);

      const diagram = $('[data-court-diagram]');
      if (diagram) {
        const segments = $$('[data-route-segment]', diagram);
        const nodes = $$('[data-route-node]', diagram);
        segments.forEach((path) => {
          const length = path.getTotalLength();
          gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
        });
        gsap.set(nodes, { opacity: .3 });
        const route = gsap.timeline({
          scrollTrigger: {
            trigger: diagram, start: 'top 82%',
            toggleActions: 'restart none restart reset',
          },
        });
        route.to(nodes[0], { opacity: 1, duration: .2 });
        segments.forEach((segment, index) => {
          route.to(segment, { strokeDashoffset: 0, duration: .8, ease: 'none' })
            .to(nodes[index + 1], { opacity: 1, duration: .2 });
        });
      }

      $$('[data-kinetic]').forEach((element) => {
        gsap.from($('.kinetic-word', element) ? $$('.kinetic-word', element) : element, {
          yPercent: 110, rotation: 6, scale: .8, stagger: .09, ease: 'none',
          scrollTrigger: { trigger: element, start: 'top 88%', end: 'bottom 48%', scrub: 1 },
        });
      });
      $$('[data-zoom]').forEach((element) => {
        gsap.fromTo(element, { scale: .8, y: 60, rotation: -5 }, {
          scale: 1.18, y: -40, rotation: 2, ease: 'none',
          scrollTrigger: { trigger: '#manifesto', start: 'top bottom', end: 'bottom top', scrub: 1 },
        });
      });

      let methodStage = -1;
      const methodLabels = $$('.method-chapter h3').map((el) => el.textContent);
      const methodImages = $$('.method-image');
      function selectMethod(index) {
        if (index === methodStage) return;
        methodStage = index;
        $('.method-visual').dataset.activeStage = String(index);
        $('[data-method-label]').textContent = `${String(index + 1).padStart(2, '0')} / ${methodLabels[index]}`;
        methodImages.forEach((image, i) => gsap.to(image, {
          opacity: i === index ? 1 : 0, scale: i === index ? 1.015 + index * .005 : 1.05,
          xPercent: 0, duration: .8, overwrite: true,
        }));
        gsap.fromTo('[data-method-label]', { y: 22, rotation: -3 }, { y: 0, rotation: 0, duration: .6, overwrite: true });
        gsap.to('.court-route', { strokeDashoffset: 550 - index * 130, duration: .8, overwrite: true });
        gsap.to('.method-court', { rotation: [-5, 2, -2, 5, 0][index], scale: 1 + index * .03, duration: 1, overwrite: true });
        gsap.to('.method-progress span', { scaleX: (index + 1) / 5, duration: .7, overwrite: true });
      }
      $$('.method-chapter').forEach((chapter, index) => {
        ScrollTrigger.create({ trigger: chapter, start: mobile ? 'top 68%' : 'top 55%', end: 'bottom 55%', onEnter: () => selectMethod(index), onEnterBack: () => selectMethod(index) });
        gsap.from($('.chapter-title', chapter), { x: mobile ? 30 : 80, rotation: -4, ease: 'none', scrollTrigger: { trigger: chapter, start: 'top 95%', end: 'top 50%', scrub: .8 } });
      });
      selectMethod(0);

      $$('#consultoria [data-consult-stage]').forEach((chapter, index) => {
        const select = () => {
          $$('#consultoria [data-consult-stage]').forEach((el) => el.classList.toggle('is-active', el === chapter));
          $('.consult-counter').textContent = `${String(index + 1).padStart(2, '0')} / 05`;
          gsap.fromTo('.consult-counter', { y: 28, scale: .85 }, { y: 0, scale: 1, duration: .55, overwrite: true });
          gsap.to('#consultoria .mask-reveal img', { scale: 1 + index * .08, xPercent: index % 2 ? 4 : -4, duration: 1, overwrite: true });
        };
        ScrollTrigger.create({ trigger: chapter, start: 'top 60%', end: 'bottom 60%', onEnter: select, onEnterBack: select });
      });

      gsap.fromTo('.editorial-primary', { rotation: -9, y: mobile ? 30 : 150, scale: .84 }, {
        rotation: 3, y: -60, scale: 1.05, ease: 'none',
        scrollTrigger: { trigger: '#team-hawks', start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
      gsap.fromTo('.editorial-secondary', { rotation: 16, y: 100, scale: .88 }, {
        rotation: -8, y: -60, scale: 1, ease: 'none',
        scrollTrigger: { trigger: '#team-hawks', start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
      $$('.hover-gallery > li').forEach((item, index) => {
        gsap.fromTo(item, { y: mobile ? 24 : 100 + index % 3 * 40, rotation: mobile ? 0 : index % 2 ? 5 : -5, scale: mobile ? 1 : .86 }, {
          y: 0, rotation: 0, scale: 1, ease: 'none',
          scrollTrigger: { trigger: item, start: 'top bottom', end: 'top 35%', scrub: .8 },
        });
      });
      gsap.fromTo(stack, { y: 90, rotationY: -18 }, {
        y: -30, rotationY: 0, ease: 'none',
        scrollTrigger: { trigger: '.stack-collection', start: 'top bottom', end: 'bottom top', scrub: 1 },
      });

      const words = ['POSICIONE.', 'LEIA.', 'EXECUTE.'];
      const descriptions = [
        'Chegar melhor à bola começa por uma base consistente.',
        'Entenda a trajetória antes de escolher o movimento.',
        'Transforme a decisão em um fundamento eficiente.',
      ];
      let trainingScene = -1;
      const revealTrainingWord = context.add(null, () => {
        gsap.fromTo('[data-training-word]', { y: 65, rotation: -4, scale: .85 }, { y: 0, rotation: 0, scale: 1, duration: .6, overwrite: true });
      });
      const training = gsap.timeline({
        scrollTrigger: {
          trigger: '#treino', start: 'top top', end: () => `+=${innerHeight * (mobile ? 1.6 : 2.5)}`,
          pin: '.training-stage', scrub: .7, invalidateOnRefresh: true,
          onUpdate: (self) => {
            const index = Math.min(2, Math.floor(self.progress * 3));
            if (index !== trainingScene) {
              trainingScene = index;
              $('[data-training-word]').textContent = words[index];
              $('[data-training-index]').textContent = String(index + 1).padStart(2, '0');
              $('[data-training-description]').textContent = descriptions[index];
              $$('.training-dots i').forEach((dot, i) => dot.classList.toggle('active', i === index));
              revealTrainingWord();
            }

          },
        },
      });
      const compactTraining = trainingCompactQuery.matches;
      training.fromTo('.training-media', { scale: compactTraining ? 1 : 1.08, xPercent: compactTraining ? 0 : -5 }, { scale: compactTraining ? 1.08 : 1.45, xPercent: compactTraining ? 0 : 5, duration: 1, ease: 'none' })
        .fromTo('.training-copy', { x: 0 }, { x: mobile ? 0 : 40, duration: 1, ease: 'none' }, 0);
    });
  } catch (error) {
    motionContext?.revert();
    document.documentElement.classList.add('motion-disabled');
    console.error('Falha ao iniciar movimento; conteúdo estático preservado.', error);
  }
  requestRefresh();
}
listen(reduceQuery, 'change', buildMotion);
listen(mobileQuery, 'change', buildMotion);
listen(trainingCompactQuery, 'change', buildMotion);
buildMotion();
document.fonts.ready.then(requestRefresh);
// Image/video frames reserve their size in CSS. Lazy decoding must not refresh
// ScrollTrigger and interrupt a native smooth anchor scroll mid-flight.
listen(window, 'load', requestRefresh);
// BFCache/teardown never leaves duplicate pins, observers or live media behind.
function teardown() {
  if (destroyed) return;
  destroyed = true;
  motionContext?.revert();
  gsap.killTweensOf(cards);
  cancelAnimationFrame(refreshFrame);
  videos.destroy();
  marqueeObserver.disconnect();
  $$('video').forEach((video) => video.pause());
  listeners.splice(0).forEach((remove) => remove());
}
listen(window, 'pagehide', (event) => { if (!event.persisted) teardown(); else $$('video').forEach((video) => video.pause()); });
listen(window, 'pageshow', (event) => { if (event.persisted) { requestRefresh(); } });
if (import.meta.hot) import.meta.hot.dispose(teardown);
