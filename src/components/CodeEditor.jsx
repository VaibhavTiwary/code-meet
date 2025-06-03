import React, { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";

const languages = { javascript, python, java, cpp };
const languageMap = { javascript: 63, python: 71, java: 62, cpp: 54 };

const CodeEditor = ({ socket, roomId }) => {
    const [code, setCode] = useState("");
    const [language, setLanguage] = useState("javascript");
    const [output, setOutput] = useState("");

    const handleCodeChange = (value) => {
        setCode(value);
        if (socket) socket.emit("code-change", { roomId, code: value });
    };

    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        if (socket) socket.emit("language-change", { roomId, language: lang });
    };

    const runCode = async () => {
        setOutput("Running...");
        try {
            const response = await fetch(
                "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-rapidapi-key": "3135581e07msh9f50010a21999c8p11bbc3jsnaef3f116942f",
                        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
                    },
                    body: JSON.stringify({
                        language_id: languageMap[language],
                        source_code: code,
                        stdin: "",
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            let result = "";
            if (data.stdout) result = data.stdout;
            else if (data.stderr) result = data.stderr;
            else if (data.compile_output) result = data.compile_output;
            else result = "No output";

            setOutput(result);
            if (socket) {
                console.log("Sending output to others:", result);
                socket.emit("output-change", { roomId, output: result });
            }
        } catch (error) {
            const errorMsg = "Error running code: " + error.message;
            setOutput(errorMsg);
            if (socket) socket.emit("output-change", { roomId, output: errorMsg });
            console.error(error);
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleRemoteCodeChange = ({ code }) => {
            console.log("Received code change");
            setCode(code);
        };

        const handleRemoteLanguageChange = ({ language }) => {
            console.log("Received language change");
            setLanguage(language);
        };

        const handleRemoteOutputChange = ({ output }) => {
            console.log("Received output change:", output);
            setOutput(output);
        };

        socket.on("code-change", handleRemoteCodeChange);
        socket.on("language-change", handleRemoteLanguageChange);
        socket.on("output-change", handleRemoteOutputChange);

        return () => {
            socket.off("code-change", handleRemoteCodeChange);
            socket.off("language-change", handleRemoteLanguageChange);
            socket.off("output-change", handleRemoteOutputChange);
        };
    }, [socket]);

    return (
        <div className="p-4 max-h-screen flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <label className="font-semibold">Language:</label>
                <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="border p-1 rounded"
                >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                </select>
            </div>

            <div className="code-editor-container">
                <div className="flex-1 overflow-hidden border rounded" style={{ maxHeight: "400px" }}>
                    <CodeMirror
                        value={code}
                        height="100%"
                        extensions={[languages[language]()]}
                        onChange={(value) => handleCodeChange(value)}
                    />
                </div>

                <button
                    onClick={runCode}
                    className="self-start px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                    Run Code
                </button>

                <pre
                    className="p-2 bg-gray-100 rounded overflow-auto"
                    style={{ whiteSpace: "pre-wrap", minHeight: "100px", maxHeight: "200px", border: "1px solid #ccc" }}
                >
                    {output}
                </pre>
            </div>
        </div>
    );
};

export default CodeEditor;
