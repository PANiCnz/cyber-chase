
const r=require('express').Router();
const ms=require('../services/matchService');
r.post('/start-match',(req,res)=>res.json(ms.startMatch(
    req.body.contestantName,
    req.body.chaserName,
    req.body.contestantDepartment
)));
r.get('/state',(req,res)=>res.json(ms.getMatch()));
module.exports=r;
