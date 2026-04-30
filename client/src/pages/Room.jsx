import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { useParams, useNavigate } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

function Room({ user }) {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");

  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef();

  useEffect(() => {
    socket.emit("join_room", roomId);

    socket.on("receive_code", (incoming) => {
      setCode((prev) => (incoming !== prev ? incoming : prev));
    });

    socket.on("receive_message", (msg) => {
      setChat((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive_code");
      socket.off("receive_message");
    };
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleCodeChange = (value) => {
    const val = value || "";
    setCode(val);
    socket.emit("send_code", { roomId, code: val });
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const msg = {
      text: message,
      name: user.displayName,
    };

    socket.emit("send_message", { roomId, msg });
    setChat((prev) => [...prev, msg]);
    setMessage("");
  };
  if (!user) return null;

  const runCode = async () => {
    if (!code.trim()) return;

    setLoading(true);

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
    } catch (err) {
      console.error(err);
      setOutput("Error running code");
    }

    setLoading(false);
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h3>Room: {roomId}</h3>
        <div>
          <button onClick={logout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      <div style={styles.main}>
        {/* LEFT SIDE */}
        <div style={styles.left}>
          <div style={styles.controls}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JS</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>

            <button onClick={runCode}>{loading ? "Running..." : "Run"}</button>
          </div>

          <CodeEditor
            code={code}
            setCode={handleCodeChange}
            language={language}
          />

          <div style={styles.output}>
            <h4>Output</h4>
            <pre>{output}</pre>
          </div>
        </div>

        {/* RIGHT CHAT */}
        <div style={styles.chat}>
          <h3>Chat</h3>

          <div style={styles.chatBox}>
            {chat.map((c, i) => (
              <div key={i}>
                <b>{c.name}: </b>
                {c.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div style={styles.chatInput}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0f172a",
    color: "white",
  },
  header: {
    padding: "10px",
    background: "#020617",
    display: "flex",
    justifyContent: "space-between",
  },
  main: {
    display: "flex",
    flex: 1,
  },
  left: {
    flex: 3,
    padding: "10px",
  },
  controls: {
    marginBottom: "10px",
    display: "flex",
    gap: "10px",
  },
  output: {
    marginTop: "10px",
    background: "#000",
    padding: "10px",
    minHeight: "100px",
    color: "#22c55e",
  },
  chat: {
    flex: 1,
    borderLeft: "1px solid #1e293b",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
  },
  chatBox: {
    flex: 1,
    overflowY: "auto",
    marginBottom: "10px",
    background: "#020617",
    padding: "10px",
  },
  chatInput: {
    display: "flex",
    gap: "5px",
  },
  logoutBtn: {
    background: "#ef4444",
    color: "white",
    padding: "5px 10px",
  },
};

export default Room;
