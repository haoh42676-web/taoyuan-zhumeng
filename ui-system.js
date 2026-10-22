/* Shared behavior: themes, native disclosures, readable streaming and copy feedback. */
(()=>{'use strict';
 const key='peach-ui-theme:v1',root=document.documentElement,system=matchMedia('(prefers-color-scheme: dark)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let saved;try{saved=localStorage.getItem(key);}catch{}
 const icon='<svg class="theme-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 13.1A9 9 0 0 1 10.9 3.2a9 9 0 1 0 9.9 9.9Z"/></svg><svg class="theme-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/></svg>';
 function theme(value,persist=false){
  const next=['light','dark'].includes(value)?value:system.matches?'dark':'light';root.dataset.theme=next;
  if(persist){saved=next;try{localStorage.setItem(key,next);}catch{}}
  document.querySelectorAll('[data-theme-toggle]').forEach(b=>{const label=next==='dark'?'切换浅色模式':'切换暗色模式';b.setAttribute('aria-label',label);b.title=label;b.setAttribute('aria-pressed',String(next==='dark'));});
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',next==='dark'?'#131815':'#eef2ee');
  window.dispatchEvent(new CustomEvent('peach:themechange',{detail:{theme:next}}));
 }
 theme(saved);system.addEventListener('change',()=>{if(!saved)theme();});window.addEventListener('storage',e=>{if(e.key===key){saved=e.newValue;theme(saved);}});
 const closures=new WeakMap(),openFrames=new WeakMap(),openFallbacks=new WeakMap();
 function finishClose(d){if(d.dataset.expanded==='false')d.open=false;}
 function setDisclosure(d,expanded){
  enhanceDisclosure(d);clearTimeout(closures.get(d));clearTimeout(openFallbacks.get(d));cancelAnimationFrame(openFrames.get(d));delete d.dataset.uiOpening;
  const wasClosed=!d.open;
  d.querySelector(':scope>summary').setAttribute('aria-expanded',String(expanded));d.querySelector(':scope>.ui-disclosure-body').inert=!expanded;
  if(expanded&&wasClosed){d.dataset.uiOpening='true';d.open=true;const reveal=()=>{if(!d.dataset.uiOpening)return;clearTimeout(openFallbacks.get(d));delete d.dataset.uiOpening;d.dataset.expanded='true';};openFrames.set(d,requestAnimationFrame(()=>{openFrames.set(d,requestAnimationFrame(reveal));}));openFallbacks.set(d,setTimeout(reveal,60));}
  else d.dataset.expanded=String(expanded);
  if(!expanded){if(reduced.matches)finishClose(d);else closures.set(d,setTimeout(()=>finishClose(d),260));}
 }
 function enhanceDisclosure(d){
  if(d.dataset.uiDisclosure)return;const summary=d.querySelector(':scope>summary');if(!summary)return;
  d.dataset.uiDisclosure='1';const body=document.createElement('div'),inner=document.createElement('div');body.className='ui-disclosure-body';inner.className='ui-disclosure-inner';body.append(inner);
  [...d.childNodes].filter(n=>n!==summary).forEach(n=>inner.append(n));d.append(body);d.dataset.expanded=String(d.open);summary.setAttribute('aria-expanded',String(d.open));body.inert=!d.open;
  summary.addEventListener('click',e=>{e.preventDefault();setDisclosure(d,d.dataset.expanded!=='true');});
  body.addEventListener('transitionend',e=>{if(e.target===body&&e.propertyName==='grid-template-rows')finishClose(d);});
  d.addEventListener('toggle',()=>{if(d.dataset.uiOpening)return;if(d.open&&d.dataset.expanded!=='true'){d.dataset.expanded='true';summary.setAttribute('aria-expanded','true');body.inert=false;}else if(!d.open){d.dataset.expanded='false';summary.setAttribute('aria-expanded','false');body.inert=true;}});
 }
 const feedbackTimers=new WeakMap();
 function copied(button){
  if(!button?.isConnected)return;clearTimeout(feedbackTimers.get(button));
  if(!button.dataset.copyFeedback){button.dataset.copyFeedback='true';button.dataset.copyOriginal=button.innerHTML;button.dataset.copyLabel=button.getAttribute('aria-label')||'';}
  button.classList.add('copy-feedback');button.setAttribute('aria-label','已复制');
  const label=document.createElement('span');label.className='copy-feedback-label ui-pop';label.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg><span>已复制</span>';
  button.querySelector('.copy-feedback-label')?.remove();button.append(label);
  function hide(){if(!button.isConnected)return;button.innerHTML=button.dataset.copyOriginal;if(button.dataset.copyLabel)button.setAttribute('aria-label',button.dataset.copyLabel);else button.removeAttribute('aria-label');button.classList.remove('copy-feedback');delete button.dataset.copyFeedback;delete button.dataset.copyOriginal;delete button.dataset.copyLabel;}
  feedbackTimers.set(button,setTimeout(hide,2500));
 }
 function streamText(target,text,{signal}={}){
  target.textContent='';const chars=Array.from(String(text)),item=target.closest('.chat-message');
  if(reduced.matches||signal?.aborted||!chars.length){target.textContent=text;return Promise.resolve();}
  item.dataset.streaming='true';target.setAttribute('aria-hidden','true');
  const fragment=document.createDocumentFragment();chars.forEach((char,i)=>{const span=document.createElement('span');span.className='ink-token';span.style.setProperty('--token-index',i);span.textContent=char;fragment.append(span);});target.append(fragment);
  const controls=document.createElement('div');controls.className='stream-controls';const note=document.createElement('span');note.textContent='正在显示回答';const show=document.createElement('button');show.type='button';show.textContent='立即显示';controls.append(note,show);target.after(controls);
  return new Promise(resolve=>{let timer,done=false;const finish=()=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',finish);reduced.removeEventListener('change',motion);target.textContent=text;target.removeAttribute('aria-hidden');delete item.dataset.streaming;controls.remove();resolve();};const motion=()=>{if(reduced.matches)finish();};show.addEventListener('click',finish);signal?.addEventListener('abort',finish,{once:true});reduced.addEventListener('change',motion);timer=setTimeout(finish,(chars.length-1)*30+120);});
 }
 function init(){
  const toggle=()=>{const b=document.createElement('button');b.type='button';b.className='theme-toggle';b.dataset.themeToggle='true';b.innerHTML=icon;b.addEventListener('click',e=>{e.stopPropagation();theme(root.dataset.theme==='dark'?'light':'dark',true);});return b;};
  const front=document.querySelector('.topbar');if(front)front.insertBefore(toggle(),front.querySelector('.menu-button'));
  const admin=document.querySelector('.top-actions');if(admin)admin.prepend(toggle());
  if(document.querySelector('#login-screen')){const b=toggle();b.classList.add('login-theme-toggle');document.querySelector('#login-screen').append(b);}
  theme(root.dataset.theme);document.querySelectorAll('details').forEach(enhanceDisclosure);
  new MutationObserver(records=>{for(const record of records)for(const n of record.addedNodes){if(n.nodeType!==1)continue;if(n.matches('details'))enhanceDisclosure(n);n.querySelectorAll('details').forEach(enhanceDisclosure);}}).observe(document.body,{childList:true,subtree:true});
 }
 window.PeachUI={theme,copied,streamText,setDisclosure};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
