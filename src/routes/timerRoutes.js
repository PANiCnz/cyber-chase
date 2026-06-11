
const router = require('express').Router();
const timer = require('../services/timerService');

router.get('/state', (req,res)=>res.json(timer.state()));
router.post('/start', (req,res)=>{ timer.start(); res.json(timer.state()); });
router.post('/pause', (req,res)=>{ timer.pause(); res.json(timer.state()); });
router.post('/reset', (req,res)=>{ timer.reset(); res.json(timer.state()); });

module.exports = router;
