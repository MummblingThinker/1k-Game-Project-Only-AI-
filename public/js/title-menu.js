// Reuse the real controls and their listeners, so menu and room state cannot diverge.
export function createTitleMenu({pause, resume, release}) {
  const $=id=>document.getElementById(id), root=document.createElement('section');
  root.id='title-menu';root.setAttribute('aria-label','Game menu');
  root.innerHTML=`<div class="menu-brand"><p class="panel-kicker">ONE SMALL SPARK IN A MACHINE WORLD</p><h2>Tiny Teamwork<span>The Last Spark</span></h2></div>
    <div class="menu-home" data-menu-view="home"><button id="menu-single" class="primary-button">Single Player</button><button id="menu-multi" class="secondary-button">Multiplayer</button><button id="menu-settings" class="secondary-button">Settings</button><p>City rooftops. Forest trails. A factory that never sleeps.</p></div>
    <div class="menu-page" data-menu-view="solo" hidden><h3>Single Player</h3><div id="solo-controls"></div></div>
    <div class="menu-page" data-menu-view="multi" hidden><h3>Multiplayer</h3><div id="multi-controls"></div><div id="host-controls"></div></div>
    <div class="menu-page" data-menu-view="settings" hidden><h3>Settings</h3><div id="settings-controls"></div><p class="menu-legend">W / S: climb and hold ladders · Space: jump<br>Bright edged walls are solid. Recessed facades sit behind your path.<br>Flags restore hearts up to your limit. Solo has three hearts.</p></div>
    <button id="menu-back" class="text-button" hidden>Back</button>`;
  document.querySelector('.screen-frame').append(root);
  const solo=$('solo-controls'),multi=$('multi-controls'),settings=$('settings-controls');
  const story=$('start-story'),resumeButton=$('resume-solo'),resumeNote=$('resume-note'),levelRow=$('level-select').closest('.form-row'),practice=$('play-selected');
  solo.append(story,resumeButton,resumeNote,levelRow,practice);
  multi.append(document.querySelector('.co-op-card'));
  const audio=document.querySelector('.audio-controls');
  for(const id of ['pause-game','watch-player'])audio.before($(id));
  settings.append(audio,document.querySelector('.visual-options'));
  document.querySelector('.visual-options').open=true;
  const gear=document.createElement('button');gear.id='open-settings';gear.className='text-button';gear.textContent='Settings';$('pause-game').after(gear);
  let view='home',state='title',previousState='',inRoom=false,overlay=false,pausedByMenu=false;
  function show(next){
    release();view=next;root.dataset.view=view;
    for(const page of root.querySelectorAll('[data-menu-view]'))page.hidden=page.dataset.menuView!==view;
    $('menu-back').hidden=view==='home';$('menu-back').textContent=overlay?'Return to game':'Back';
    const parent=view==='multi'?$('host-controls'):solo;
    parent.append(levelRow,story);if(view==='solo')solo.append(resumeButton,resumeNote,levelRow,practice,story);
    story.textContent=view==='multi'?'Start Co-op Run':'Start Story';
    if(view==='settings'&&state!=='title'&&state!=='lobby'){overlay=true;pausedByMenu=pause();}
    root.hidden=false;root.querySelector(`[data-menu-view="${view}"] button, [data-menu-view="${view}"] input`)?.focus();
  }
  function back(){if(overlay){overlay=false;if(pausedByMenu)resume();pausedByMenu=false;root.hidden=true;release();}else show(inRoom?'multi':'home');}
  $('menu-single').onclick=()=>show('solo');$('menu-multi').onclick=()=>show('multi');$('menu-settings').onclick=()=>show('settings');gear.onclick=()=>show('settings');$('menu-back').onclick=back;
  root.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();back();}
    if(e.key==='Tab'){
      const list=[...root.querySelectorAll('button,input,select')].filter(n=>!n.disabled&&n.getClientRects().length),first=list[0],last=list.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
  });
  return {get visible(){return !root.hidden;},update(next,room){
    state=next;inRoom=room;
    if(next==='lobby'&&previousState!=='lobby')show('multi');
    if(next==='title'&&previousState!=='title')show('home');
    if(next!==previousState&&!['title','lobby','paused'].includes(next)){overlay=false;pausedByMenu=false;}
    root.hidden=!overlay&&!['title','lobby'].includes(next);document.body.dataset.menuOpen=String(!root.hidden);
    $('host-controls').hidden=!room;
    previousState=next;
  }};
}
