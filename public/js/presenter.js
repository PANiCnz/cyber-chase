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
const presenterWinnerText =
    document.getElementById('presenterWinnerText');
const newMatchBtn =
    document.getElementById('newMatchBtn');
const winnerNewMatchBtn =
    document.getElementById('winnerNewMatchBtn');
const presenterWaiting =
    document.getElementById('presenterWaiting');
const roundWaiting =
    document.getElementById('roundWaiting');
const roundWaitingText =
    document.getElementById('roundWaitingText');
const startRoundBtn =
    document.getElementById('startRoundBtn');
const gameSections =
    document.querySelectorAll('.game-section');
const roundContent =
    document.querySelectorAll('.round-content');
const answerButtons = [
    document.getElementById('answerA'),
    document.getElementById('answerB'),
    document.getElementById('answerC'),
    document.getElementById('answerD')
];
let currentMatchState = null;
let currentQuestionToken = null;
let presenterRefreshRunning = false;

function setAnswerButtonsDisabled(disabled) {
    for (const button of answerButtons) {
        button.disabled = disabled;
    }
}

function showWaitingState() {
    currentMatchState = null;
    currentQuestionToken = null;
    presenterWaiting.classList.remove('hidden');
    newMatchBtn.classList.add('hidden');
    presenterWinner.classList.add('hidden');
    presenterWinnerText.textContent = '';
    resultBanner.textContent = '';
    setAnswerButtonsDisabled(true);

    for (const section of gameSections) {
        section.classList.add('hidden');
    }
}

function showGameState() {
    presenterWaiting.classList.add('hidden');
    newMatchBtn.classList.remove('hidden');

    for (const section of gameSections) {
        section.classList.remove('hidden');
    }
}

function renderRoundState(state) {
    const active =
        state?.roundActive === true;

    roundWaiting.classList.toggle(
        'hidden',
        active || Boolean(state?.winner)
    );
    roundWaitingText.textContent =
        `Ready for the ${state?.currentPlayer || 'next'} round.`;
    startRoundBtn.disabled =
        active || Boolean(state?.winner);
    currentQuestionToken =
        active ? currentQuestionToken : null;
    setAnswerButtonsDisabled(!active);

    for (const section of roundContent) {
        section.classList.toggle(
            'hidden',
            !active
        );
    }

    window.dispatchEvent(
        new CustomEvent(
            'roundStateChanged',
            { detail: { active } }
        )
    );
}

function renderWinner(state) {
    if (!state?.winner) {
        presenterWinner.classList.add('hidden');
        presenterWinnerText.textContent = '';
        return false;
    }

    presenterWinnerText.textContent =
        `${state.winner} WINS!`;
    presenterWinner.classList.remove('hidden');
    setAnswerButtonsDisabled(true);
    return true;
}

async function notifyDisplays() {
    socket.emit('refreshGame');
}

async function startNewMatch() {
    const activeMatch =
        currentMatchState &&
        !currentMatchState.winner;

    if (
        activeMatch &&
        !window.confirm(
            'End the active match and return everyone to setup?'
        )
    ) {
        return;
    }

    newMatchBtn.disabled = true;
    winnerNewMatchBtn.disabled = true;
    resultBanner.textContent =
        'Resetting game...';

    try {
        const response = await fetch(
            '/api/match/reset',
            { method: 'POST' }
        );

        if (!response.ok) {
            throw new Error(
                'Unable to reset the game'
            );
        }

        socket.emit('newMatch');
        showWaitingState();
        newMatchBtn.disabled = false;
        winnerNewMatchBtn.disabled = false;
    } catch (error) {
        resultBanner.textContent =
            error.message;
        newMatchBtn.disabled = false;
        winnerNewMatchBtn.disabled = false;
    }
}

async function loadMatchProfile() {
    const response =
        await fetch('/api/match/state');
    const state = await response.json();

    if (!state) {
        showWaitingState();
        return null;
    }

    currentMatchState = state;
    showGameState();

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
    renderRoundState(state);
    return state;
}

async function startRound() {
    startRoundBtn.disabled = true;
    resultBanner.textContent =
        'Starting round...';

    try {
        const response = await fetch(
            '/api/question/start',
            { method: 'POST' }
        );
        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                'Unable to start round'
            );
        }

        resultBanner.textContent = '';
        currentMatchState = result.match;
        socket.emit('refreshGame');
        await loadQuestion();
    } catch (error) {
        resultBanner.textContent =
            error.message;
        startRoundBtn.disabled = false;
    }
}

async function loadQuestion() {
    if (presenterRefreshRunning) {
        return;
    }

    presenterRefreshRunning = true;

    try {
        const state = await loadMatchProfile();

        if (
            !state ||
            state.winner ||
            !state.roundActive
        ) {
            return;
        }

        const response =
            await fetch('/api/question/current');
        const q = await response.json();

        if (!q) return;

        currentQuestionToken =
            q.questionToken || null;
        questionCategory.textContent =
            q.category || '';
        questionDifficulty.textContent =
            q.difficulty || '';
        questionText.textContent =
            q.question || '';
        answerTextA.textContent = q.a || '';
        answerTextB.textContent = q.b || '';
        answerTextC.textContent = q.c || '';
        answerTextD.textContent = q.d || '';

        const answerResponse =
            await fetch('/api/question/answer');
        const answer = await answerResponse.json();
        correctAnswer.textContent =
            (answer.correct || '').toUpperCase();
    } finally {
        presenterRefreshRunning = false;
    }
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
            body: JSON.stringify({
                answer,
                questionToken:
                    currentQuestionToken
            })
        }
    );
    const result = await response.json();

    if (!response.ok) {
        if (response.status === 409) {
            resultBanner.textContent =
                'TIME EXPIRED';
            await loadQuestion();
            return;
        }

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
    currentMatchState = result.match;

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
newMatchBtn.onclick = startNewMatch;
winnerNewMatchBtn.onclick = startNewMatch;
startRoundBtn.onclick = startRound;

document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();

    if (
        ['a', 'b', 'c', 'd'].includes(key) &&
        !answerButtons[0].disabled
    ) {
        submitAnswer(key);
    }
});

socket.on('gameState', loadQuestion);
socket.on('answerResult', result => {
    if (!result.timeout) {
        return;
    }

    resultBanner.textContent =
        `TIME UP (Correct: ${(result.correctAnswer || '').toUpperCase()})`;
    setAnswerButtonsDisabled(true);
});
socket.on('newMatch', () => {
    showWaitingState();
});
setInterval(loadQuestion, 2000);
loadQuestion();
