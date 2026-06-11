const socket = io();

const manageChasersBtn =
    document.getElementById('manageChasersBtn');
const chaserManager =
    document.getElementById('chaserManager');
const closeChaserManagerBtn =
    document.getElementById('closeChaserManagerBtn');
const addChaserBtn =
    document.getElementById('addChaserBtn');
const managerChaserList =
    document.getElementById('managerChaserList');
const chaserEditor =
    document.getElementById('chaserEditor');
const editorChaserId =
    document.getElementById('editorChaserId');
const editorChaserName =
    document.getElementById('editorChaserName');
const editorChaserNickname =
    document.getElementById('editorChaserNickname');
const editorChaserDepartment =
    document.getElementById('editorChaserDepartment');
const editorChaserBio =
    document.getElementById('editorChaserBio');
const editorChaserImage =
    document.getElementById('editorChaserImage');
const editorChaserActive =
    document.getElementById('editorChaserActive');
const saveChaserBtn =
    document.getElementById('saveChaserBtn');
const managerStatus =
    document.getElementById('managerStatus');
const setupContestantName =
    document.getElementById('setupContestantName');
const setupContestantDepartment =
    document.getElementById('setupContestantDepartment');
const setupContestantDifficulty =
    document.getElementById('setupContestantDifficulty');
const setupChaserDifficulty =
    document.getElementById('setupChaserDifficulty');
const setupChaser =
    document.getElementById('setupChaser');
const launchMatchBtn =
    document.getElementById('launchMatchBtn');
const setupStatus =
    document.getElementById('setupStatus');
const setupChaserProfile =
    document.getElementById('setupChaserProfile');
const setupChaserPhoto =
    document.getElementById('setupChaserPhoto');
const setupChaserTitle =
    document.getElementById('setupChaserTitle');
const setupChaserName =
    document.getElementById('setupChaserName');
const setupChaserDepartment =
    document.getElementById('setupChaserDepartment');
const setupChaserBio =
    document.getElementById('setupChaserBio');
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
let availableChasers = [];
let managedChasers = [];
let difficultiesLoaded = false;

const RANDOM_CHASER_ID = 'random';

