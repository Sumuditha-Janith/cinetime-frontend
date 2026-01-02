import { useAuth } from "../context/authContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold">
        Welcome{user?.firstname ? `, ${user.firstname}` : ""}
      </h1>
    </div>
  );
}
