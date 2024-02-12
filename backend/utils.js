const fs = require("fs");

function fileExists(filePath) {
    return new Promise((resolve, reject) => {
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    resolve(false); // File does not exist
                } else {
                    reject(err); // Other error
                }
            } else {
                resolve(true); // File exists
            }
        });
    });
}


module.exports = {fileExists}