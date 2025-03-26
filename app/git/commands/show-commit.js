const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

class ShowCommitCommand {
  constructor(SHA) {
    this.SHA = SHA;
  }

  execute() {
    const folder = this.SHA.slice(0, 2);
    const file = this.SHA.slice(2);
    const filePath = path.join(
      process.cwd(),
      ".mygit",
      "objects",
      folder,
      file
    );

    console.log(`🔍 Looking for commit at: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: Commit object ${this.SHA} not found!`);
      return;
    }

    // Read and decompress commit object
    const fileContent = fs.readFileSync(filePath);
    console.log(`📂 Read ${fileContent.length} bytes from commit object.`);

    try {
      const outputBuffer = zlib.inflateSync(fileContent);
      const output = outputBuffer.toString();
      console.log("📜 Raw Commit Content:\n", output);

      // Parse commit content
      let lines = output.split("\n");
      let treeSHA = null,
        parentSHA = null,
        author = null,
        committer = null,
        commitMessage = "";

      let commitMessageIndex = lines.findIndex((line) => line.trim() === "");
      if (commitMessageIndex !== -1) {
        commitMessage = lines
          .slice(commitMessageIndex + 1)
          .join("\n")
          .trim();
      }

      for (let line of lines.slice(0, commitMessageIndex)) {
        if (line.startsWith("tree ")) {
          treeSHA = line.split(" ")[1];
        } else if (line.startsWith("parent ")) {
          parentSHA = line.split(" ")[1];
        } else if (line.startsWith("author ")) {
          author = line.substring(7);
        } else if (line.startsWith("committer ")) {
          committer = line.substring(10);
        }
      }

      // Print commit details
      console.log("\n==== Commit Details ====");
      console.log(`Commit: ${this.SHA}`);
      console.log(`Tree: ${treeSHA || "(No tree SHA found)"}`);
      if (parentSHA) console.log(`Parent: ${parentSHA}`);
      console.log(`Author: ${author}`);
      console.log(`Committer: ${committer}`);
      console.log("\nCommit Message:");
      console.log(commitMessage || "(No message provided)");
    } catch (error) {
      console.error("❌ Error decompressing commit object:", error.message);
    }
  }
}

module.exports = ShowCommitCommand;
