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
      // Parse commit content correctly
      let lines = output.split("\n").map((line) => line.trim());

      let treeSHA = null,
        parentSHA = null,
        author = null,
        committer = null,
        commitMessage = "";

      for (let line of lines) {
        if (line.startsWith("tree ")) {
          treeSHA = line.replace("tree ", "").trim(); 
        } else if (line.startsWith("parent ")) {
          parentSHA = line.replace("parent ", "").trim();
        } else if (line.startsWith("author ")) {
          author = line.substring(7).trim();
        } else if (line.startsWith("committer ")) {
          committer = line.substring(10).trim();
        } else if (line === "") {
          commitMessage = lines
            .slice(lines.indexOf(line) + 1)
            .join("\n")
            .trim();
          break;
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
