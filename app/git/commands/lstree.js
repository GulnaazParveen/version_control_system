const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

class LSTreeCommand {
  constructor(flag, SHA) {
    this.flag = flag;
    this.SHA = SHA;
  }

  execute() {
    const folder = this.SHA.slice(0,2);
    const file = this.SHA.slice(2);
    const folderPath = path.join(process.cwd(), ".mygit", "objects", folder);
    const filePath = path.join(folderPath, file);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Not a valid object name ${this.SHA}`);
    }

    const fileContent = fs.readFileSync(filePath);
    const outputBuffer = zlib.inflateSync(fileContent);
    const output = outputBuffer.toString("binary"); // Read as binary

    // Extract header (tree object format: "tree <size>\0<data>")
    const nullIndex = output.indexOf("\0");
    if (nullIndex === -1) {
      throw new Error("Corrupt tree object");
    }

    let data = output.slice(nullIndex + 1); // Extract actual tree data
    let index = 0;

    while (index < data.length) {
      // Read mode (ends when we hit a space)
      let modeEnd = data.indexOf(" ", index);
      let mode = data.slice(index, modeEnd);
      index = modeEnd + 1;

      // Read file/directory name (ends at null character)
      let nameEnd = data.indexOf("\0", index);
      let name = data.slice(index, nameEnd);
      index = nameEnd + 1;

      // Read 20-byte SHA-1 (binary format)
      let shaBinary = data.slice(index, index + 20);
      let shaHex = Buffer.from(shaBinary, "binary").toString("hex");
      index += 20;

      console.log(`${mode} ${shaHex} ${name}`);
    }
  }
}

module.exports = LSTreeCommand;
