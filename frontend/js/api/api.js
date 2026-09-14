import {CONFIG} from '../config.js';import {mockApi} from './mockApi.js';import {backendApi} from './backendApi.js';
export const API=CONFIG.API_MODE==='backend'?backendApi:mockApi;
