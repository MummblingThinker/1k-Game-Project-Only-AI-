// A separate illustrated prologue; campaign timing and room state stay untouched.
const frame = document.querySelector('.screen-frame');
const intro = document.createElement('section');
intro.id = 'opening-intro';
intro.setAttribute('role', 'dialog');
intro.setAttribute('aria-modal', 'true');
intro.setAttribute('aria-label', 'Tiny Teamwork illustrated opening');
intro.innerHTML = `<img class="opening-art" src="/assets/key-art.jpg" alt="Three survivors flee across ruined rooftops as red-eyed robots and an enormous machine pursue them.">
  <div class="opening-shade"></div><p class="opening-caption" aria-live="polite">The machines were built to protect us.</p>
  <button class="opening-skip" type="button">Enter game / Skip intro</button>`;
frame.append(intro);
const art = intro.querySelector('img'), button = intro.querySelector('button');
let timers = [], closed = false, started = false;
function close() {
  if (closed) return;
  closed = true;
  timers.forEach(clearTimeout);
  document.removeEventListener('keydown', keyboard, true);
  intro.remove();
  document.querySelector('#title-menu [data-menu-view]:not([hidden]) button')?.focus({preventScroll:true});
}
function keyboard(event) {
  if (['Enter', ' ', 'Escape'].includes(event.key)) {
    event.preventDefault(); event.stopImmediatePropagation(); close();
  } else if (event.key === 'Tab') {
    event.preventDefault(); event.stopImmediatePropagation(); button.focus();
  }
}
function start() {
  if (closed || started) return;
  started = true;
  intro.classList.add('opening-ready');
  const caption = intro.querySelector('.opening-caption');
  timers.push(setTimeout(() => { caption.textContent = 'Now they hunt us.'; intro.dataset.beat = 'chase'; }, 2400));
  timers.push(setTimeout(() => { caption.textContent = 'Stay together. Keep the last spark alive.'; intro.dataset.beat = 'escape'; }, 4800));
  timers.push(setTimeout(close, 7600));
}
button.addEventListener('click', close);
document.addEventListener('keydown', keyboard, true);
button.focus({preventScroll:true});
art.addEventListener('load', start, {once:true});
art.addEventListener('error', close, {once:true});
if (art.complete) art.naturalWidth ? start() : close();
timers.push(setTimeout(close, 12000)); // A slow image must never block the menu.
