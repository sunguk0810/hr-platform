import { setupWorker } from 'msw/browser';
import { getActiveHandlers } from './handlers';

export const worker = setupWorker(...getActiveHandlers());
