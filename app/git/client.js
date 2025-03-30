const fs = require("fs");
const path = require("path");
class GitClient {
  run(command) {
    command.execute();
  }

  async clone(remoteUrl, localDir) {
    console.log(`🛠️ Cloning from ${remoteUrl} into ${localDir}...`);

    // Create local directory structure
    fs.mkdirSync(localDir, { recursive: true });
    const gitDir = path.join(localDir, ".mygit");
    fs.mkdirSync(gitDir, { recursive: true });

    // Fetch refs
    const response = await fetch(
      `${remoteUrl}/info/refs?service=git-upload-pack`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch refs: ${response.statusText}`);
    }
    const refsData = await response.text();
    console.log("📌 Fetched refs:", refsData);

    // Extract latest commit SHA
    const match = refsData.match(/([a-f0-9]{40}) refs\/heads\/main/);
    if (!match) {
      throw new Error("Could not find main branch ref");
    }
    const latestCommitSHA = match[1];

    // Store the HEAD ref
    fs.writeFileSync(path.join(gitDir, "HEAD"), "ref: refs/heads/main\n");
    fs.mkdirSync(path.join(gitDir, "refs/heads"), { recursive: true });
    fs.writeFileSync(path.join(gitDir, "refs/heads/main"), latestCommitSHA);

    // Fetch and unpack packfile
    await this.fetchAndUnpack(remoteUrl, latestCommitSHA, gitDir);
  }

  async fetchAndUnpack(remoteUrl, commitSHA, gitDir) {
    console.log(`📦 Fetching packfile for commit ${commitSHA}...`);

    // Construct `want` packet
    const wants = `0032want ${commitSHA}\n00000009done\n`;

    const response = await fetch(`${remoteUrl}/git-upload-pack`, {
      method: "POST",
      headers: { "Content-Type": "application/x-git-upload-pack-request" },
      body: wants,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch packfile: ${response.statusText}`);
    }

    // Save packfile
    const packfileBuffer = await response.arrayBuffer();
    fs.mkdirSync(path.join(gitDir, "objects"), { recursive: true });
    fs.writeFileSync(
      path.join(gitDir, "objects", "packfile.pack"),
      Buffer.from(packfileBuffer)
    );

    console.log("✅ Packfile received and stored!");
  }
}
module.exports = GitClient;
