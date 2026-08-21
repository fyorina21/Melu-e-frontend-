import { createBrowserRouter } from 'react-router';
import { RootLayout } from './components/layouts/RootLayout';
import { Login } from './components/screens/Login';
import { AdminPanel } from './components/screens/AdminPanel';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: Login },
      { path: 'admin', Component: AdminPanel },
    ],
  },
]);
