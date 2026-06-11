
async function loadMatch() {
    const res = await fetch('/api/match/state');
    const state = await res.json();

    if(!state) return;

    contestantName.innerText = state.contestant?.name || 'Contestant';
    contestantDepartment.innerText = state.contestant?.department || '';

    chaserName.innerText = state.chaser?.name || 'Chaser';
    chaserDepartment.innerText = state.chaser?.department || 'Information Security';
}

async function startCountdown() {
    let remaining = 5;

    const timer = setInterval(() => {
        countdown.innerText = remaining;
        remaining--;

        if(remaining < 0){
            clearInterval(timer);
            window.location = '/display.html';
        }
    },1000);
}

loadMatch();
startCountdown();
