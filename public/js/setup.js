const gallery =
  document.getElementById('chaserGallery');
const status =
  document.getElementById('status');
const tournamentName =
  document.getElementById('tournamentName');
const tournamentTeams =
  document.getElementById('tournamentTeams');
const tournamentEmpty =
  document.getElementById('tournamentEmpty');
const socket = io();

function initials(name) {
  return (name || 'Chaser')
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function createPhoto(chaser) {
  const frame = document.createElement('div');
  frame.className = 'profile-photo';

  if (chaser.image) {
    const image = document.createElement('img');
    image.src = chaser.image;
    image.alt = `${chaser.name} profile`;
    frame.appendChild(image);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'profile-photo-placeholder';
    placeholder.textContent = initials(chaser.name);
    placeholder.setAttribute(
      'aria-label',
      `${chaser.name} photo placeholder`
    );
    frame.appendChild(placeholder);
  }

  return frame;
}

function createProfileCard(chaser, index) {
  const card = document.createElement('article');
  card.className = 'chaser-card';

  const number = document.createElement('div');
  number.className = 'profile-number';
  number.textContent =
    String(index + 1).padStart(2, '0');

  const content = document.createElement('div');
  content.className = 'profile-content';

  const profileLabel = document.createElement('div');
  profileLabel.className = 'profile-label';
  profileLabel.textContent = 'CHASER PROFILE';

  const title = document.createElement('div');
  title.className = 'profile-title';
  title.textContent = chaser.title || 'The Chaser';

  const name = document.createElement('h2');
  name.className = 'profile-name';
  name.textContent = chaser.name;

  const department = document.createElement('div');
  department.className = 'profile-department';
  department.textContent =
    chaser.department || 'Information Security';

  const bio = document.createElement('p');
  bio.className = 'profile-bio';
  bio.textContent = chaser.bio || '';

  content.append(
    profileLabel,
    title,
    name,
    department,
    bio
  );
  card.append(
    number,
    createPhoto(chaser),
    content
  );

  return card;
}

function renderProfiles(chasers) {
  gallery.replaceChildren(
    ...chasers.map(createProfileCard)
  );
  status.textContent =
    chasers.length > 0
      ? 'Waiting for the presenter to launch the match'
      : 'No chasers are currently available';
}

async function loadChasers() {
  try {
    const response = await fetch('/api/chasers');

    if (!response.ok) {
      throw new Error();
    }

    const chasers = await response.json();

    if (!Array.isArray(chasers)) {
      throw new Error();
    }

    renderProfiles(chasers);
  } catch {
    status.textContent =
      'Chaser profiles are currently unavailable';
  }
}

function createTournamentRow(team, index) {
  const row = document.createElement('li');
  row.className = 'tournament-team';

  const rank = document.createElement('span');
  rank.className = 'team-rank';
  rank.textContent = String(index + 1).padStart(2, '0');

  const name = document.createElement('span');
  name.className = 'team-name';
  name.textContent = team.name;

  const score = document.createElement('span');
  score.className = 'team-score';
  score.textContent =
    Number.isFinite(team.score) ? team.score : '-';

  row.append(rank, name, score);
  return row;
}

function renderTournament(tournament) {
  tournamentTeams.replaceChildren();

  if (!tournament) {
    tournamentName.textContent =
      'No live tournament';
    tournamentEmpty.textContent =
      'Open a tournament from the presenter console to start tracking winning teams.';
    tournamentEmpty.classList.remove('hidden');
    return;
  }

  tournamentName.textContent =
    tournament.name;
  const teams =
    tournament.teams || [];
  tournamentTeams.replaceChildren(
    ...teams.slice(0, 8).map(createTournamentRow)
  );
  tournamentEmpty.textContent =
    teams.length > 0
      ? ''
      : 'Teams will appear here when they are enrolled.';
  tournamentEmpty.classList.toggle(
    'hidden',
    teams.length > 0
  );
}

async function loadTournament() {
  try {
    const response = await fetch(
      '/api/tournament/live'
    );

    if (!response.ok) {
      throw new Error();
    }

    renderTournament(await response.json());
  } catch {
    tournamentName.textContent =
      'Tournament unavailable';
    tournamentEmpty.textContent =
      'Unable to load tournament scores.';
    tournamentEmpty.classList.remove('hidden');
  }
}

function openMatch() {
  window.location = '/intro.html';
}

async function syncMatchState() {
  try {
    const response =
      await fetch('/api/match/state');
    const state = await response.json();

    if (!state?.started) {
      return;
    }

    window.location = state.firstRoundPending
      ? '/intro.html'
      : '/display.html';
  } catch {
    // The profile showcase remains usable while the server reconnects.
  }
}

socket.on('matchStarted', openMatch);
socket.on('chasersUpdated', loadChasers);
socket.on('tournamentUpdated', loadTournament);
loadChasers();
loadTournament();
syncMatchState();
setInterval(syncMatchState, 2000);
setInterval(loadTournament, 5000);
