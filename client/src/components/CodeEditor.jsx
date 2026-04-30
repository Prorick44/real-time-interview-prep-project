import Editor from "@monaco-editor/react";

function CodeEditor({ code, setCode, language }) {
  return (
    <Editor
      height="60vh"
      theme="vs-dark"
      language={language || "javascript"}
      value={code || ""}
      onChange={(value) => setCode(value || "")}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        automaticLayout: true,
      }}
    />
  );
}

export default CodeEditor;
