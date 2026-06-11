
const socket = io();

const contestantName =
   document.getElementById('contestantName');
const chaserName =
   document.getElementById('chaserName');
const chaserTitle =
   document.getElementById('chaserTitle');
const chaserDepartment =
   document.getElementById('chaserDepartment');
const chaserBio =
   document.getElementById('chaserBio');

function updateFromApi(){
 fetch('/api/match/state')
 .then(r=>r.json())
 .then(state=>{
   if(!state) return;

   contestantName.textContent =
      state.contestant?.name || 'Contestant';
   chaserName.textContent =
      state.chaser?.name || 'Chaser';
   chaserTitle.textContent =
      state.chaser?.title || '';
   chaserTitle.classList.toggle(
      'hidden',
      !state.chaser?.title
   );
   chaserDepartment.textContent =
      state.chaser?.department ||
      'Information Security';
   chaserBio.textContent =
      state.chaser?.bio || '';
   chaserBio.classList.toggle(
      'hidden',
      !state.chaser?.bio
   );

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
