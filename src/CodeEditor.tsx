import React, {useRef, useState, useEffect} from "react";
import Editor, {OnMount, useMonaco} from "@monaco-editor/react";
import * as monaco from "monaco-editor";

const CodeEditor: React.FC = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useMonaco();
  const [fontSize, setFontSize] = useState<number>(14);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    console.log("Monaco instance available:", !!monacoRef);
    if (monacoRef) {
      console.log("Setting up TypeScript...");
      monacoRef.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monacoRef.languages.typescript.ScriptTarget.ES2015,
        allowNonTsExtensions: true,
      });

      monacoRef.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
      console.log("TypeScript setup complete");
    }
  }, [monacoRef]);

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    console.log("Editor mounted");
    editorRef.current = editor;

    console.log("Setting initial font size");
    editor.updateOptions({fontSize});

    console.log("Applying dark theme");
    monacoInstance.editor.setTheme("vs-dark");

    console.log("Setting up content change listener");
    editor.onDidChangeModelContent(() => {
      console.log("Content changed, triggering validation");
      validateTypeScript();
    });

    console.log("Running initial validation");
    validateTypeScript();
  };

  const validateTypeScript = () => {
    console.log("Validating TypeScript...");
    if (editorRef.current && monacoRef) {
      const model = editorRef.current.getModel();
      if (model) {
        console.log("Model available, getting TypeScript worker");
        monacoRef.languages.typescript
          .getTypeScriptWorker()
          .then((worker) => {
            console.log("TypeScript worker obtained");
            return worker(model.uri);
          })
          .then((client) => {
            console.log("TypeScript client obtained");
            return client.getSemanticDiagnostics(model.uri.toString());
          })
          .then((diagnostics) => {
            console.log("Diagnostics:", diagnostics);
            setIsValid(diagnostics.length === 0);
          })
          .catch((error) => {
            console.error("Error during TypeScript validation:", error);
            setIsValid(null);
          });
      } else {
        console.log("No model available");
        setIsValid(null);
      }
    } else {
      console.log("Editor or Monaco not available");
      setIsValid(null);
    }
  };

  const changeFontSize = (newSize: number) => {
    console.log("Changing font size to", newSize);
    setFontSize(newSize);
    editorRef.current?.updateOptions({fontSize: newSize});
  };

  const getValidationMessage = () => {
    if (isValid === null) {
      return "Validation status: Unknown";
    } else if (isValid) {
      return "✓ TypeScript code is valid";
    } else {
      return "✗ TypeScript code is invalid";
    }
  };

  return (
    <div>
      <Editor
        height='500px'
        width={window.innerWidth}
        defaultLanguage='typescript'
        defaultValue={`
function greet(name: string) {
  return "Hello, " + name;
}
greet("World");
greet(22);
        `}
        onMount={handleEditorDidMount}
        options={{
          fontSize: fontSize,
          theme: "vs-dark",
        }}
      />
      <div>
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
        <span
          style={{
            marginLeft: "10px",
            color: isValid === null ? "gray" : isValid ? "green" : "red",
          }}
        >
          {getValidationMessage()}
        </span>
      </div>
    </div>
  );
};

export default CodeEditor;
