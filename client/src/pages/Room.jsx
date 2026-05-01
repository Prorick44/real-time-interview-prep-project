import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { useParams, useNavigate } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Room({ user }) {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");

  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");

  const chatRef = useRef();

  // SOCKET
  useEffect(() => {
    socket.emit("join_room", roomId);

    const handleReceiveCode = (incoming) => {
      setCode(incoming);
    };

    const handleReceiveMsg = (msg) => {
      setChat((prev) => [...prev, msg]);
    };

    socket.on("receive_code", handleReceiveCode);
    socket.on("receive_message", handleReceiveMsg);

    return () => {
      socket.off("receive_code", handleReceiveCode);
      socket.off("receive_message", handleReceiveMsg);
    };
  }, [roomId]);

  useEffect(() => {
    console.log("Joining room:", roomId);
    socket.emit("join_room", roomId);
  }, [roomId]);

  // AUTO SCROLL
  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // CODE CHANGE
  const handleCode = (val) => {
    const v = val || "";
    setCode(v);
    socket.emit("send_code", { roomId, code: v });
  };
  // CHAT
  const sendMsg = () => {
    if (!message.trim()) return;

    const msg = {
      text: message,
      name: user?.displayName || "User",
    };

    socket.emit("send_message", { roomId, msg });

    // 👇 ADD THIS BACK (you removed earlier)
    setChat((prev) => [...prev, msg]);

    setMessage("");
  };

  // RUN CODE
  const run = async () => {
    if (!code.trim()) return;

    setOutput("Running...");

    try {
      const res = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, language }),
      });

      const data = await res.json();
      setOutput(data.output);
    } catch {
      setOutput("Error running code");
    }
  };

  // EXIT ROOM
  const handleExitRoom = () => {
    socket.emit("leave_room", roomId);
    navigate("/");
  };

  // LOGOUT
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
            <h3 style={{ margin: 0 }}>Room: {roomId}</h3>
            <small style={{ color: "#9ca3af" }}>{user?.displayName}</small>
          </div>

          <div style={styles.controls}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={styles.select}
            >
              <option value="javascript">JS</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="java">Java</option>
              <option value="typescript">TS</option>
            </select>

            <button onClick={run} style={styles.runBtn}>
              ▶ Run
            </button>

            <button onClick={handleExitRoom} style={styles.exitBtn}>
              Exit
            </button>

            <button onClick={handleLogout} style={styles.logoutBtn}>
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
          <div style={styles.outputHeader}>Output</div>
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
          <div ref={chatRef} />
        </div>

        <div style={styles.chatInput}>
          <input
            style={styles.input}
            value={message}
            placeholder="Type message..."
            onChange={(e) => setMessage(e.target.value)}
          />
          <button style={styles.sendBtn} onClick={sendMsg}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// STYLES
const styles = {
  container: {
    display: "flex",
    height: "100vh",
    background: "#0f172a",
    color: "white",
    fontFamily: "sans-serif",
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
    padding: "10px 20px",
    background: "#020617",
    borderBottom: "1px solid #1f2937",
  },

  controls: {
    display: "flex",
    gap: 10,
  },

  select: {
    padding: "6px 10px",
    borderRadius: 6,
    background: "#111827",
    color: "white",
    border: "1px solid #374151",
  },

  runBtn: {
    padding: "6px 14px",
    background: "#22c55e",
    border: "none",
    borderRadius: 6,
    color: "black",
    cursor: "pointer",
    fontWeight: "bold",
  },

  exitBtn: {
    padding: "6px 12px",
    background: "#f59e0b",
    border: "none",
    borderRadius: 6,
    color: "black",
    cursor: "pointer",
  },

  logoutBtn: {
    padding: "6px 12px",
    background: "#ef4444",
    border: "none",
    borderRadius: 6,
    color: "white",
    cursor: "pointer",
  },

  editor: {
    flex: 1,
  },

  output: {
    background: "#020617",
    borderTop: "1px solid #1f2937",
    padding: 10,
    height: 150,
    overflow: "auto",
  },

  outputHeader: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#22c55e",
  },

  outputText: {
    margin: 0,
    color: "#22c55e",
  },

  chat: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid #1f2937",
    background: "#020617",
  },

  chatHeader: {
    padding: 10,
    borderBottom: "1px solid #1f2937",
    fontWeight: "bold",
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
    marginRight: 5,
    fontWeight: "bold",
  },

  text: {
    color: "#e5e7eb",
  },

  chatInput: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid #1f2937",
    gap: 5,
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
