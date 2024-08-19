import React, {useRef, useState, useEffect} from "react";
import Editor, {OnMount, useMonaco} from "@monaco-editor/react";
import * as monaco from "monaco-editor";

const CodeEditor: React.FC = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useMonaco();
  const [fontSize, setFontSize] = useState<number>(14);
  const [isValid, setIsValid] = useState<boolean>(false);

  useEffect(() => {
    if (monacoRef) {
      monacoRef.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monacoRef.languages.typescript.ScriptTarget.ES2015,
        allowNonTsExtensions: true,
      });

      // Ensure TypeScript is registered
      monacoRef.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
    }
  }, [monacoRef]);

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;

    // Set print width and other editor options
    editor.getModel()?.updateOptions({
      tabSize: 2,
    });

    // Set initial font size
    editor.updateOptions({fontSize});

    // Apply dark theme
    monacoInstance.editor.setTheme("vs-dark");

    // Set up change event listener for validation
    editor.onDidChangeModelContent(() => {
      validateTypeScript();
    });

    // Initial validation
    validateTypeScript();
  };

  const validateTypeScript = () => {
    if (editorRef.current && monacoRef) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.languages.typescript.getTypeScriptWorker().then((worker) => {
          worker(model.uri).then((client) => {
            client
              .getSemanticDiagnostics(model.uri.toString())
              .then((diagnostics) => {
                console.log(diagnostics);
                setIsValid(diagnostics.length === 0);
              });
          });
        });
      }
    }
  };

  const formatCode = () => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  };

  const changeFontSize = (newSize: number) => {
    setFontSize(newSize);
    editorRef.current?.updateOptions({fontSize: newSize});
  };

  return (
    <div>
      <Editor
        height='500px'
        width={window.innerWidth - 50}
        defaultLanguage='typescript'
        defaultValue='// Your TypeScript code here'
        onMount={handleEditorDidMount}
        options={{
          fontSize: fontSize,
          theme: "vs-dark",
        }}
      />
      <div>
        <button onClick={formatCode}>Format Code</button>
        <label htmlFor='fontSize' style={{marginLeft: "10px"}}>
          Font Size:{" "}
        </label>
        <input
          id='fontSize'
          type='number'
          value={fontSize}
          onChange={(e) => changeFontSize(Number(e.target.value))}
          min='8'
          max='30'
        />
        <span style={{color: isValid ? "green" : "red", marginLeft: "10px"}}>
          TypeScript code is {isValid ? "valid" : "invalid"}
        </span>
      </div>
    </div>
  );
};

export default CodeEditor;
