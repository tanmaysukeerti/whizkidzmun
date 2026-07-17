import React from 'react';
import App from './App';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Login from './auth/Login';
import { CommitteeProvider } from './committee/CommitteeContext';

/** Projector mode is opted into via `?role=projector` (or `?projector`). */
function isProjectorMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('role') === 'projector' || params.has('projector');
}

// Gate: unauthenticated users see the login terminal; authenticated users get
// the live-synced committee app. The SSE stream only opens after login.
function Gate() {
  const { authed } = useAuth();
  if (!authed) return <Login />;
  return (
    <CommitteeProvider>
      <App />
    </CommitteeProvider>
  );
}

export default function Root() {
  const projector = isProjectorMode();
  return (
    <AuthProvider>
      {projector ? (
        // Read-only projector feed: no login, no controls, just the live state.
        <CommitteeProvider readOnly>
          <App />
        </CommitteeProvider>
      ) : (
        <Gate />
      )}
    </AuthProvider>
  );
}
