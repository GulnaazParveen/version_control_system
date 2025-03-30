const http = require("http");
const fs = require("fs");
const path = require("path");

// Base repository directory
const repoBasePath = path.join(__dirname, ".mygit");

const server = http.createServer((req, res) => {
  console.log(`📩 Request received: ${req.url}`);

  if (req.url.startsWith("/info/refs")) {
    handleInfoRefs(req, res);
  } else if (req.url.startsWith("/git-upload-pack")) {
    handleGitUploadPack(req, res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

function handleInfoRefs(req, res) {
  const service = new URL(
    req.url,
    `http://${req.headers.host}`
  ).searchParams.get("service");

  if (service !== "git-upload-pack") {
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Invalid service");
    return;
  }

  res.writeHead(200, {
    "Content-Type": "application/x-git-upload-pack-advertisement",
  });
  res.write(`# service=git-upload-pack\n0000`);

  try {
    const headRefPath = path.join(repoBasePath, "refs/heads/main");
    if (!fs.existsSync(headRefPath)) {
      throw new Error("Main branch not found!");
    }
    const latestCommitSHA = fs.readFileSync(headRefPath, "utf8").trim();

    console.log(`✅ Sending HEAD ref: ${latestCommitSHA}`);
    res.write(`${latestCommitSHA} refs/heads/main\n`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  res.end();
}

function handleGitUploadPack(req, res) {
  console.log("📦 Sending packfile...");

  res.writeHead(200, {
    "Content-Type": "application/x-git-upload-pack-result",
  });

  // This is a placeholder — you need to generate a valid Git packfile!
  res.end("PACKDATA");
}

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Git server running at http://localhost:${PORT}`);
});
