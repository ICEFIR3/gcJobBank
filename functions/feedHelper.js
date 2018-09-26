const config = require('./configuration');
//const request = require('request');

const feedParser = function () {

    return {
        getFeed : function (callback) {
            let url = config.feeds['on-en'];
            let data; 
            return callback(null, null);
            /*request(url, function (error, response, body) {
              if (!error && response.statusCode === 200) {
                 data = JSON.parse(body);
                 console.log(data);
                 return callback(error, data);
              }else {
            	  console.log("getFeed ERROR");
            	  return callback(error, null);
              }
            });*/
        }
    };
}();


module.exports = feedParser;
