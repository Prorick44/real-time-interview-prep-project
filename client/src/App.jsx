import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

import Login from "./pages/Login";
import Lobby from "./pages/Lobby";
import Room from "./pages/Room";

import { Routes, Route, Navigate } from "react-router-dom";

function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log("AUTH STATE:", u);
      setUser(u || null);
    });
    return unsub;
  }, []);

  if (user === undefined) return <h2>Loading...</h2>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

      <Route
        path="/"
        element={user ? <Lobby user={user} /> : <Navigate to="/login" />}
      />

      <Route
        path="/room/:roomId"
        element={user ? <Room user={user} /> : <Navigate to="/login" />}
      />

      <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
    </Routes>
  );
}

export default App;
