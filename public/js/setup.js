
const contestantName =
  document.getElementById('contestantName');
const contestantDepartment =
  document.getElementById('contestantDepartment');
const chaserSelect =
  document.getElementById('chaserName');
const chaserProfile =
  document.getElementById('chaserProfile');
const chaserTitle =
  document.getElementById('chaserTitle');
const chaserDepartment =
  document.getElementById('chaserDepartment');
const chaserBio =
  document.getElementById('chaserBio');
const startBtn =
  document.getElementById('startBtn');
const status =
  document.getElementById('status');

let chasers = [];

const RANDOM_CHASER_ID = 'random';

function selectedChaser() {
  return chasers.find(
    chaser => chaser.id === chaserSelect.value
  );
}

function randomChaser() {
  const index = Math.floor(
    Math.random() * chasers.length
  );

  return chasers[index];
}

function renderProfile() {
  if (chaserSelect.value === RANDOM_CHASER_ID) {
    chaserTitle.textContent = 'Random Chaser';
    chaserDepartment.textContent =
      'Selected when the match starts';
    chaserBio.textContent =
      'One of the active chasers will be chosen at random.';
    chaserProfile.classList.remove('hidden');
    return;
  }

  const chaser = selectedChaser();

  if (!chaser) {
    chaserProfile.classList.add('hidden');
    return;
  }

  chaserTitle.textContent =
    chaser.title || chaser.name;
  chaserDepartment.textContent =
    chaser.department || '';
  chaserBio.textContent =
    chaser.bio || '';
  chaserProfile.classList.remove('hidden');
}

function populateChasers() {
  chaserSelect.replaceChildren();

  const randomOption =
    document.createElement('option');
  randomOption.value = RANDOM_CHASER_ID;
  randomOption.textContent = 'Random';
  chaserSelect.appendChild(randomOption);

  for (const chaser of chasers) {
    const option =
      document.createElement('option');

    option.value = chaser.id;
    option.textContent = chaser.name;
    chaserSelect.appendChild(option);
  }

  chaserSelect.disabled = false;
  startBtn.disabled = false;
  status.textContent = '';
  renderProfile();
}

async function loadChasers() {
  status.textContent = 'Loading chasers...';

  try {
    const response = await fetch('/api/chasers');

    if (!response.ok) {
      throw new Error('Unable to load chasers');
    }

    const result = await response.json();

    if (!Array.isArray(result) || result.length === 0) {
      chaserSelect.replaceChildren();

      const option =
        document.createElement('option');
      option.value = '';
      option.textContent = 'No chasers available';
      chaserSelect.appendChild(option);
      status.textContent =
        'No active chaser profiles are available.';
      return;
    }

    chasers = result;
    populateChasers();
  } catch (error) {
    chaserSelect.replaceChildren();

    const option =
      document.createElement('option');
    option.value = '';
    option.textContent = 'Chasers unavailable';
    chaserSelect.appendChild(option);
    status.textContent =
      'Could not load chaser profiles. Please try again.';
  }
}

async function startMatch() {
  const chaser = chaserSelect.value === RANDOM_CHASER_ID
    ? randomChaser()
    : selectedChaser();

  if (!chaser) {
    status.textContent =
      'Select a chaser before starting the match.';
    return;
  }

  startBtn.disabled = true;
  status.textContent =
    chaserSelect.value === RANDOM_CHASER_ID
      ? `Randomly selected ${chaser.name}. Starting match...`
      : 'Starting match...';

  try {
    const response = await fetch(
      '/api/match/start-match',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contestantName: contestantName.value,
          contestantDepartment:
            contestantDepartment.value,
          chaserId: chaser.id,
          chaserName: chaser.name
        })
      }
    );

    if (!response.ok) {
      const result = await response.json()
        .catch(() => ({}));

      throw new Error(
        result.error || 'Failed to start match'
      );
    }

    status.textContent =
      'Match started successfully';
    setTimeout(() => {
      window.location = '/intro.html';
    }, 1000);
  } catch (error) {
    status.textContent =
      error.message || 'Failed to start match';
    startBtn.disabled = false;
  }
}

chaserSelect.addEventListener(
  'change',
  renderProfile
);
startBtn.addEventListener('click', startMatch);

loadChasers();
