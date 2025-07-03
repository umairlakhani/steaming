const fs = require("fs");

const deleteFiles = async (filePaths) => {
  try {
    filePaths.forEach((filePath) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${filePath} - ${err}`);
          return;
        }
        console.log(`File ${filePath} has been deleted successfully`);
      });
    });
  } catch (error) {
    console.log("Error deleting file");
  }

};

module.exports = { deleteFiles };
