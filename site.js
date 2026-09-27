const video = document.querySelector('#studio-video');
const motion = document.querySelector('#motion');
function syncMotion() {
  motion.innerHTML = video.paused ? '▷ <span>Play</span>' : 'Ⅱ <span>Pause</span>';
  motion.setAttribute('aria-label', `${video.paused ? 'Play' : 'Pause'} comparison animation`);
}
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  video.autoplay = false;
  video.pause();
}
video.addEventListener('play', syncMotion);
video.addEventListener('pause', syncMotion);
motion.addEventListener('click', () => { if (video.paused) video.play().catch(syncMotion); else video.pause(); });
syncMotion();
const tabs = [...document.querySelectorAll('[data-study]')];
function selectStudy(tab) {
  const poster = tab.dataset.study === 'poster';
  tabs.forEach(item => { item.setAttribute('aria-selected', String(item === tab)); item.tabIndex = item === tab ? 0 : -1; });
  document.querySelector('#study-image').src = `assets/${poster ? 'poster' : 'edges'}.png`;
  document.querySelector('#study-image').alt = poster ? 'PaintPhase Poster view simplifying the portrait into flat colour masses, with colour count and palette controls' : 'PaintPhase Edges and grid controls, with violet lines describing the portrait';
  document.querySelector('#study-panel').setAttribute('aria-labelledby', tab.id);
  document.querySelector('#study-description').textContent = poster ? 'Start with a few flat masses. Add more colours as you work.' : 'The photo’s lines, with a grid to guide your drawing.';
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectStudy(tab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : tabs[1 - index];
    selectStudy(next); next.focus();
  });
});

// Native dialog supplies focus trapping, Escape, and an inert page behind it.
const viewer = document.createElement('dialog');
viewer.className = 'image-viewer';
viewer.setAttribute('aria-label', 'App screenshot');
viewer.innerHTML = '<div class="viewer-bar"><span class="mono">PAINTPHASE / CLOSER LOOK</span><button type="button" autofocus>Close ×</button></div><img alt="">';
document.body.append(viewer);
let imageTrigger;
document.querySelectorAll('.screen img, .study-panel img, .lens-frame img, .mixing-shot img').forEach(img => {
  const content = img.closest('picture') || img;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'image-zoom';
  button.setAttribute('aria-label', 'Enlarge app screenshot');
  button.setAttribute('aria-haspopup', 'dialog');
  content.replaceWith(button);
  button.append(content);
  const hint = document.createElement('span');
  hint.className = 'zoom-hint';
  hint.textContent = '↗ Enlarge';
  hint.setAttribute('aria-hidden', 'true');
  button.append(hint);
  button.addEventListener('click', () => {
    imageTrigger = button;
    const enlarged = viewer.querySelector('img');
    enlarged.src = img.currentSrc || img.src;
    enlarged.alt = img.alt;
    viewer.showModal();
    document.body.classList.add('viewer-open');
  });
});
viewer.querySelector('button').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
viewer.addEventListener('close', () => {
  document.body.classList.remove('viewer-open');
  imageTrigger?.focus({preventScroll:true});
});

const milestones = [...document.querySelectorAll('.progress-strip figure')];
milestones.forEach((figure, index) => {
  const img = figure.querySelector('img');
  const date = figure.querySelector('figcaption').textContent;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'progress-pick';
  button.setAttribute('aria-label', `Show painting: ${date}`);
  button.setAttribute('aria-pressed', String(index === milestones.length - 1));
  img.replaceWith(button);
  button.append(img);
  button.addEventListener('click', () => {
    document.querySelectorAll('.progress-pick').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('#progress-image').src = img.src;
    document.querySelector('#progress-image').alt = img.alt;
    document.querySelector('#progress-date').textContent = date + (index === milestones.length - 1 ? ' / LATEST SNAP' : ' / SAVED SNAP');
  });
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? milestones.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + milestones.length) % milestones.length;
    const target = milestones[next].querySelector('button');
    target.click();
    target.focus({preventScroll: true});
  });
});
