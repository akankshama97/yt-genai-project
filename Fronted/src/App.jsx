import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app.routes";
import { AuthProvider } from "./features/auth/auth.context";
import { InterviewProvider } from "./features/interview/interview.context";
import { ensureBackendConnected } from "./services/apiClient";

function App() {
  useEffect(() => {
    // Proactively connect to and warm up backend immediately on frontend launch
    ensureBackendConnected();
  }, []);

  return (
    <AuthProvider>
      <InterviewProvider>
        <RouterProvider router={router} />
      </InterviewProvider>
    </AuthProvider>
  );
}

export default App;
