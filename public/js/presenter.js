const socket = io();

const presenterChaserName =
    document.getElementById('presenterChaserName');
const presenterChaserTitle =
    document.getElementById('presenterChaserTitle');
const presenterChaserDepartment =
    document.getElementById('presenterChaserDepartment');
const presenterChaserBio =
    document.getElementById('presenterChaserBio');
const questionCategory =
    document.getElementById('questionCategory');
const questionDifficulty =
    document.getElementById('questionDifficulty');
const questionText =
    document.getElementById('questionText');
const answerTextA =
    document.getElementById('answerTextA');
const answerTextB =
    document.getElementById('answerTextB');
const answerTextC =
    document.getElementById('answerTextC');
const answerTextD =
    document.getElementById('answerTextD');
const correctAnswer =
    document.getElementById('correctAnswer');
const resultBanner =
    document.getElementById('resultBanner');
const presenterWinner =
    document.getElementById('presenterWinner');
const answerButtons = [
    document.getElementById('answerA'),
    document.getElementById('answerB'),
    document.getElementById('answerC'),
    document.getElementById('answerD')
];
let currentMatchState = null;

function setAnswerButtonsDisabled(disabled) {
    for (const button of answerButtons) {
        button.disabled = disabled;
    }
}

function renderWinner(state) {
    if (!state?.winner) {
        presenterWinner.classList.add('hidden');
        presenterWinner.textContent = '';
        setAnswerButtonsDisabled(false);
        return false;
    }

    presenterWinner.textContent =
        `${state.winner} WINS!`;
    presenterWinner.classList.remove('hidden');
    setAnswerButtonsDisabled(true);
    return true;
}

async function notifyDisplays() {
    socket.emit('refreshGame');
}

async function loadMatchProfile() {
    const response =
        await fetch('/api/match/state');
    const state = await response.json();

    if (!state) return null;

    currentMatchState = state;

    presenterChaserName.textContent =
        state.chaser?.name || 'Chaser';
    presenterChaserTitle.textContent =
        state.chaser?.title || '';
    presenterChaserTitle.classList.toggle(
        'hidden',
        !state.chaser?.title
    );
    presenterChaserDepartment.textContent =
        state.chaser?.department ||
        'Information Security';
    presenterChaserBio.textContent =
        state.chaser?.bio || '';
    presenterChaserBio.classList.toggle(
        'hidden',
        !state.chaser?.bio
    );

    renderWinner(state);
    return state;
}

async function loadQuestion() {
    const state = await loadMatchProfile();

    if (!state || state.winner) {
        return;
    }

    const response =
        await fetch('/api/question/current');
    const q = await response.json();

    if (!q) return;

    questionCategory.textContent = q.category || '';
    questionDifficulty.textContent =
        q.difficulty || '';
    questionText.textContent = q.question || '';
    answerTextA.textContent = q.a || '';
    answerTextB.textContent = q.b || '';
    answerTextC.textContent = q.c || '';
    answerTextD.textContent = q.d || '';

    const answerResponse =
        await fetch('/api/question/answer');
    const answer = await answerResponse.json();
    correctAnswer.textContent =
        (answer.correct || '').toUpperCase();
}

async function submitAnswer(answer) {
    const state =
        currentMatchState ||
        await loadMatchProfile();
    const answeringPlayer =
        state?.currentPlayer;
    setAnswerButtonsDisabled(true);

    const response = await fetch(
        '/api/question/respond',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answer })
        }
    );
    const result = await response.json();

    if (!response.ok) {
        resultBanner.textContent =
            result.error ||
            'Unable to submit answer';
        setAnswerButtonsDisabled(false);
        return;
    }

    resultBanner.textContent = result.correct
        ? 'CORRECT'
        : `INCORRECT (Correct: ${(result.correctAnswer || '').toUpperCase()})`;

    const playerName = answeringPlayer === 'chaser'
        ? result.match.chaser.name
        : result.match.contestant.name;

    socket.emit('answerResult', {
        correct: result.correct,
        correctAnswer: result.correctAnswer,
        player: answeringPlayer,
        playerName
    });

    await notifyDisplays();

    if (renderWinner(result.match)) {
        return;
    }

    await loadQuestion();
}

answerButtons[0].onclick =
    () => submitAnswer('a');
answerButtons[1].onclick =
    () => submitAnswer('b');
answerButtons[2].onclick =
    () => submitAnswer('c');
answerButtons[3].onclick =
    () => submitAnswer('d');

document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();

    if (
        ['a', 'b', 'c', 'd'].includes(key) &&
        !answerButtons[0].disabled
    ) {
        submitAnswer(key);
    }
});

socket.on('gameState', loadMatchProfile);
loadQuestion();
