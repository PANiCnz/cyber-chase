
async function timerAction(action){
  await fetch(`/api/timer/${action}`, {method:'POST'});
}

document.getElementById('startTimerBtn')?.addEventListener('click', ()=>timerAction('start'));
document.getElementById('pauseTimerBtn')?.addEventListener('click', ()=>timerAction('pause'));
document.getElementById('resetTimerBtn')?.addEventListener('click', ()=>timerAction('reset'));

setInterval(async ()=>{
 const r = await fetch('/api/timer/state');
 const t = await r.json();
 const el = document.getElementById('timerValue');
 if(el) el.innerText = t.remaining;
},1000);
