
const contestantName =
    document.getElementById('contestantName');
const contestantInitials =
    document.getElementById('contestantInitials');
const chaserName =
    document.getElementById('chaserName');
const chaserTitle =
    document.getElementById('chaserTitle');
const chaserPhoto =
    document.getElementById('chaserPhoto');
const countdown =
    document.getElementById('countdown');
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

function renderChaserPhoto(chaser) {
    chaserPhoto.replaceChildren();

    if (chaser?.image) {
        const image = document.createElement('img');
        image.src = chaser.image;
        image.alt = `${chaser.name || 'Chaser'} profile`;
        chaserPhoto.appendChild(image);
        return;
    }

    const placeholder =
        document.createElement('div');
    placeholder.className =
        'chaser-photo-placeholder';
    placeholder.textContent =
        initials(chaser?.name);
    placeholder.setAttribute(
        'aria-label',
        `${chaser?.name || 'Chaser'} photo placeholder`
    );
    chaserPhoto.appendChild(placeholder);
}

async function loadMatch() {
    const res = await fetch('/api/match/state');
    const state = await res.json();

    if(!state) {
        window.location = '/setup.html';
        return;
    }

    const displayedContestantName =
        state.contestant?.name || 'Team';
    contestantName.textContent =
        displayedContestantName;
    contestantInitials.textContent =
        initials(displayedContestantName);

    chaserName.textContent =
        state.chaser?.name || 'Chaser';
    chaserTitle.textContent =
        state.chaser?.title || '';
    chaserTitle.classList.toggle(
        'hidden',
        !state.chaser?.title
    );
    renderChaserPhoto(state.chaser);
}

async function startCountdown() {
    let remaining = 5;
    countdown.textContent = remaining;
    countdown.setAttribute(
        'aria-label',
        `${remaining} seconds remaining`
    );

    const timer = setInterval(async () => {
        remaining--;

        if(remaining > 0) {
            countdown.textContent = remaining;
            countdown.setAttribute(
                'aria-label',
                `${remaining} seconds remaining`
            );
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
                countdown.classList.add(
                    'countdown-error'
                );
                countdown.textContent =
                    'Unable to start match';
                countdown.setAttribute(
                    'aria-label',
                    'Unable to start match'
                );
            }
        }
    },1000);
}

loadMatch();
startCountdown();

socket.on('newMatch', () => {
    window.location = '/setup.html';
});
