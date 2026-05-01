const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
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
    // ---------- JS ----------
    if (language === "javascript") {
      file = path.join(DIR, `code_${id}.js`);
      fs.writeFileSync(file, code);
      cmd = `node "${file}"`;
    }

    // ---------- PYTHON ----------
    else if (language === "python") {
      file = path.join(DIR, `code_${id}.py`);
      fs.writeFileSync(file, code);
      cmd = `python "${file}"`;
    }

    // ---------- C++ ----------
    else if (language === "cpp") {
      const exe = path.join(DIR, `code_${id}.exe`);
      file = path.join(DIR, `code_${id}.cpp`);
      fs.writeFileSync(file, code);
      cmd = `g++ "${file}" -o "${exe}" && "${exe}"`;
    }

    // ---------- C ----------
    else if (language === "c") {
      const exe = path.join(DIR, `code_${id}.exe`);
      file = path.join(DIR, `code_${id}.c`);
      fs.writeFileSync(file, code);
      cmd = `gcc "${file}" -o "${exe}" && "${exe}"`;
    }

    // ---------- JAVA ----------
    else if (language === "java") {
      const className = "Main";
      file = path.join(DIR, `${className}.java`);
      fs.writeFileSync(file, code);

      cmd = `cd "${DIR}" && javac ${className}.java && java ${className}`;
    }

    // ---------- TYPESCRIPT ----------
    else if (language === "typescript") {
      file = path.join(DIR, `code_${id}.ts`);
      fs.writeFileSync(file, code);
      cmd = `npx ts-node "${file}"`;
    }

    // ---------- DEFAULT ----------
    else {
      return res.json({ output: "Language not supported" });
    }

    exec(cmd, { timeout: 5000 }, (err, stdout, stderr) => {
      if (file) fs.unlink(file, () => {});

      if (err) return res.json({ output: err.message });
      if (stderr) return res.json({ output: stderr });

      res.json({ output: stdout || "No Output" });
    });
  } catch {
    res.json({ output: "Execution error" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log("Server running on 5000"));
