const socket = io();

const manageChasersBtn =
    document.getElementById('manageChasersBtn');
const manageTournamentBtn =
    document.getElementById('manageTournamentBtn');
const tournamentManager =
    document.getElementById('tournamentManager');
const closeTournamentManagerBtn =
    document.getElementById('closeTournamentManagerBtn');
const tournamentCreator =
    document.getElementById('tournamentCreator');
const newTournamentName =
    document.getElementById('newTournamentName');
const createTournamentBtn =
    document.getElementById('createTournamentBtn');
const tournamentStatus =
    document.getElementById('tournamentStatus');
const liveTournamentPanel =
    document.getElementById('liveTournamentPanel');
const tournamentList =
    document.getElementById('tournamentList');
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
const editorChaserImageUpload =
    document.getElementById('editorChaserImageUpload');
const editorImagePreview =
    document.getElementById('editorImagePreview');
const editorChaserActive =
    document.getElementById('editorChaserActive');
const saveChaserBtn =
    document.getElementById('saveChaserBtn');
const managerStatus =
    document.getElementById('managerStatus');
const setupTeamName =
    document.getElementById('setupTeamName');
const setupTeamMembers = [
    document.getElementById('setupTeamMember1'),
    document.getElementById('setupTeamMember2'),
    document.getElementById('setupTeamMember3'),
    document.getElementById('setupTeamMember4')
];
const setupContestantDifficulty =
    document.getElementById('setupContestantDifficulty');
const setupChaserDifficulty =
    document.getElementById('setupChaserDifficulty');
const setupChaser =
    document.getElementById('setupChaser');
const setupTournamentEnrollment =
    document.getElementById('setupTournamentEnrollment');
const setupTournamentHint =
    document.getElementById('setupTournamentHint');
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
let managedTournaments = [];
let liveTournament = null;
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

function renderEditorImage(source, alt = '') {
    editorImagePreview.replaceChildren();

    if (!source) {
        editorImagePreview.textContent = 'NO IMAGE';
        return;
    }

    const image = document.createElement('img');
    image.src = source;
    image.alt = alt;
    editorImagePreview.appendChild(image);
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
    editorChaserImageUpload.value = '';
    renderEditorImage(
        chaser.image,
        `${chaser.name} profile preview`
    );
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
    editorChaserImage.value = '';
    editorChaserImageUpload.value = '';
    renderEditorImage('');
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

function inspectImage(file) {
    return new Promise((resolve, reject) => {
        if (
            ![
                'image/jpeg',
                'image/png',
                'image/webp'
            ].includes(file.type)
        ) {
            reject(
                new Error(
                    'Choose a JPEG, PNG, or WebP image.'
                )
            );
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            reject(
                new Error(
                    'The image must be 5 MB or smaller.'
                )
            );
            return;
        }

        const previewUrl =
            URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            const ratio =
                image.naturalWidth /
                image.naturalHeight;

            if (
                image.naturalWidth < 800 ||
                image.naturalHeight < 1000
            ) {
                URL.revokeObjectURL(previewUrl);
                reject(
                    new Error(
                        'Use an image of at least 800 × 1000 px.'
                    )
                );
                return;
            }

            if (Math.abs(ratio - 0.8) > 0.03) {
                URL.revokeObjectURL(previewUrl);
                reject(
                    new Error(
                        'Crop the image to a 4:5 portrait aspect ratio.'
                    )
                );
                return;
            }

            resolve(previewUrl);
        };
        image.onerror = () => {
            URL.revokeObjectURL(previewUrl);
            reject(
                new Error('Unable to read this image.')
            );
        };
        image.src = previewUrl;
    });
}

async function previewSelectedImage() {
    const [file] = editorChaserImageUpload.files;

    if (!file) {
        return;
    }

    try {
        const previewUrl = await inspectImage(file);
        renderEditorImage(
            previewUrl,
            'Selected chaser profile preview'
        );
        managerStatus.textContent =
            'Image ready to upload when you save.';
    } catch (error) {
        editorChaserImageUpload.value = '';
        renderEditorImage(
            editorChaserImage.value,
            'Current chaser profile preview'
        );
        managerStatus.textContent = error.message;
    }
}

async function uploadSelectedImage() {
    const [file] = editorChaserImageUpload.files;

    if (!file) {
        return editorChaserImage.value;
    }

    const response = await fetch(
        '/api/chasers/upload-image',
        {
            method: 'POST',
            headers: {
                'Content-Type': file.type
            },
            body: file
        }
    );
    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.error || 'Unable to upload image.'
        );
    }

    return result.image;
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
    tournamentManager.classList.add('hidden');
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

