import Index from './index';

/**
 * Catch-all route for Expo Router.  The actual URL bar sync is handled by
 * RootNavigator's NavigationContainer onStateChange / onReady callbacks, so
 * this file simply renders the app entry point.
 */
export default function UnmatchedRoute() {
  return <Index />;
}
