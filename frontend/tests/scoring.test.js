import {calculateScore} from '../js/game/scoring.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
assert(calculateScore({correct:true,responseMs:0,questionTimeMs:30000,streak:1})===2500,'Pontuação máxima incorreta');
assert(calculateScore({correct:true,responseMs:30000,questionTimeMs:30000,streak:1})===1000,'Pontuação mínima positiva incorreta');
assert(calculateScore({correct:false,responseMs:100,questionTimeMs:30000,streak:4})===0,'Erro deve render zero');
assert(calculateScore({correct:true,responseMs:1000,questionTimeMs:30000,streak:3})===2650,'Bônus de sequência incorreto');
console.log('scoring.test.js: OK');
