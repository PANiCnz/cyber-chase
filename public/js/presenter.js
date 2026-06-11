
const socket = io();

const presenterChaserName =
    document.getElementById('presenterChaserName');
const presenterChaserTitle =
    document.getElementById('presenterChaserTitle');
const presenterChaserDepartment =
    document.getElementById('presenterChaserDepartment');
const presenterChaserBio =
    document.getElementById('presenterChaserBio');

async function notifyDisplays(){
    socket.emit("refreshGame");
}

async function loadMatchProfile(){
    const response =
        await fetch('/api/match/state');
    const state = await response.json();

    if(!state) return;

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
}

async function loadQuestion(){
    const q = await (await fetch('/api/question/current')).json();
    if(!q) return;

    questionCategory.innerText = q.category || '';
    questionDifficulty.innerText = q.difficulty || '';
    questionText.innerText = q.question || '';

    answers.innerHTML = `
      <div>A. ${q.a || ''}</div>
      <div>B. ${q.b || ''}</div>
      <div>C. ${q.c || ''}</div>
      <div>D. ${q.d || ''}</div>
    `;

    const a = await (await fetch('/api/question/answer')).json();
    correctAnswer.innerText = (a.correct || '').toUpperCase();
}

async function submitAnswer(answer){
    const res = await fetch('/api/question/respond',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({answer})
    });

    const result = await res.json();

    resultBanner.innerText = result.correct ?
        '✓ CORRECT' :
        `✗ INCORRECT (Correct: ${(result.correctAnswer||'').toUpperCase()})`;

    await notifyDisplays();
    await loadMatchProfile();
    await loadQuestion();
}

answerA.onclick = ()=>submitAnswer('a');
answerB.onclick = ()=>submitAnswer('b');
answerC.onclick = ()=>submitAnswer('c');
answerD.onclick = ()=>submitAnswer('d');

document.addEventListener('keydown',(e)=>{
    const k=e.key.toLowerCase();
    if(['a','b','c','d'].includes(k)){
        submitAnswer(k);
    }
});

socket.on('gameState', loadMatchProfile);
loadMatchProfile();
loadQuestion();
