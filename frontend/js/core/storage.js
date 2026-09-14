const KEY='geobattle-session';
export const storage={get(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch{return{}}},set(data){localStorage.setItem(KEY,JSON.stringify({...this.get(),...data}))},clear(){localStorage.removeItem(KEY)}};
