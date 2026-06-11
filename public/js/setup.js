const gallery =
  document.getElementById('chaserGallery');
const status =
  document.getElementById('status');
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
loadChasers();
syncMatchState();
setInterval(syncMatchState, 2000);
