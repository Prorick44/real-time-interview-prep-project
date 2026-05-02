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

  /* SOCKET FIXED */
  useEffect(() => {
    if (!roomId) return;

    socket.emit("join_room", {
      roomId,
      name: user?.displayName || "User",
    });

    socket.on("receive_code", setCode);

    socket.on("receive_message", (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    socket.on("receive_output", setOutput);

    /* FIXED USERS SYNC (no duplicates) */
    socket.on("users_update", (data) => {
      const unique = Array.from(new Map(data.map((u) => [u.id, u])).values());
      setUsers(unique);
    });

    socket.on("user_typing", (name) => {
      setTypingUser(name);
      setTimeout(() => setTypingUser(""), 1000);
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

  /* CHAT SCROLL */
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
      name: user?.displayName || "User",
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
      const res = await fetch(
        "https://real-time-interview-prep-project.onrender.com",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language }),
        },
      );

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

  /* FIXED CLEAR OUTPUT */
  const clearOutput = () => {
    setOutput(""); // force clean reset
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
      {/* LEFT */}
      <div style={styles.left}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <div style={styles.roomTitle}>🚀 Room {roomId}</div>
            <div style={styles.subText}>
              {user?.displayName} • 👥 {users.length} online
            </div>
          </div>

          <div style={styles.actions}>
            <button style={styles.blueBtn} onClick={copyRoom}>
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

            <button style={styles.greenBtn} onClick={run}>
              {running ? "Running..." : "Run"}
            </button>

            <button style={styles.purpleBtn} onClick={downloadCode}>
              ↓
            </button>

            {/* FIXED */}
            <button style={styles.orangeBtn} onClick={clearOutput}>
              Clear
            </button>

            <button style={styles.redBtn} onClick={handleExitRoom}>
              Exit
            </button>

            {/* FIXED COLOR */}
            <button style={styles.logoutBtn} onClick={handleLogout}>
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
              <b style={styles.name}>{c.name}</b> {c.text}
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
  wrapper: {
    display: "flex",
    height: "100vh",
    background: "radial-gradient(circle at top, #0f172a, #020617)",
    color: "white",
    fontFamily: "Inter",
  },

  left: { flex: 3, display: "flex", flexDirection: "column" },

  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px",
    background: "rgba(2,6,23,0.85)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #1f2937",
  },

  roomTitle: { fontSize: 18, fontWeight: "bold" },
  subText: { fontSize: 12, color: "#94a3b8" },

  actions: { display: "flex", gap: 6, flexWrap: "wrap" },

  select: {
    background: "#111827",
    color: "white",
    borderRadius: 6,
    padding: 5,
  },

  blueBtn: { background: "#3b82f6", padding: 6, border: 0, borderRadius: 6 },
  greenBtn: { background: "#22c55e", padding: 6, border: 0, borderRadius: 6 },
  purpleBtn: { background: "#6366f1", padding: 6, border: 0, borderRadius: 6 },
  orangeBtn: { background: "#f59e0b", padding: 6, border: 0, borderRadius: 6 },
  redBtn: { background: "#ef4444", padding: 6, border: 0, borderRadius: 6 },

  /* FIXED logout */
  logoutBtn: {
    background: "linear-gradient(135deg,#ef4444,#b91c1c)",
    padding: 6,
    border: 0,
    borderRadius: 6,
    fontWeight: "bold",
  },

  editor: { flex: 1 },

  output: {
    height: 150,
    background: "#020617",
    padding: 10,
    overflow: "auto",
  },

  outputTitle: { color: "#22c55e", fontWeight: "bold" },
  outputText: { color: "#22c55e" },

  chat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid #1f2937",
    background: "#020617",
  },

  chatHeader: { padding: 10, borderBottom: "1px solid #1f2937" },

  chatBody: { flex: 1, padding: 10, overflowY: "auto" },

  msg: { marginBottom: 6 },

  name: { color: "#60a5fa" },

  typing: { fontSize: 12, color: "#9ca3af" },

  chatInput: { display: "flex", padding: 10, gap: 5 },

  input: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    border: "none",
    outline: "none",
  },

  sendBtn: {
    background: "#3b82f6",
    border: 0,
    borderRadius: 6,
    color: "white",
    padding: "8px 12px",
  },
};
