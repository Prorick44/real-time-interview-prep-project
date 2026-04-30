import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, provider);
      console.log("LOGIN SUCCESS:", res.user);
      navigate("/");
    } catch (e) {
      console.error("LOGIN ERROR:", e);
      alert(e.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>CodeCollab 🚀</h1>
        <p style={styles.subtitle}>Real-time collaborative coding platform</p>

        <button style={styles.googleBtn} onClick={handleLogin}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="google"
            style={styles.icon}
          />
          Sign in with Google
        </button>

        <p style={styles.footer}>Built for real-time coding ✨</p>
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
    background: "linear-gradient(135deg, #0f172a, #1e293b, #020617)",
    color: "white",
  },
  card: {
    backdropFilter: "blur(12px)",
    background: "rgba(255,255,255,0.05)",
    padding: "40px",
    borderRadius: "16px",
    textAlign: "center",
    width: "350px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
  },
  title: {
    marginBottom: "10px",
    fontSize: "28px",
  },
  subtitle: {
    marginBottom: "30px",
    color: "#94a3b8",
  },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "12px",
    background: "#ffffff",
    color: "#000",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "0.3s",
  },
  icon: {
    width: "20px",
  },
  footer: {
    marginTop: "20px",
    fontSize: "12px",
    color: "#64748b",
  },
};

export default Login;
