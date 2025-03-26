const crypto = require("crypto");
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

class CommitTreeCommand {
  constructor(treeSHA, parentSHA, message) {
     this.treeSHA = treeSHA;
     this.parentSHA = parentSHA;
     this.message = message;
  }

  execute() {
    // Get author and committer details
    const author = process.env.USER || "Unknown User";
    const email = process.env.EMAIL || "unknown@example.com";
    const timestamp = Math.floor(Date.now() / 1000);
    const timezone = "+0000";

    // ✅ Ensure commit structure is correct
    let commitContent = `tree ${this.treeSHA}\n`;
    if (this.parentSHA) {
      commitContent += `parent ${this.parentSHA}\n`;
    }
    commitContent += `author ${author} <${email}> ${timestamp} ${timezone}\n`;
    commitContent += `committer ${author} <${email}> ${timestamp} ${timezone}\n\n`;
    commitContent += `${this.message.trim()}\n`; // ✅ Fix commit message appending

    // Convert commitContent to buffer
    const commitBuffer = Buffer.from(commitContent, "utf-8");

    // Create header
    const header = `commit ${commitBuffer.length}\0`;
    const data = Buffer.concat([Buffer.from(header), commitBuffer]);

    // Compute SHA-1 hash
    const hash = crypto.createHash("sha1").update(data).digest("hex");

    // Determine folder & file path
    const folder = hash.slice(0, 2);
    const file = hash.slice(2);
    const completeFolderPath = path.join(
      process.cwd(),
      ".mygit",
      "objects",
      folder
    );

    // Create directory if it doesn't exist
    if (!fs.existsSync(completeFolderPath)) {
      fs.mkdirSync(completeFolderPath, { recursive: true });
    }

    // Compress and save the commit object
    const compressedData = zlib.deflateSync(data);
    fs.writeFileSync(path.join(completeFolderPath, file), compressedData);

    // ✅ Print the commit hash correctly
    process.stdout.write(hash + "\n");
  }
}

module.exports = CommitTreeCommand;
