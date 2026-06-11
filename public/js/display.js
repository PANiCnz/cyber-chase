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
const contestantBar =
   document.getElementById('contestantBar');
const chaserBar =
   document.getElementById('chaserBar');
const contestantProgress =
   contestantBar.parentElement;
const chaserProgress =
   chaserBar.parentElement;
const currentTurn =
   document.getElementById('currentTurn');
const category =
   document.getElementById('category');
const questionPanel =
   document.getElementById('questionPanel');
const questionText =
   document.getElementById('questionText');
const displayAnswerA =
   document.getElementById('displayAnswerA');
const displayAnswerB =
   document.getElementById('displayAnswerB');
const displayAnswerC =
   document.getElementById('displayAnswerC');
const displayAnswerD =
   document.getElementById('displayAnswerD');
const answerResultOverlay =
   document.getElementById('answerResultOverlay');
const answerResultPlayer =
   document.getElementById('answerResultPlayer');
const answerResultMessage =
   document.getElementById('answerResultMessage');
const answerResultCorrect =
   document.getElementById('answerResultCorrect');
const winnerScreen =
   document.getElementById('winnerScreen');
const winnerName =
   document.getElementById('winnerName');

let resultVisible = false;
let resultTimer = null;

function renderMatchState(state) {
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

   const contestantScore =
      state.contestant?.score || 0;
   const chaserScore =
      state.chaser?.score || 0;

   contestantBar.style.width =
      `${(contestantScore / 5) * 100}%`;
   chaserBar.style.width =
      `${(chaserScore / 5) * 100}%`;
   contestantProgress.setAttribute(
      'aria-valuenow',
      contestantScore
   );
   chaserProgress.setAttribute(
      'aria-valuenow',
      chaserScore
   );

   currentTurn.textContent =
      state.roundActive
         ? `${(state.currentPlayer || '').toUpperCase()} TURN`
         : 'WAITING FOR NEXT ROUND';
   currentTurn.className =
      'turn ' +
      (state.currentPlayer === 'chaser'
         ? 'chaser-turn'
         : 'contestant-turn');

   if (state.winner && !resultVisible) {
      winnerScreen.classList.remove('hidden');
      winnerName.textContent = state.winner;
      currentTurn.textContent = 'MATCH COMPLETE';
      questionPanel.classList.add('hidden');
      category.classList.add('hidden');
      return false;
   }

   winnerScreen.classList.add('hidden');
   questionPanel.classList.toggle(
      'hidden',
      !state.roundActive
   );
   category.classList.toggle(
      'hidden',
      !state.roundActive
   );
   return state.roundActive && !resultVisible;
}

function renderQuestion(question) {
   if (!question || resultVisible) return;

   category.textContent = question.category || '';
   questionText.textContent =
      question.question || '';
   displayAnswerA.textContent = question.a || '';
   displayAnswerB.textContent = question.b || '';
   displayAnswerC.textContent = question.c || '';
   displayAnswerD.textContent = question.d || '';
}

async function updateFromApi() {
   const stateResponse =
      await fetch('/api/match/state');
   const state = await stateResponse.json();

   if (!state) {
      window.location = '/setup.html';
      return;
   }

   if (!renderMatchState(state)) {
      return;
   }

   const questionResponse =
      await fetch('/api/question/current');
   const question = await questionResponse.json();
   renderQuestion(question);
}

function showAnswerResult(result) {
   clearTimeout(resultTimer);
   resultVisible = true;

   answerResultPlayer.textContent =
      result.playerName ||
      (result.player === 'chaser'
         ? 'Chaser'
         : 'Contestant');
   answerResultMessage.textContent =
      result.timeout
         ? 'TIME UP!'
         : result.correct
            ? 'CORRECT!'
            : 'INCORRECT';
   answerResultCorrect.textContent =
      result.correct
         ? ''
         : `Correct answer: ${(result.correctAnswer || '').toUpperCase()}`;
   answerResultCorrect.classList.toggle(
      'hidden',
      result.correct
   );
   answerResultOverlay.classList.toggle(
      'correct',
      result.correct
   );
   answerResultOverlay.classList.toggle(
      'incorrect',
      !result.correct
   );
   answerResultOverlay.classList.remove('hidden');

   resultTimer = setTimeout(() => {
      resultVisible = false;
      answerResultOverlay.classList.add('hidden');
      updateFromApi();
   }, 1800);
}

socket.on('answerResult', showAnswerResult);
socket.on('gameState', updateFromApi);
socket.on('newMatch', () => {
   window.location = '/setup.html';
});
setInterval(updateFromApi, 2000);
updateFromApi();
