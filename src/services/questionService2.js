
const fs=require('fs'); const path=require('path');
function parse(file){
 const rows=fs.readFileSync(file,'utf8').trim().split('\n');
 const h=rows.shift().split(',');
 return rows.map(r=>{const c=r.split(',');let o={};h.forEach((x,i)=>o[x]=c[i]);return o;});
}
function load(){
 return {
  contestant: parse(path.join(process.cwd(),'questions','contestant.csv')),
  chaser: parse(path.join(process.cwd(),'questions','chaser.csv'))
 };
}
module.exports={load};
