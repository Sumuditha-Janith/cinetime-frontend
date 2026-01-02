import { AuthProvider } from "./context/authContext";
import Router from "./routes";

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}