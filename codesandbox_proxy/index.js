
const express = require('express');
const { CodeSandbox } = require('@codesandbox/sdk');

const app = express();
app.use(express.json());

const CSB_API_KEY = "csb_v1_yZ1Wc9vExPV3emyAwzviqOMnlI2YGj3l2RsUdcX81XM"; // Your provided API key
let sandboxClient = null;

async function getSandboxClient() {
    if (sandboxClient) {
        return sandboxClient;
    }
    try {
        const sdk = new CodeSandbox(CSB_API_KEY);
        const sandbox = await sdk.sandboxes.create();
        sandboxClient = await sandbox.connect();
        console.log("CodeSandbox VM connected successfully.");
        return sandboxClient;
    } catch (error) {
        console.error("Failed to connect to CodeSandbox VM:", error);
        throw new Error("Failed to initialize CodeSandbox VM.");
    }
}

// Middleware to ensure sandbox client is available
app.use(async (req, res, next) => {
    try {
        await getSandboxClient();
        next();
    } catch (error) {
        res.status(500).json({ detail: error.message });
    }
});

// File System Endpoints
app.post('/fs/write_file', async (req, res) => {
    const { path, content } = req.body;
    if (!path || content === undefined) {
        return res.status(400).json({ detail: "Path and content are required." });
    }
    try {
        await sandboxClient.fs.writeFile(path, content);
        res.json({ message: `File ${path} written successfully.` });
    } catch (error) {
        console.error("Error writing file:", error);
        res.status(500).json({ detail: error.message });
    }
});

app.post('/fs/read_file', async (req, res) => {
    const { path } = req.body;
    if (!path) {
        return res.status(400).json({ detail: "Path is required." });
    }
    try {
        const contents = await sandboxClient.fs.readFile(path);
        res.json({ content: contents });
    } catch (error) {
        console.error("Error reading file:", error);
        res.status(500).json({ detail: error.message });
    }
});

app.post('/fs/list_directory', async (req, res) => {
    const { path } = req.body;
    if (!path) {
        return res.status(400).json({ detail: "Path is required." });
    }
    try {
        const files = await sandboxClient.fs.readdir(path);
        // CodeSandbox SDK's readdir returns an array of strings (filenames)
        // We need to simulate the is_dir property if the original MCP server returned it.
        // For simplicity, we'll just return the filenames for now.
        // A more robust solution would involve stat-ing each file.
        res.json({ files: files.map(name => ({ name, is_dir: false })) }); // Assuming all are files for now
    } catch (error) {
        console.error("Error listing directory:", error);
        res.status(500).json({ detail: error.message });
    }
});

// CodeSandbox SDK does not have direct create_directory, move_item, delete_item.
// These would need to be implemented using shell commands or by inferring from write/delete file.
// For now, I'll omit them or provide placeholders.
// For example, create_directory could be `mkdir -p path` via vm.run

// Shell Command Endpoint
app.post('/execute_command', async (req, res) => {
    const { command } = req.body;
    if (!command) {
        return res.status(400).json({ detail: "Command is required." });
    }
    try {
        const result = await sandboxClient.vm.run(command);
        res.json({ result: result.stdout || result.stderr || "Command executed." });
    } catch (error) {
        console.error("Error executing command:", error);
        res.status(500).json({ detail: error.message });
    }
});

const PORT = 3001; // Or any other port you prefer for the proxy
app.listen(PORT, () => {
    console.log(`CodeSandbox Proxy listening on port ${PORT}`);
});
