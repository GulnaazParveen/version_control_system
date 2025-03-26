const path = require("path");
const fs = require("fs");
const zlib = require("zlib");

class CatFileCommand {
  constructor(flag, commitSHA) {
    this.flag = flag;
    this.commitSHA = commitSHA;
  }

  execute() {
    const flag = this.flag;
    const commitSHA = this.commitSHA;

    switch (flag) {
      case "-p": {
        const folder = commitSHA.slice(0, 2);
        const file = commitSHA.slice(2);
        const completePath = path.join(
          process.cwd(),
          ".mygit",
          "objects",
          folder,
          file
        );

        if (!fs.existsSync(completePath)) {
          throw new Error(`Not a valid object name ${commitSHA}`);
        }

        const fileContent = fs.readFileSync(completePath);
        const outputBuffer = zlib.inflateSync(fileContent);
        const output = outputBuffer.toString();

        // Remove the "blob <size>\x00" prefix if it exists
        const nullCharIndex = output.indexOf("\x00");
        if (nullCharIndex !== -1) {
          process.stdout.write(output.slice(nullCharIndex + 1)); // Print only the content after the null character
        } else {
          process.stdout.write(output); // Print the full output if no null character is found
        }
        break;
      }
      default:
        console.error("Unknown flag");
    }
  }
}

module.exports = CatFileCommand;