function renderTournamentCard(tournament) {
    const card = document.createElement('article');
    card.className =
        `tournament-card ${tournament.status}`;

    const header = document.createElement('div');
    header.className = 'tournament-card-header';

    const titleWrap = document.createElement('div');
    const title = document.createElement('h4');
    title.textContent = tournament.name;

    const meta = document.createElement('div');
    meta.className = 'tournament-meta';
    meta.textContent =
        `${tournament.status.toUpperCase()} | ${tournament.teams.length} teams enrolled`;
    titleWrap.append(title, meta);

    const status = document.createElement('div');
    status.className =
        `tournament-status-pill ${tournament.status}`;
    status.textContent =
        tournament.status.toUpperCase();
    header.append(titleWrap, status);

    const scoredTeams = tournament.teams.filter(
        team => Number.isFinite(team.score)
    );
    const leader = scoredTeams[0];
    const stats = document.createElement('div');
    stats.className = 'tournament-stat-grid';
    const teamStat = document.createElement('div');
    teamStat.className = 'tournament-stat';
    teamStat.innerHTML =
        `<span>Teams</span><strong>${tournament.teams.length}</strong>`;
    const scoreStat = document.createElement('div');
    scoreStat.className = 'tournament-stat';
    scoreStat.innerHTML =
        `<span>Leader</span><strong>${leader ? leader.score : '-'}</strong>`;
    stats.append(teamStat, scoreStat);

    const preview = document.createElement('div');
    preview.className = 'tournament-team-preview';
    preview.textContent = scoredTeams.length > 0
        ? `Leading team: ${leader.name}`
        : 'No winning scores recorded yet.';

    const actions = document.createElement('div');
    actions.className = 'tournament-actions';
    const actionButton =
        document.createElement('button');
    actionButton.type = 'button';
    actionButton.textContent =
        tournament.status === 'open'
            ? 'CLOSE'
            : 'OPEN';
    actionButton.classList.toggle(
        'close-live',
        tournament.status === 'open'
    );
    actionButton.onclick = () =>
        updateTournamentStatus(
            tournament.id,
            tournament.status === 'open'
                ? 'close'
                : 'open'
        );
    actions.appendChild(actionButton);
    const resetButton =
        document.createElement('button');
    resetButton.type = 'button';
    resetButton.className = 'reset-tournament';
    resetButton.textContent = 'RESET SCORES';
    resetButton.onclick = () =>
        resetTournament(tournament);
    actions.appendChild(resetButton);

    card.append(header, stats, preview, actions);
    return card;
}

function renderTournamentManager(result) {
    const live = result.live;
    liveTournament = live || null;
    managedTournaments =
        result.tournaments || [];
    liveTournamentPanel.replaceChildren();
    tournamentList.replaceChildren();

    if (!live) {
        liveTournamentPanel.className =
            'live-tournament-panel empty';
        liveTournamentPanel.textContent =
            'No live tournament. Create or open one before enrolling teams.';
    } else {
        liveTournamentPanel.className =
            'live-tournament-panel';
        liveTournamentPanel.append(
            renderTournamentCard(live)
        );
    }

    for (const tournament of managedTournaments.filter(
        tournament => tournament.id !== live?.id
    )) {
        tournamentList.appendChild(
            renderTournamentCard(tournament)
        );
    }

    tournamentStatus.textContent =
        live
            ? `${live.name} is live.`
            : 'No tournament is currently live.';
    updateTournamentEnrollmentChoice();
}

async function loadTournamentManager() {
    tournamentStatus.textContent =
        'Loading tournaments...';

    try {
        const response = await fetch(
            '/api/tournament'
        );

        if (!response.ok) {
            throw new Error();
        }

        renderTournamentManager(
            await response.json()
        );
    } catch {
        tournamentStatus.textContent =
            'Unable to load tournaments.';
    }
}

async function openTournamentManager() {
    chaserManager.classList.add('hidden');
    tournamentManager.classList.remove('hidden');
    await loadTournamentManager();
    newTournamentName.focus();
}

function closeTournamentManager() {
    tournamentManager.classList.add('hidden');
}

async function createTournament(event) {
    event.preventDefault();
    const name = newTournamentName.value.trim();

    if (!name) {
        tournamentStatus.textContent =
            'Enter a tournament name.';
        newTournamentName.focus();
        return;
    }

    createTournamentBtn.disabled = true;
    tournamentStatus.textContent =
        'Creating tournament...';

    try {
        const response = await fetch(
            '/api/tournament',
            {
                method: 'POST',
                headers: {
                    'Content-Type':
                        'application/json'
                },
                body: JSON.stringify({ name })
            }
        );
        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                'Unable to create tournament.'
            );
        }

        newTournamentName.value = '';
        await loadTournamentManager();
    } catch (error) {
        tournamentStatus.textContent =
            error.message;
    } finally {
        createTournamentBtn.disabled = false;
    }
}

async function updateTournamentStatus(id, action) {
    tournamentStatus.textContent =
        `${action === 'open' ? 'Opening' : 'Closing'} tournament...`;

    try {
        const response = await fetch(
            `/api/tournament/${encodeURIComponent(id)}/${action}`,
            { method: 'POST' }
        );
        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                'Unable to update tournament.'
            );
        }

        await loadTournamentManager();
    } catch (error) {
        tournamentStatus.textContent =
            error.message;
    }
}

