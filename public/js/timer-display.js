
setInterval(async ()=>{
 const r = await fetch('/api/timer/state');
 const t = await r.json();

 const el = document.getElementById('timer');
 if(!el) return;

 el.innerText = t.remaining;

 if(t.remaining <= 10){
   el.style.color = '#ff4d4f';
 } else {
   el.style.color = '#ffd400';
 }
},1000);
