export const gameEngine={validateAnswer(answer){return Number.isInteger(answer)&&answer>=0&&answer<=3},formatQuestionNumber(index,total){return `PERGUNTA ${index+1}/${total}`}};
