
const realtimeSocket = io();

async function notifyDisplays() {
    realtimeSocket.emit('refreshGame');
}

/*
Add after successful answer actions:

await notifyDisplays();

Example:

await fetch('/api/question/correct',{method:'POST'});
await notifyDisplays();
*/
