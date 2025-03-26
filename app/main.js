const fs = require("fs");
const path = require("path");
const GitClient = require("./git/client");
const gitClient = new GitClient();

// command
const CatFileCommand = require("./git/commands/cat-file");
const HashObjectCommand = require("./git/commands/hash-object");
const LSTreeCommand = require("./git/commands/lstree");
const WriteTreeCommand = require("./git/commands/write-tree");
const CommitTreeCommand = require("./git/commands/commit-tree");
const ShowCommitCommand=require("./git/commands/show-commit")
// console.log(" catfile is exit",CatFileCommand);

// You can use print statements as follows for debugging, they'll be visible when running tests.
// console.error("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const command = process.argv[2];

switch (command) {
  case "init":
    createGitDirectory();
    break;
  case "cat-file":
    handleCatFileCommand();
    break;
  case "hash-object":
    handleHashObjectCommand();
    break;
  case "ls-tree":
    handleLsTreeCommand();
    break;
  case "write-tree":
     handleWriteTreeCommand();
    break;
  case "commit-tree":
    handleCommitTreeCommand();
    break;
  case "show-commit":
    handleShowCommitCommand();
    break;
  default:
    throw new Error(`Unknown command ${command}`);
}

function createGitDirectory() {
  fs.mkdirSync(path.join(process.cwd(), ".mygit"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".mygit", "objects"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(process.cwd(), ".mygit", "refs"), { recursive: true });

  fs.writeFileSync(
    path.join(process.cwd(), ".mygit", "HEAD"),
    "ref: refs/heads/main\n"
  );
  console.log("Initialized git directory");
}

function handleCatFileCommand() {
  const flag = process.argv[3];
  const commitSHA = process.argv[4];

  if (!flag || !commitSHA) {
    throw new Error(
      "Both flag and commitSHA are required for the cat-file command"
    );
  }

  try {
    const command = new CatFileCommand(flag, commitSHA);
    gitClient.run(command);
  } catch (error) {
    console.error("Error executing cat-file command:", error.message);
  }
}

function handleHashObjectCommand() {
  let flag = process.argv[3];
  let filePath = process.argv[4];

  if (!filePath) {
    filePath = flag;
    flag = null;
  }

  const command = new HashObjectCommand(flag, filePath);
  gitClient.run(command);
}

function handleLsTreeCommand() {
 let flag=process.argv[3];
 let SHA=process.argv[4];
 if(!SHA && flag=="--name-only")return;
 if(!SHA){
   SHA=flag;
   flag=null;
 }
 const command=new LSTreeCommand(flag,SHA);
 gitClient.run(command);
}

function handleWriteTreeCommand(){
  const command=new WriteTreeCommand();
  gitClient.run(command);
}

function handleCommitTreeCommand(){
  const args = process.argv.slice(3); // Extract arguments after `commit-tree`

  if (args.length < 2) {
    console.error(
      "❌ Error: Missing required arguments. Usage: commit-tree <treeSHA> [-m <message>]"
    );
    return;
  }

  let treeSHA = args[0];
  let parentSHA = args.length > 2 && args[1] !== "-m" ? args[1] : null;

  let messageIndex = args.indexOf("-m");
  let commitMessage =
    messageIndex !== -1 && args.length > messageIndex + 1
      ? args.slice(messageIndex + 1).join(" ")
      : null;

  if (!commitMessage) {
    console.error(
      '❌ Error: Commit message is required. Use -m "your message".'
    );
    return;
  }
  const command = new CommitTreeCommand(treeSHA, parentSHA, commitMessage);
  gitClient.run(command);
}

function handleShowCommitCommand(){
  const commitSHA = process.argv[3]; 
//  console.log(commitSHA);
 
  if (!commitSHA) {
    console.error("Error: Commit SHA is required!");
    return;
  }
 const command = new ShowCommitCommand(commitSHA);
  gitClient.run(command);
}