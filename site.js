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

// A website preview using the six saved painting stages, not a screen recording.
const timelineFrames = [
  ['04 SEP', '2026-09-04', 'First portrait study, broad blocks of colour'],
  ['05 SEP', '2026-09-05', 'Second stage, developing the face'],
  ['06 SEP', '2026-09-06', 'Third stage, refining the features'],
  ['13 SEP / 15:03', '2026-09-13T15:03', 'Fourth stage, adding colour and detail'],
  ['13 SEP / 22:52', '2026-09-13T22:52', 'Fifth stage, refining the portrait'],
  ['15 SEP', '2026-09-15', 'Most recent portrait painting'],
];
const timeline = document.querySelector('.timeline-demo');
const timelineFrame = document.querySelector('#timeline-frame');
const timelinePosition = document.querySelector('#timeline-position');
const timelineMotion = document.querySelector('#timeline-motion');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let timelinePlaying = !reducedMotion.matches;
let timelineVisible = false;
let timelineTimer;
let timelineIndex = 0;
// Preload the small local frames so playback never flashes an unloaded image.
for (let index = 0; index < timelineFrames.length; index++) {
  const frame = new Image();
  frame.src = 'assets/progress-' + index + '.jpg';
}
function showTimelineFrame(index) {
  timelineIndex = index;
  const [date, isoDate, description] = timelineFrames[index];
  timelineFrame.src = 'assets/progress-' + index + '.jpg';
  timelineFrame.alt = description;
  document.querySelector('#timeline-count').textContent = 'SNAP ' + (index + 1) + ' OF 6';
  const dateLabel = document.querySelector('#timeline-date');
  dateLabel.textContent = date;
  dateLabel.dateTime = isoDate;
  timelinePosition.value = index;
  timelinePosition.setAttribute('aria-valuetext', 'Snap ' + (index + 1) + ' of 6, ' + date);
  timelinePosition.style.setProperty('--timeline-fill', (index / 5 * 100) + '%');
}
function syncTimelinePlayback() {
  clearInterval(timelineTimer);
  timelineMotion.innerHTML = timelinePlaying ? 'Ⅱ <span>Pause</span>' : '▷ <span>Play</span>';
  timelineMotion.setAttribute('aria-label', (timelinePlaying ? 'Pause' : 'Play') + ' painting timeline');
  if (timelinePlaying && timelineVisible && !document.hidden) {
    timelineTimer = setInterval(() => showTimelineFrame((timelineIndex + 1) % timelineFrames.length), 1000);
  }
}
timelineMotion.addEventListener('click', () => {
  timelinePlaying = !timelinePlaying;
  syncTimelinePlayback();
});
timelinePosition.addEventListener('input', () => {
  timelinePlaying = false;
  showTimelineFrame(Number(timelinePosition.value));
  syncTimelinePlayback();
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) { timelinePlaying = false; syncTimelinePlayback(); }
});
document.addEventListener('visibilitychange', syncTimelinePlayback);
new IntersectionObserver(entries => {
  timelineVisible = entries[0].isIntersecting;
  syncTimelinePlayback();
}, {threshold: 0.25}).observe(timeline);
document.querySelector('.timeline-controls').hidden = false;
showTimelineFrame(0);
syncTimelinePlayback();