function initials(name) {
    return (name || 'Chaser')
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function selectedSetupChaser() {
    return availableChasers.find(
        chaser => chaser.id === setupChaser.value
    );
}

function randomSetupChaser() {
    const index = Math.floor(
        Math.random() * availableChasers.length
    );

    return availableChasers[index];
}

function renderSetupPhoto(chaser) {
    setupChaserPhoto.replaceChildren();

    if (chaser?.image) {
        const image = document.createElement('img');
        image.src = chaser.image;
        image.alt = `${chaser.name} profile`;
        setupChaserPhoto.appendChild(image);
        return;
    }

    setupChaserPhoto.textContent =
        chaser ? initials(chaser.name) : '?';
}

function renderSetupProfile() {
    if (setupChaser.value === RANDOM_CHASER_ID) {
        setupChaserTitle.textContent = 'Random selection';
        setupChaserName.textContent = 'Mystery Chaser';
        setupChaserDepartment.textContent =
            'Selected when the game launches';
        setupChaserBio.textContent =
            'One of the available chasers will be chosen at random.';
        renderSetupPhoto(null);
        setupChaserProfile.classList.remove('hidden');
        return;
    }

    const chaser = selectedSetupChaser();

    if (!chaser) {
        setupChaserProfile.classList.add('hidden');
        return;
    }

    setupChaserTitle.textContent =
        chaser.title || 'The Chaser';
    setupChaserName.textContent = chaser.name;
    setupChaserDepartment.textContent =
        chaser.department || 'Information Security';
    setupChaserBio.textContent = chaser.bio || '';
    renderSetupPhoto(chaser);
    setupChaserProfile.classList.remove('hidden');
}

function populateSetupChasers() {
    setupChaser.replaceChildren();

    if (availableChasers.length > 0) {
        const randomOption =
            document.createElement('option');
        randomOption.value = RANDOM_CHASER_ID;
        randomOption.textContent = 'Random';
        setupChaser.appendChild(randomOption);
    } else {
        const unavailableOption =
            document.createElement('option');
        unavailableOption.value = '';
        unavailableOption.textContent =
            'No active chasers';
        setupChaser.appendChild(unavailableOption);
    }

    for (const chaser of availableChasers) {
        const option =
            document.createElement('option');
        option.value = chaser.id;
        option.textContent =
            `${chaser.name} - ${chaser.title || 'Chaser'}`;
        setupChaser.appendChild(option);
    }

    setupChaser.disabled =
        availableChasers.length === 0;
    updateLaunchAvailability();
    setupStatus.textContent =
        availableChasers.length === 0
            ? 'Enable at least one chaser before launching.'
            : '';
    renderSetupProfile();
}

function renderManagerAvatar(chaser) {
    const avatar = document.createElement('div');
    avatar.className = 'manager-avatar';

    if (chaser.image) {
        const image = document.createElement('img');
        image.src = chaser.image;
        image.alt = `${chaser.name} profile`;
        avatar.appendChild(image);
    } else {
        avatar.textContent = initials(chaser.name);
    }

    return avatar;
}

function editChaser(chaser) {
    editorChaserId.value = chaser.id;
    editorChaserName.value = chaser.name;
    editorChaserNickname.value =
        chaser.title || '';
    editorChaserDepartment.value =
        chaser.department;
    editorChaserBio.value = chaser.bio || '';
    editorChaserImage.value =
        chaser.image || '';
    editorChaserActive.checked =
        chaser.active === true;
    managerStatus.textContent =
        `Editing ${chaser.name}`;
    editorChaserName.focus();
}

function resetChaserEditor() {
    chaserEditor.reset();
    editorChaserId.value = '';
    editorChaserDepartment.value =
        'Information Security';
    editorChaserActive.checked =
        managedChasers.filter(
            chaser => chaser.active
        ).length < 4;
    managerStatus.textContent =
        'Creating a new chaser';
    editorChaserName.focus();
}

function renderManagedChasers() {
    managerChaserList.replaceChildren();
    const activeCount = managedChasers.filter(
        chaser => chaser.active
    ).length;

    for (const chaser of managedChasers) {
        const card = document.createElement('article');
        card.className =
            `manager-chaser-card${chaser.active ? ' active' : ''}`;

        const details = document.createElement('div');
        const name = document.createElement('div');
        name.className = 'manager-card-name';
        name.textContent = chaser.name;

        const meta = document.createElement('div');
        meta.className = 'manager-card-meta';
        meta.textContent = [
            chaser.title,
            chaser.department
        ].filter(Boolean).join(' | ');

        const availability =
            document.createElement('div');
        availability.className =
            'manager-card-status';
        availability.textContent = chaser.active
            ? 'AVAILABLE'
            : 'NOT AVAILABLE';
        details.append(name, meta, availability);

        const editButton =
            document.createElement('button');
        editButton.type = 'button';
        editButton.className =
            'manager-edit-button';
        editButton.textContent = 'EDIT';
        editButton.onclick =
            () => editChaser(chaser);

        card.append(
            renderManagerAvatar(chaser),
            details,
            editButton
        );
        managerChaserList.appendChild(card);
    }

    managerStatus.textContent =
        `${activeCount} of 4 chasers active`;
}

async function loadManagedChasers() {
    managerStatus.textContent =
        'Loading chaser catalog...';

    try {
        const response = await fetch(
            '/api/chasers/manage/all'
        );

        if (!response.ok) {
            throw new Error();
        }

        managedChasers = await response.json();
        renderManagedChasers();
    } catch {
        managerStatus.textContent =
            'Unable to load the chaser catalog.';
    }
}

async function openChaserManager() {
    chaserManager.classList.remove('hidden');
    await loadManagedChasers();

    if (managedChasers.length > 0) {
        editChaser(managedChasers[0]);
    } else {
        resetChaserEditor();
    }
}

function closeChaserManager() {
    chaserManager.classList.add('hidden');
}

async function saveChaser(event) {
    event.preventDefault();
    saveChaserBtn.disabled = true;
    managerStatus.textContent =
        'Saving chaser...';

    const id = editorChaserId.value;
    const response = await fetch(
        id
            ? `/api/chasers/${encodeURIComponent(id)}`
            : '/api/chasers',
        {
            method: id ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: editorChaserName.value.trim(),
                nickname:
                    editorChaserNickname.value.trim(),
                department:
                    editorChaserDepartment.value.trim(),
                bio: editorChaserBio.value.trim(),
                image: editorChaserImage.value.trim(),
                active: editorChaserActive.checked
            })
        }
    ).catch(() => null);

    if (!response) {
        managerStatus.textContent =
            'Unable to connect while saving.';
        saveChaserBtn.disabled = false;
        return;
    }

    const result = await response.json();

    if (!response.ok) {
        managerStatus.textContent =
            result.error ||
            'Unable to save chaser.';
        saveChaserBtn.disabled = false;
        return;
    }

    await Promise.all([
        loadManagedChasers(),
        loadSetupChasers()
    ]);
    editChaser(result);
    managerStatus.textContent =
        `${result.name} saved.`;
    saveChaserBtn.disabled = false;
}

