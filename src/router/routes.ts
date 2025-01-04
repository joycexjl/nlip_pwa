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
    path: '/user',
    name: 'user',
    component: 'page-user',
    action: async () => {
      await import('../pages/page-user.js');
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
    path: '(.*)',
    name: 'not-found',
    component: 'page-not-found',
    action: async () => {
      await import('../pages/page-not-found.js');
    },
  },
];
