import {QUESTIONS} from '../data/questions.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
assert(QUESTIONS.length>=100,'Banco precisa ter pelo menos 100 perguntas');
assert(new Set(QUESTIONS.map(q=>q.id)).size===QUESTIONS.length,'IDs duplicados');
QUESTIONS.forEach(q=>{assert(q.alternatives.length===4,`Alternativas inválidas em ${q.id}`);assert(q.correctAnswer>=0&&q.correctAnswer<4,`Resposta inválida em ${q.id}`);assert(q.question&&q.explanation,'Texto ausente');});
console.log(`questions.test.js: OK (${QUESTIONS.length} perguntas)`);