function populateDifficultySelect(
    select,
    difficulties
) {
    select.replaceChildren();

    const allOption =
        document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All difficulties';
    select.appendChild(allOption);

    for (const difficulty of difficulties) {
        const option =
            document.createElement('option');
        option.value = difficulty;
        option.textContent = difficulty;
        select.appendChild(option);
    }

    select.disabled = false;
}

function updateLaunchAvailability() {
    launchMatchBtn.disabled =
        availableChasers.length === 0 ||
        !difficultiesLoaded;
}

async function loadDifficulties() {
    try {
        const response = await fetch(
            '/api/question/difficulties'
        );

        if (!response.ok) {
            throw new Error();
        }

        const result = await response.json();

        if (
            !Array.isArray(result.contestant) ||
            result.contestant.length === 0 ||
            !Array.isArray(result.chaser) ||
            result.chaser.length === 0
        ) {
            throw new Error();
        }

        populateDifficultySelect(
            setupContestantDifficulty,
            result.contestant
        );
        populateDifficultySelect(
            setupChaserDifficulty,
            result.chaser
        );
        difficultiesLoaded = true;
        updateLaunchAvailability();
    } catch {
        setupStatus.textContent =
            'Unable to load question difficulties.';
    }
}

async function loadSetupChasers() {
    setupStatus.textContent =
        'Loading chasers...';

    try {
        const response = await fetch('/api/chasers');

        if (!response.ok) {
            throw new Error();
        }

        availableChasers = await response.json();

        if (!Array.isArray(availableChasers)) {
            throw new Error();
        }

        populateSetupChasers();
    } catch {
        setupStatus.textContent =
            'Unable to load chaser profiles.';
    }
}

function resetSetupForm() {
    setupContestantName.value = '';
    setupContestantDepartment.value = '';
    setupContestantDifficulty.value = 'all';
    setupChaserDifficulty.value = 'all';
    setupChaser.value = RANDOM_CHASER_ID;
    setupStatus.textContent = '';
    updateLaunchAvailability();
    renderSetupProfile();
}

async function launchMatch() {
    const contestantName =
        setupContestantName.value.trim();

    if (!contestantName) {
        setupStatus.textContent =
            'Enter the contestant name.';
        setupContestantName.focus();
        return;
    }

    const randomSelected =
        setupChaser.value === RANDOM_CHASER_ID;
    const chaser = randomSelected
        ? randomSetupChaser()
        : selectedSetupChaser();

    if (!chaser) {
        setupStatus.textContent =
            'Select a chaser before launching.';
        return;
    }

    launchMatchBtn.disabled = true;
    setupStatus.textContent = randomSelected
        ? `Randomly selected ${chaser.name}. Launching...`
        : `Launching ${contestantName} vs ${chaser.name}...`;

    try {
        const response = await fetch(
            '/api/match/start-match',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contestantName,
                    contestantDepartment:
                        setupContestantDepartment.value.trim(),
                    contestantDifficulty:
                        setupContestantDifficulty.value,
                    chaserDifficulty:
                        setupChaserDifficulty.value,
                    chaserId: chaser.id,
                    chaserName: chaser.name
                })
            }
        );
        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                'Unable to launch the match'
            );
        }

        currentMatchState = result;
        socket.emit('matchStarted');
        await loadQuestion();
    } catch (error) {
        setupStatus.textContent = error.message;
        launchMatchBtn.disabled = false;
    }
}

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
        state?.firstRoundPending
            ? 'Opening countdown in progress. Round one will start automatically.'
            : `Ready for the ${state?.currentPlayer || 'next'} round.`;
    startRoundBtn.disabled =
        active ||
        Boolean(state?.winner) ||
        Boolean(state?.firstRoundPending);
    startRoundBtn.classList.toggle(
        'hidden',
        Boolean(state?.firstRoundPending)
    );
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
        resetSetupForm();
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
        playerName,
        winner: result.match.winner
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
launchMatchBtn.onclick = launchMatch;
manageChasersBtn.onclick = openChaserManager;
closeChaserManagerBtn.onclick = closeChaserManager;
addChaserBtn.onclick = resetChaserEditor;
chaserEditor.addEventListener(
    'submit',
    saveChaser
);
setupChaser.addEventListener(
    'change',
    renderSetupProfile
);

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
socket.on('chasersUpdated', () => {
    loadSetupChasers();

    if (!chaserManager.classList.contains('hidden')) {
        loadManagedChasers();
    }
});
setInterval(loadQuestion, 2000);
loadSetupChasers();
loadDifficulties();
loadQuestion();
