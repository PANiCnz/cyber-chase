
const socket = io();

async function notifyDisplays(){
    socket.emit("refreshGame");
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

loadQuestion();
