const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const zlib = require("zlib");
class HashObjectCommand{
    constructor(flag, filePath){
        this.flag=flag;
        this.filePath=filePath;
    }
    execute(){
        // make sure that file is there
        // read the file
        // create a blob object
        // compress the object
        // create a hash
        // if -w then write file also(compress)
        const filepath=path.resolve(this.filePath);
      if (!fs.existsSync(filepath)) {
        console.log(`File ${this.filePath} does not exist. Creating...`);
        fs.writeFileSync(filepath, "Default Content\n");
      }
        const fileContent=fs.readFileSync(filepath);
        const fileLength=fileContent.length;
        const header=`blob ${fileLength}\0`;
        const blob=Buffer.concat([Buffer.from(header),fileContent]);
        const hash=crypto.createHash("sha1").update(blob).digest("hex");
        if(this.flag && this.flag==="-w"){
            const folder=hash.slice(0,2);
            const file=hash.slice(2);
            const completeFolderPath = path.join(
              process.cwd(),
              ".mygit",
              "objects",
              folder
            );
            if(!fs.existsSync(completeFolderPath)){
                fs.mkdirSync(completeFolderPath,{recursive:true});
            }
            const compressedDate=zlib.deflateSync(blob);
            fs.writeFileSync(path.join(completeFolderPath,file),compressedDate);
        }
        process.stdout.write(hash);
    }

}
module.exports = HashObjectCommand;