const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const zlib = require("zlib");

function writeFileBlob(currentPath) {
  const fileContent = fs.readFileSync(currentPath);
  const len = fileContent.length;
  const header = `blob ${len}\0`;
  const blob = Buffer.concat([Buffer.from(header), fileContent]);
  const hash = crypto.createHash("sha1").update(blob).digest("hex");
  const folder = hash.slice(0, 2);
  const file = hash.slice(2);
  const completeFolderPath = path.join(
    process.cwd(),
    ".mygit",
    "objects",
    folder
  );

  if (!fs.existsSync(completeFolderPath)) {
    fs.mkdirSync(completeFolderPath, { recursive: true });
  }

  const compressedData = zlib.deflateSync(blob);
  fs.writeFileSync(path.join(completeFolderPath, file), compressedData);
  return hash;
}

class WriteTreeCommand {
  constructor() {}

  execute() {
    function recursiveCreateTree(basePath) {
      const dirContent = fs.readdirSync(basePath);
      const result = [];

      for (const dirContentItem of dirContent) {
        if (dirContentItem === ".mygit") continue; // ✅ Fix: Check specific item

        const currentPath = path.join(basePath, dirContentItem);
        const stat = fs.statSync(currentPath); 

        if (stat.isDirectory()) {
          const sha = recursiveCreateTree(currentPath);
          if (sha) {
            result.push({
              mode: "40000",
              basename: path.basename(currentPath),
              sha,
            });
          }
        } else if (stat.isFile()) {
          const sha = writeFileBlob(currentPath);
          result.push({
            mode: "100644",
            basename: path.basename(currentPath),
            sha,
          });
        }
      }


      if (result.length === 0) {
        return null;
      }

      let treeDataBuffers = [];

// Here's a quick recap of what a tree object file looks like (before Zlib compression):
  // tree <size>\0
  // <mode> <name>\0<20_byte_sha>
  // <mode> <name>\0<20_byte_sha>

      for (const { mode, basename, sha } of result) {
        treeDataBuffers.push(Buffer.from(`${mode} ${basename}\0`));
        treeDataBuffers.push(Buffer.from(sha, "hex")); 
      }

      const treeData = Buffer.concat(treeDataBuffers);
      const tree = Buffer.concat([
        Buffer.from(`tree ${treeData.length}\0`),
        treeData,
      ]);
// creating a hash of the tree object
      const hash = crypto.createHash("sha1").update(tree).digest("hex");
      const folder = hash.slice(0, 2);
      const file = hash.slice(2);
      const treeFolderPath = path.join(
        process.cwd(),
        ".mygit",
        "objects",
        folder
      );

      if (!fs.existsSync(treeFolderPath)) {
        fs.mkdirSync(treeFolderPath, { recursive: true });
      }

      const compressedData = zlib.deflateSync(tree);
      fs.writeFileSync(path.join(treeFolderPath, file), compressedData);

      return hash;
    }

    const sha = recursiveCreateTree(process.cwd());
    if (sha) {
      process.stdout.write(sha + "\n");
    } else {
      console.error("Error: No tree created.");
    }
  }
}

module.exports = WriteTreeCommand;
