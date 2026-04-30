import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const joinRoom = () => {
    if (roomId.trim() !== "") {
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <div>
      <h1>Join Interview Room</h1>
      <input
        placeholder="Enter Room ID"
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={joinRoom}>Join</button>
    </div>
  );
}

export default Home;
