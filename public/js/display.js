
const socket = io();

function updateFromApi(){
 fetch('/api/match/state')
 .then(r=>r.json())
 .then(state=>{
   if(!state) return;

   contestantName.innerText = state.contestant?.name || 'Contestant';
   chaserName.innerText = state.chaser?.name || 'Chaser';

   contestantBar.style.width = `${((state.contestant?.score||0)/5)*100}%`;
   chaserBar.style.width = `${((state.chaser?.score||0)/5)*100}%`;

   currentTurn.innerText = `${(state.currentPlayer||'').toUpperCase()} TURN`;
   currentTurn.className = 'turn ' + ((state.currentPlayer==='chaser') ? 'chaser-turn' : 'contestant-turn');

   if(state.winner){
      winnerScreen.classList.remove('hidden');
      winnerScreen.innerHTML = `<div>${state.winner}</div><div>WINS!</div>`;
   }

   return fetch('/api/question/current');
 })
 .then(r=>r?.json())
 .then(q=>{
   if(!q) return;
   questionPanel.style.opacity='0';
   setTimeout(()=>{
      category.innerText=q.category||'';
      questionText.innerText=q.question||'';
      answers.innerHTML=`<div>A. ${q.a||''}</div><div>B. ${q.b||''}</div><div>C. ${q.c||''}</div><div>D. ${q.d||''}</div>`;
      questionPanel.style.opacity='1';
   },250);
 });
}

socket.on('gameState', updateFromApi);
setInterval(updateFromApi, 2000);
updateFromApi();
