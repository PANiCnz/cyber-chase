const socket = io();

const contestantName =
   document.getElementById('contestantName');
const chaserTitle =
   document.getElementById('chaserTitle');
const contestantBar =
   document.getElementById('contestantBar');
const chaserBar =
   document.getElementById('chaserBar');
const contestantSegments =
   [...contestantBar.querySelectorAll('.score-segment')];
const chaserSegments =
   [...chaserBar.querySelectorAll('.score-segment')];
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
const winnerRole =
   document.getElementById('winnerRole');
const winnerName =
   document.getElementById('winnerName');
const winnerMessage =
   document.getElementById('winnerMessage');

let resultVisible = false;
let resultTimer = null;
let currentChaserLabel = 'The Chaser';
const ANSWER_RESULT_DURATION = 1500;

function renderScore(segments, score) {
   segments.forEach((segment, index) => {
      segment.classList.toggle(
         'filled',
         index < score
      );
   });
}

function hideAnswerResult() {
   clearTimeout(resultTimer);
   resultTimer = null;
   resultVisible = false;
   answerResultOverlay.classList.add('hidden');
}

function renderMatchState(state) {
   contestantName.textContent =
      state.contestant?.name || 'Team';
   currentChaserLabel =
      state.chaser?.title || 'The Chaser';
   chaserTitle.textContent =
      currentChaserLabel;

   const contestantScore =
      state.contestant?.score || 0;
   const chaserScore =
      state.chaser?.score || 0;
   const scoreScale =
      Math.max(
         20,
         Math.ceil(
            Math.max(
               state.targetScore || 0,
               contestantScore,
               chaserScore
            ) / 10
         ) * 10
      );

   while (
      contestantSegments.length < scoreScale
   ) {
      const segment =
         document.createElement('span');
      segment.className = 'score-segment';
      contestantBar.appendChild(segment);
      contestantSegments.push(segment);
   }
   while (chaserSegments.length < scoreScale) {
      const segment =
         document.createElement('span');
      segment.className = 'score-segment';
      chaserBar.appendChild(segment);
      chaserSegments.push(segment);
   }
   contestantBar.style.setProperty(
      '--score-segments',
      Math.min(scoreScale, 10)
   );
   chaserBar.style.setProperty(
      '--score-segments',
      Math.min(scoreScale, 10)
   );

   renderScore(
      contestantSegments,
      contestantScore
   );
   renderScore(
      chaserSegments,
      chaserScore
   );
   contestantBar.setAttribute(
      'aria-valuenow',
      contestantScore
   );
   contestantBar.setAttribute(
      'aria-valuemax',
      scoreScale
   );
   chaserBar.setAttribute(
      'aria-valuenow',
      chaserScore
   );
   chaserBar.setAttribute(
      'aria-valuemax',
      scoreScale
   );

   currentTurn.textContent =
      state.roundActive
         ? state.currentPlayer === 'chaser'
            ? `CHASER CHASING ${state.targetScore}`
            : 'TEAM BUILDING THE TARGET'
         : state.firstRoundPending
            ? 'MATCH STARTING'
            : state.currentPlayer === 'chaser'
               ? `TARGET SET: ${state.targetScore}`
               : 'WAITING';
   currentTurn.className =
      'turn ' +
      (state.currentPlayer === 'chaser'
         ? 'chaser-turn'
         : 'contestant-turn');
   questionPanel.classList.toggle(
      'chaser-question',
      state.currentPlayer === 'chaser'
   );
   questionPanel.classList.toggle(
      'contestant-question',
      state.currentPlayer !== 'chaser'
   );

   if (state.winner) {
      const contestantWon =
         state.winner === state.contestant?.name;

      winnerName.textContent = contestantWon
         ? state.winner
         : currentChaserLabel;
      winnerRole.textContent = contestantWon
         ? 'TEAM VICTORY'
         : 'CHASER VICTORY';
      winnerMessage.textContent = contestantWon
         ? 'You have outrun the Chaser, and you have won!'
         : 'The Chaser has caught you, and your time is up.';
      winnerScreen.classList.toggle(
         'contestant-winner',
         contestantWon
      );
      winnerScreen.classList.toggle(
         'chaser-winner',
         !contestantWon
      );
      winnerScreen.classList.toggle(
         'hidden',
         resultVisible
      );
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

   if (
      !state.roundActive &&
      !state.winner &&
      state.lastRoundResult
   ) {
      showAnswerResult(
         state.lastRoundResult
      );
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
   resultTimer = null;
   resultVisible = true;

   answerResultPlayer.textContent =
      result.player === 'chaser'
         ? currentChaserLabel
         : result.playerName || 'Team';
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
   answerResultOverlay.classList.toggle(
      'chaser-result',
      result.player === 'chaser'
   );
   answerResultOverlay.classList.toggle(
      'contestant-result',
      result.player !== 'chaser'
   );
   answerResultOverlay.classList.remove('hidden');

   if (result.winner) {
      resultTimer = setTimeout(() => {
         hideAnswerResult();
         updateFromApi();
      }, 1800);
   } else {
      resultTimer = setTimeout(() => {
         hideAnswerResult();
         updateFromApi();
      }, ANSWER_RESULT_DURATION);
   }
}

socket.on('answerResult', showAnswerResult);
socket.on('phaseEnded', () => {
   hideAnswerResult();
   updateFromApi();
});
socket.on('gameState', updateFromApi);
socket.on('newMatch', () => {
   window.location = '/setup.html';
});
setInterval(updateFromApi, 2000);
updateFromApi();
