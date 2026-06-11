
const contestantName =
    document.getElementById('contestantName');
const contestantDepartment =
    document.getElementById('contestantDepartment');
const chaserName =
    document.getElementById('chaserName');
const chaserTitle =
    document.getElementById('chaserTitle');
const chaserDepartment =
    document.getElementById('chaserDepartment');
const chaserBio =
    document.getElementById('chaserBio');
const countdown =
    document.getElementById('countdown');
const socket = io();

async function loadMatch() {
    const res = await fetch('/api/match/state');
    const state = await res.json();

    if(!state) {
        window.location = '/setup.html';
        return;
    }

    contestantName.textContent =
        state.contestant?.name || 'Contestant';
    contestantDepartment.textContent =
        state.contestant?.department || '';

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
}

async function startCountdown() {
    let remaining = 5;
    countdown.textContent = remaining;

    const timer = setInterval(async () => {
        remaining--;

        if(remaining > 0) {
            countdown.textContent = remaining;
            return;
        }

        if(remaining === 0){
            clearInterval(timer);

            try {
                const response = await fetch(
                    '/api/question/start-opening',
                    { method: 'POST' }
                );

                if (!response.ok) {
                    throw new Error();
                }

                socket.emit('refreshGame');
                window.location = '/display.html';
            } catch {
                countdown.textContent =
                    'Unable to start match';
            }
        }
    },1000);
}

loadMatch();
startCountdown();

socket.on('newMatch', () => {
    window.location = '/setup.html';
});
