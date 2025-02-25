/**
 * Copyright (c) IBM, Corp. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Route } from '@vaadin/router';

export const routes: Route[] = [
  {
    path: '/',
    name: 'home',
    component: 'page-home',
    action: async () => {
      await import('../pages/page-home.js');
    },
  },
  {
    path: '/chat',
    name: 'chat',
    component: 'page-chat',
    action: async () => {
      await import('../pages/page-chat.js');
    },
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    action: async () => {
      await import('../components/auth-callback.js');
      // No need to render a component, the script will handle the redirect
      return null;
    },
  },
  {
    path: '(.*)',
    name: 'not-found',
    component: 'page-not-found',
    action: async () => {
      await import('../pages/page-not-found.js');
    },
  },
];
