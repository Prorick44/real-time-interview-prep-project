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

  /* SOCKET */
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
      setTimeout(() => setTypingUser(""), 1200);
    });

    return () => {
      socket.off("receive_code");
      socket.off("receive_message");
      socket.off("receive_output");
      socket.off("users_update");
      socket.off("user_typing");
    };
  }, [roomId]);

  /* SAVE CODE */
  useEffect(() => {
    localStorage.setItem(`code-${roomId}`, code);
  }, [code]);

  /* AUTO SCROLL CHAT */
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
    setChat((p) => [...p, msg]);
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
    <div style={styles.wrapper}>
      {/* LEFT SIDE */}
      <div style={styles.left}>
        {/* TOP BAR */}
        <div style={styles.topbar}>
          <div>
            <h2 style={styles.title}>🚀 Room {roomId}</h2>
            <div style={styles.sub}>
              {user?.displayName} • 👥 {users.length} online
            </div>
          </div>

          <div style={styles.actions}>
            <button style={styles.btnBlue} onClick={copyRoom}>
              Copy
            </button>

            <select
              style={styles.select}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option>javascript</option>
              <option>python</option>
              <option>cpp</option>
              <option>java</option>
            </select>

            <button style={styles.btnGreen} onClick={run}>
              {running ? "Running..." : "Run"}
            </button>

            <button style={styles.btnPurple} onClick={downloadCode}>
              ↓
            </button>
            <button style={styles.btnOrange} onClick={clearOutput}>
              Clear
            </button>
            <button style={styles.btnRed} onClick={handleExitRoom}>
              Exit
            </button>
            <button style={styles.btnDark} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        {/* EDITOR */}
        <div style={styles.editor}>
          <CodeEditor code={code} setCode={handleCode} language={language} />
        </div>

        {/* OUTPUT */}
        <div style={styles.output}>
          <div style={styles.outputTitle}>⚡ Output</div>
          <pre style={styles.outputText}>{output}</pre>
        </div>
      </div>

      {/* CHAT */}
      <div style={styles.chat}>
        <div style={styles.chatHeader}>💬 Live Chat</div>

        <div style={styles.chatBody}>
          {chat.map((c, i) => (
            <div key={i} style={styles.msg}>
              <span style={styles.name}>{c.name}</span>
              <span>{c.text}</span>
            </div>
          ))}

          {typingUser && (
            <div style={styles.typing}>{typingUser} is typing...</div>
          )}

          <div ref={chatRef} />
        </div>

        <div style={styles.chatInput}>
          <input
            style={styles.input}
            value={message}
            placeholder="Message..."
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
          />
          <button style={styles.send} onClick={sendMsg}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    height: "100vh",
    background: "radial-gradient(circle at top, #0f172a, #020617)",
    color: "white",
    fontFamily: "Inter, sans-serif",
  },

  /* LEFT */
  left: {
    flex: 3,
    display: "flex",
    flexDirection: "column",
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "rgba(2,6,23,0.8)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #1f2937",
  },

  title: { margin: 0 },
  sub: { fontSize: "12px", color: "#94a3b8" },

  actions: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    alignItems: "center",
  },

  select: {
    padding: "5px",
    borderRadius: 6,
    background: "#111827",
    color: "white",
    border: "1px solid #374151",
  },

  btnGreen: { background: "#22c55e", border: 0, padding: 6, borderRadius: 6 },
  btnBlue: { background: "#3b82f6", border: 0, padding: 6, borderRadius: 6 },
  btnPurple: { background: "#6366f1", border: 0, padding: 6, borderRadius: 6 },
  btnOrange: { background: "#f59e0b", border: 0, padding: 6, borderRadius: 6 },
  btnRed: { background: "#ef4444", border: 0, padding: 6, borderRadius: 6 },
  btnDark: {
    background: "#111827",
    border: "1px solid #374151",
    padding: 6,
    borderRadius: 6,
  },

  editor: {
    flex: 1,
    borderBottom: "1px solid #1f2937",
  },

  output: {
    height: 160,
    background: "#020617",
    padding: 10,
    overflow: "auto",
  },

  outputTitle: { color: "#22c55e", fontWeight: "bold" },
  outputText: { color: "#22c55e" },

  /* CHAT */
  chat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid #1f2937",
    background: "#020617",
  },

  chatHeader: {
    padding: 12,
    borderBottom: "1px solid #1f2937",
    fontWeight: "bold",
  },

  chatBody: {
    flex: 1,
    padding: 10,
    overflowY: "auto",
  },

  msg: { marginBottom: 8 },
  name: { color: "#60a5fa", marginRight: 6 },

  typing: {
    fontSize: 12,
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

  send: {
    background: "#3b82f6",
    border: 0,
    borderRadius: 6,
    color: "white",
    padding: "8px 12px",
  },

  /* RESPONSIVE */
  "@media (max-width: 900px)": {
    wrapper: {
      flexDirection: "column",
    },
    chat: {
      height: "40vh",
    },
  },
};