async function resetTournament(tournament) {
    if (
        !window.confirm(
            `Reset all teams and scores for ${tournament.name}?`
        )
    ) {
        return;
    }

    tournamentStatus.textContent =
        'Resetting tournament...';

    try {
        const response = await fetch(
            `/api/tournament/${encodeURIComponent(tournament.id)}/reset`,
            { method: 'POST' }
        );
        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                'Unable to reset tournament.'
            );
        }

        await loadTournamentManager();
    } catch (error) {
        tournamentStatus.textContent =
            error.message;
    }
}

async function saveChaser(event) {
    event.preventDefault();
    saveChaserBtn.disabled = true;
    managerStatus.textContent =
        'Saving chaser...';

    const id = editorChaserId.value;
    let image;

    try {
        image = await uploadSelectedImage();
    } catch (error) {
        managerStatus.textContent = error.message;
        saveChaserBtn.disabled = false;
        return;
    }

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
                image,
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

async function loadLiveTournamentForSetup() {
    try {
        const response = await fetch(
            '/api/tournament/live'
        );

        if (!response.ok) {
            throw new Error();
        }

        liveTournament = await response.json();
    } catch {
        liveTournament = null;
    }

    updateTournamentEnrollmentChoice();
}

function updateTournamentEnrollmentChoice() {
    const hasLiveTournament =
        Boolean(liveTournament);
    const wasDisabled =
        setupTournamentEnrollment.disabled;
    setupTournamentEnrollment.disabled =
        !hasLiveTournament;
    setupTournamentEnrollment.value =
        hasLiveTournament
            ? wasDisabled
                ? 'auto'
                : setupTournamentEnrollment.value
            : 'skip';
    setupTournamentHint.textContent =
        hasLiveTournament
            ? `Live tournament: ${liveTournament.name}. Choose whether this team is enrolled.`
            : 'No live tournament is open. This match will not be enrolled.';
}

function resetSetupForm() {
    setupTeamName.value = '';
    for (const memberInput of setupTeamMembers) {
        memberInput.value = '';
    }
    setupContestantDifficulty.value = 'all';
    setupChaserDifficulty.value = 'all';
    setupChaser.value = RANDOM_CHASER_ID;
    setupTournamentEnrollment.value =
        liveTournament ? 'auto' : 'skip';
    setupStatus.textContent = '';
    updateLaunchAvailability();
    renderSetupProfile();
}

function teamMembersFromSetup() {
    return setupTeamMembers.map(
        input => input.value.trim()
    );
}

async function launchMatch() {
    const teamName =
        setupTeamName.value.trim();

    if (!teamName) {
        setupStatus.textContent =
            'Enter the team name.';
        setupTeamName.focus();
        return;
    }

    const teamMembers = teamMembersFromSetup();
    const missingMemberIndex =
        teamMembers.findIndex(member => !member);

    if (missingMemberIndex !== -1) {
        setupStatus.textContent =
            'Enter all four team member names.';
        setupTeamMembers[missingMemberIndex].focus();
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
        : `Launching ${teamName} vs ${chaser.name}...`;

    try {
        const response = await fetch(
            '/api/match/start-match',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    teamName,
                    teamMembers,
                    contestantDifficulty:
                        setupContestantDifficulty.value,
                    chaserDifficulty:
                        setupChaserDifficulty.value,
                    enrollInTournament:
                        setupTournamentEnrollment.value !== 'skip',
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
            ? 'Opening countdown in progress. The team chase will start automatically.'
            : state?.currentPlayer === 'chaser'
                ? `Team target: ${state.targetScore}. Ready to start the Chaser chase.`
                : 'Waiting for the team chase.';
    startRoundBtn.textContent =
        'START CHASER CHASE';
    startRoundBtn.disabled =
        active ||
        Boolean(state?.winner) ||
        Boolean(state?.firstRoundPending) ||
        state?.currentPlayer !== 'chaser';
    startRoundBtn.classList.toggle(
        'hidden',
        Boolean(state?.firstRoundPending) ||
        state?.currentPlayer !== 'chaser'
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
        'Starting Chaser chase...';

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
manageTournamentBtn.onclick = openTournamentManager;
closeChaserManagerBtn.onclick = closeChaserManager;
closeTournamentManagerBtn.onclick =
    closeTournamentManager;
addChaserBtn.onclick = resetChaserEditor;
tournamentCreator.addEventListener(
    'submit',
    createTournament
);
chaserEditor.addEventListener(
    'submit',
    saveChaser
);
editorChaserImageUpload.addEventListener(
    'change',
    previewSelectedImage
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
socket.on('tournamentUpdated', () => {
    loadLiveTournamentForSetup();

    if (!tournamentManager.classList.contains('hidden')) {
        loadTournamentManager();
    }
});
setInterval(loadQuestion, 2000);
loadSetupChasers();
loadLiveTournamentForSetup();
loadDifficulties();
loadQuestion();
