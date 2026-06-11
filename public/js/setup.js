
document.getElementById('startBtn').addEventListener('click', async ()=>{
  const contestantName=document.getElementById('contestantName').value;
  const contestantDepartment=document.getElementById('contestantDepartment').value;
  const chaserName=document.getElementById('chaserName').value;

  const res=await fetch('/api/match/start-match',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      contestantName,
      contestantDepartment,
      chaserName
    })
  });

  if(res.ok){
    document.getElementById('status').innerText='Match started successfully';
    setTimeout(()=>window.location='/intro.html',1000);
  } else {
    document.getElementById('status').innerText='Failed to start match';
  }
});
