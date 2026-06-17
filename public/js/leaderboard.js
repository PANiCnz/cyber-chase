const tournamentName =
  document.getElementById('leaderboardTournamentName');
const leaderboardStatus =
  document.getElementById('leaderboardStatus');
const leaderboardTeams =
  document.getElementById('leaderboardTeams');
const leaderboardEmpty =
  document.getElementById('leaderboardEmpty');
const socket = io();

function createMemberList(team) {
  const list = document.createElement('div');
  list.className = 'team-members hidden';

  for (const member of team.members || []) {
    const item = document.createElement('span');
    item.textContent = member;
    list.appendChild(item);
  }

  return list;
}

function createTeamRow(team, index) {
  const item = document.createElement('li');
  item.className = 'leaderboard-team';

  const row = document.createElement('div');
  row.className = 'team-row';

  const rank = document.createElement('div');
  rank.className = 'team-rank';
  rank.textContent = String(index + 1).padStart(2, '0');

  const name = document.createElement('div');
  name.className = 'team-name';
  name.textContent = team.name;

  const score = document.createElement('div');
  score.className = 'team-score';
  score.textContent =
    Number.isFinite(team.score) ? team.score : '-';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'team-toggle';
  toggle.textContent = 'Players';
  toggle.setAttribute(
    'aria-expanded',
    'false'
  );

  const members = createMemberList(team);
  toggle.onclick = () => {
    const expanded =
      toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute(
      'aria-expanded',
      String(!expanded)
    );
    members.classList.toggle('hidden', expanded);
  };

  row.append(rank, name, score, toggle);
  item.append(row, members);
  return item;
}

function renderLeaderboard(tournament) {
  leaderboardTeams.replaceChildren();

  if (!tournament) {
    tournamentName.textContent =
      'No live tournament';
    leaderboardStatus.textContent =
      'Waiting for tournament';
    leaderboardEmpty.textContent =
      'Open a tournament from the presenter console to start tracking the teams.';
    leaderboardEmpty.classList.remove('hidden');
    return;
  }

  tournamentName.textContent =
    tournament.name;
  leaderboardStatus.textContent =
    `${tournament.teams.length} teams enrolled`;
  leaderboardTeams.replaceChildren(
    ...(tournament.teams || []).map(createTeamRow)
  );
  leaderboardEmpty.textContent =
    'Teams will appear here when they are enrolled.';
  leaderboardEmpty.classList.toggle(
    'hidden',
    tournament.teams.length > 0
  );
}

async function loadLeaderboard() {
  try {
    const response = await fetch(
      '/api/tournament/live'
    );

    if (!response.ok) {
      throw new Error();
    }

    renderLeaderboard(await response.json());
  } catch {
    tournamentName.textContent =
      'Tournament unavailable';
    leaderboardStatus.textContent =
      'Connection lost';
    leaderboardEmpty.textContent =
      'Unable to load tournament scores.';
    leaderboardEmpty.classList.remove('hidden');
  }
}

socket.on('tournamentUpdated', loadLeaderboard);
loadLeaderboard();
setInterval(loadLeaderboard, 5000);
