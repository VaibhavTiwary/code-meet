import React, { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { html } from "@codemirror/lang-html";

const languages = {
    javascript,
    python,
    java,
    cpp,
    html,
};

const CodeEditor = ({ socket, roomId }) => {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');

    const handleChange = (value) => {
        setCode(value);
        socket.emit('code-change', { roomId, code: value });
    };

    useEffect(() => {
        const handleCodeChange = ({ code }) => setCode(code);
        socket.on('code-change', handleCodeChange);

        return () => {
            socket.off('code-change', handleCodeChange);
        };
    }, [socket]);

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-2">
                <label className="font-semibold">Language:</label>
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="border p-1 rounded"
                >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="html">HTML</option>
                </select>
            </div>

            <CodeMirror
                value={code}
                height="400px"
                extensions={[languages[language]()]}
                onChange={(value) => handleChange(value)}
            />
        </div>
    );
};

export default CodeEditor;