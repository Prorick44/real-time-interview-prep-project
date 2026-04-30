const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/run", (req, res) => {
  const { code, language } = req.body;

  let filename = "temp";

  try {
    if (language === "javascript") {
      filename += ".js";
      fs.writeFileSync(filename, code);

      exec(`node ${filename}`, (err, stdout, stderr) => {
        if (err) return res.json({ output: err.message });
        if (stderr) return res.json({ output: stderr });
        res.json({ output: stdout });
      });
    } else if (language === "python") {
      filename += ".py";
      fs.writeFileSync(filename, code);

      exec(`python ${filename}`, (err, stdout, stderr) => {
        if (err) return res.json({ output: err.message });
        if (stderr) return res.json({ output: stderr });
        res.json({ output: stdout });
      });
    } else if (language === "cpp") {
      filename += ".cpp";
      fs.writeFileSync(filename, code);

      exec(`g++ ${filename} -o temp && ./temp`, (err, stdout, stderr) => {
        if (err) return res.json({ output: err.message });
        if (stderr) return res.json({ output: stderr });
        res.json({ output: stdout });
      });
    }
  } catch (e) {
    res.json({ output: "Execution error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running"));
