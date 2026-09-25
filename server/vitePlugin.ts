import type { Plugin } from 'vite';
import { apiAuthMiddleware } from './apiRouter.ts';

export function otpAuthVitePlugin(): Plugin {
  return {
    name: 'otp-auth-vite-plugin',
    configureServer(server) {
      server.middlewares.use(apiAuthMiddleware);
    },
  };
}
