import request from 'request';
import path from 'path';
import fs from 'fs';

var downloadImg = function (accessToken, url, filePath, callback) {
    const options = {
            url: url,
            encoding: null,
        	headers:  {
                'Authorization': 'Bearer ' + accessToken
            }
        };

    request.get(options, (e, httpResponse, body) => {
        if (e) {
            console.log(e);
            return callback(e);
        }
        var buffer = Buffer.from(body, 'binary');

        fs.writeFile(filePath, buffer, (err) => {
            if(err) {
                console.log(err);
                throw err;
            } else {
                const fileName = path.basename(filePath);
                callback(null, fileName);
            }
        });
    });
}

export default downloadImg;