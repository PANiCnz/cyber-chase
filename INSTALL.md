
V3.2 Timer System

1. Copy:
   src/services/timerService.js
   src/routes/timerRoutes.js

2. In src/server.js add:

const timerRoutes = require('./routes/timerRoutes');
app.use('/api/timer', timerRoutes);

3. Presenter page:
Add

<script src="/js/timer-presenter.js"></script>

4. Audience display:
Add

<div id="timer">60</div>
<script src="/js/timer-display.js"></script>

5. Rebuild:

docker compose down
docker compose build --no-cache
docker compose up -d
