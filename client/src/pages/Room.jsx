// KEEP IMPORTS SAME
import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { useParams, useNavigate } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Room({ user }) {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [code, setCode] = useState(
    localStorage.getItem(`code-${roomId}`) || "",
  );
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");

  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");

  const [users, setUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");

  const [running, setRunning] = useState(false);

  const chatRef = useRef();

  // JOIN ROOM
  useEffect(() => {
    if (!roomId) return;

    socket.emit("join_room", {
      roomId,
      name: user?.displayName || "User",
    });

    socket.on("receive_code", setCode);
    socket.on("receive_message", (msg) => setChat((prev) => [...prev, msg]));
    socket.on("receive_output", setOutput);
    socket.on("users_update", setUsers);
    socket.on("user_typing", (name) => {
      setTypingUser(name);
      setTimeout(() => setTypingUser(""), 1500);
    });

    return () => {
      socket.off("receive_code");
      socket.off("receive_message");
      socket.off("receive_output");
      socket.off("users_update");
      socket.off("user_typing");
    };
  }, [roomId]);

  // SAVE CODE
  useEffect(() => {
    localStorage.setItem(`code-${roomId}`, code);
  }, [code]);

  // SCROLL CHAT
  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleCode = (val) => {
    setCode(val);
    socket.emit("send_code", { roomId, code: val });
  };

  const sendMsg = () => {
    if (!message.trim()) return;

    const msg = {
      text: message,
      name: user?.displayName,
    };

    socket.emit("send_message", { roomId, msg });
    setChat((prev) => [...prev, msg]);
    setMessage("");
  };

  const handleTyping = () => {
    socket.emit("typing", {
      roomId,
      name: user?.displayName,
    });
  };

  const run = async () => {
    setRunning(true);
    setOutput("Running...");

    try {
      const res = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      const data = await res.json();
      setOutput(data.output);

      socket.emit("send_output", {
        roomId,
        output: data.output,
      });
    } catch {
      setOutput("Error running code");
    }

    setRunning(false);
  };

  const copyRoom = () => {
    navigator.clipboard.writeText(roomId);
    alert("Room ID copied!");
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `code.${language}`;
    a.click();
  };

  const clearOutput = () => setOutput("");

  const handleExitRoom = () => {
    socket.emit("leave_room", roomId);
    navigate("/");
  };

  const handleLogout = async () => {
    await signOut(auth);
    socket.emit("leave_room", roomId);
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <div style={styles.header}>
          <div>
            <h3>Room: {roomId}</h3>
            <small>{user?.displayName}</small>
            <div>👥 {users.length} users</div>
          </div>

          <div style={styles.controls}>
            <button onClick={copyRoom}>Copy</button>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JS</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>

            <button onClick={run}>{running ? "Running..." : "Run"}</button>

            <button onClick={downloadCode}>Download</button>
            <button onClick={clearOutput}>Clear</button>

            <button onClick={handleExitRoom}>Exit</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <CodeEditor code={code} setCode={handleCode} language={language} />

        <div style={styles.output}>
          <pre>{output}</pre>
        </div>
      </div>

      <div style={styles.chat}>
        <div>💬 Chat</div>

        <div style={styles.chatBody}>
          {chat.map((c, i) => (
            <div key={i}>
              <b>{c.name}</b>: {c.text}
            </div>
          ))}
          {typingUser && <i>{typingUser} typing...</i>}
          <div ref={chatRef} />
        </div>

        <div style={styles.chatInput}>
          <input
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
          />
          <button onClick={sendMsg}>Send</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", height: "100vh" },
  left: { flex: 3 },
  header: { display: "flex", justifyContent: "space-between" },
  controls: { display: "flex", gap: 8 },
  output: { height: 150, overflow: "auto" },
  chat: { flex: 1 },
  chatBody: { height: "80%", overflow: "auto" },
  chatInput: { display: "flex" },
};
