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
      {/* LEFT PANEL */}
      <div style={styles.left}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.roomTitle}>Room: {roomId}</h2>
            <p style={styles.userName}>{user?.displayName}</p>
            <p style={styles.users}>👥 {users.length} online</p>
          </div>

          <div style={styles.controls}>
            <button style={styles.copyBtn} onClick={copyRoom}>
              Copy
            </button>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={styles.select}
            >
              <option value="javascript">JS</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>

            <button style={styles.runBtn} onClick={run}>
              {running ? "Running..." : "▶ Run"}
            </button>

            <button style={styles.downloadBtn} onClick={downloadCode}>
              ⬇
            </button>

            <button style={styles.clearBtn} onClick={clearOutput}>
              ✖
            </button>

            <button style={styles.exitBtn} onClick={handleExitRoom}>
              Exit
            </button>

            <button style={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* EDITOR */}
        <div style={styles.editorWrapper}>
          <CodeEditor code={code} setCode={handleCode} language={language} />
        </div>

        {/* OUTPUT */}
        <div style={styles.output}>
          <div style={styles.outputHeader}>⚡ Output</div>
          <pre style={styles.outputText}>{output}</pre>
        </div>
      </div>

      {/* CHAT PANEL */}
      <div style={styles.chat}>
        <div style={styles.chatHeader}>💬 Chat</div>

        <div style={styles.chatBody}>
          {chat.map((c, i) => (
            <div key={i} style={styles.message}>
              <span style={styles.name}>{c.name}</span>
              <span style={styles.text}>{c.text}</span>
            </div>
          ))}

          {typingUser && (
            <div style={styles.typing}>{typingUser} typing...</div>
          )}

          <div ref={chatRef} />
        </div>

        <div style={styles.chatInput}>
          <input
            style={styles.input}
            value={message}
            placeholder="Type message..."
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
          />

          <button style={styles.sendBtn} onClick={sendMsg}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: "linear-gradient(135deg, #0f172a, #020617)",
    color: "white",
    fontFamily: "Inter, sans-serif",
  },

  left: {
    flex: 3,
    display: "flex",
    flexDirection: "column",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    background: "rgba(2,6,23,0.8)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #1f2937",
  },

  roomTitle: {
    margin: 0,
    fontSize: "18px",
  },

  userName: {
    margin: 0,
    fontSize: "12px",
    color: "#94a3b8",
  },

  users: {
    margin: 0,
    fontSize: "12px",
    color: "#22c55e",
  },

  controls: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },

  select: {
    padding: "6px",
    borderRadius: 6,
    background: "#111827",
    color: "white",
    border: "1px solid #374151",
  },

  runBtn: {
    padding: "6px 12px",
    background: "#22c55e",
    border: "none",
    borderRadius: 6,
    fontWeight: "bold",
    cursor: "pointer",
  },

  copyBtn: {
    padding: "6px 10px",
    background: "#3b82f6",
    border: "none",
    borderRadius: 6,
    color: "white",
    cursor: "pointer",
  },

  downloadBtn: {
    padding: "6px 10px",
    background: "#6366f1",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    color: "white",
  },

  clearBtn: {
    padding: "6px 10px",
    background: "#f59e0b",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    color: "black",
  },

  exitBtn: {
    padding: "6px 10px",
    background: "#f97316",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },

  logoutBtn: {
    padding: "6px 10px",
    background: "#ef4444",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    color: "white",
  },

  editorWrapper: {
    flex: 1,
    borderBottom: "1px solid #1f2937",
  },

  output: {
    height: 160,
    background: "#020617",
    padding: 10,
    overflow: "auto",
  },

  outputHeader: {
    color: "#22c55e",
    marginBottom: 5,
    fontWeight: "bold",
  },

  outputText: {
    margin: 0,
    color: "#22c55e",
    fontSize: "13px",
  },

  chat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid #1f2937",
    background: "#020617",
  },

  chatHeader: {
    padding: 12,
    fontWeight: "bold",
    borderBottom: "1px solid #1f2937",
  },

  chatBody: {
    flex: 1,
    padding: 10,
    overflowY: "auto",
  },

  message: {
    marginBottom: 8,
  },

  name: {
    color: "#60a5fa",
    marginRight: 6,
    fontWeight: "bold",
  },

  text: {
    color: "#e5e7eb",
  },

  typing: {
    fontSize: "12px",
    color: "#9ca3af",
  },

  chatInput: {
    display: "flex",
    padding: 10,
    gap: 5,
    borderTop: "1px solid #1f2937",
  },

  input: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    border: "none",
    outline: "none",
  },

  sendBtn: {
    padding: "8px 12px",
    background: "#3b82f6",
    border: "none",
    borderRadius: 6,
    color: "white",
    cursor: "pointer",
  },
};
