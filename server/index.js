const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");
const initSocket = require("./socket");

const app = express();
const server = http.createServer(app);

initSocket(server);

app.use(cors({ origin: "*" }));
app.use(express.json());

const DIR = path.join(__dirname, "temp");
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);

app.post("/run", (req, res) => {
  const { code, language } = req.body;

  const id = Date.now();
  let file = "";
  let cmd = "";

  try {
    if (language === "javascript") {
      file = path.join(DIR, `code_${id}.js`);
      fs.writeFileSync(file, code);
      cmd = `node "${file}"`;
    } else if (language === "python") {
      file = path.join(DIR, `code_${id}.py`);
      fs.writeFileSync(file, code);
      cmd = `python "${file}"`;
    } else if (language === "cpp") {
      const exe = path.join(DIR, `code_${id}.exe`);
      file = path.join(DIR, `code_${id}.cpp`);
      fs.writeFileSync(file, code);
      cmd = `g++ "${file}" -o "${exe}" && "${exe}"`;
    } else if (language === "c") {
      const exe = path.join(DIR, `code_${id}.exe`);
      file = path.join(DIR, `code_${id}.c`);
      fs.writeFileSync(file, code);
      cmd = `gcc "${file}" -o "${exe}" && "${exe}"`;
    } else if (language === "java") {
      const className = "Main";
      file = path.join(DIR, `${className}.java`);
      fs.writeFileSync(file, code);
      cmd = `cd "${DIR}" && javac ${className}.java && java ${className}`;
    } else if (language === "typescript") {
      file = path.join(DIR, `code_${id}.ts`);
      fs.writeFileSync(file, code);
      cmd = `npx ts-node "${file}"`;
    } else {
      return res.json({ output: "Language not supported" });
    }

    exec(cmd, { timeout: 5000 }, (err, stdout, stderr) => {
      if (file) fs.unlink(file, () => {});

      if (err) return res.json({ output: err.message });
      if (stderr) return res.json({ output: stderr });

      res.json({ output: stdout || "No Output" });
    });
  } catch (e) {
    res.json({ output: "Execution error" });
  }
});

server.listen(5000, () => {
  console.log("🚀 Server running on 5000");
});
