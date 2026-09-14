const state={route:'home',session:null,room:null,question:null,result:null,leaderboard:[],settings:null};
const listeners=new Set();
export const appState={get(){return state},set(patch){Object.assign(state,patch);listeners.forEach(fn=>fn(state))},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}};
