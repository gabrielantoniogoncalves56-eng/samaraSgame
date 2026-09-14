export const router={
 navigate(path){location.hash='#'+path},
 current(){return location.hash.slice(1)||'home'},
 start(handler){const run=()=>handler(this.current());window.addEventListener('hashchange',run);run()}
};
