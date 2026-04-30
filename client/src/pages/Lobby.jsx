import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function Lobby({ user }) {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  if (!user) return null;

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 8);
    navigate(`/room/${id}`);
  };

  const joinRoom = () => {
    if (!roomId.trim()) return;
    navigate(`/room/${roomId}`);
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>CodeCollab 🚀</h1>
        <p>Welcome {user.displayName}</p>

        <button style={styles.primaryBtn} onClick={createRoom}>
          Create Room
        </button>

        <p>OR</p>

        <input
          style={styles.input}
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button style={styles.secondaryBtn} onClick={joinRoom}>
          Join Room
        </button>

        <button style={styles.logoutBtn} onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    color: "white",
  },
  card: {
    padding: "40px",
    borderRadius: "12px",
    background: "#020617",
    textAlign: "center",
    width: "320px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
  },
  primaryBtn: {
    width: "100%",
    padding: "10px",
    background: "#3b82f6",
    color: "white",
    marginBottom: "10px",
  },
  secondaryBtn: {
    width: "100%",
    padding: "10px",
    background: "#22c55e",
    color: "white",
  },
  logoutBtn: {
    width: "100%",
    padding: "10px",
    marginTop: "15px",
    background: "#ef4444",
    color: "white",
  },
};

export default Lobby;
