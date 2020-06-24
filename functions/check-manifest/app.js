var AWS = require('aws-sdk');
AWS.config.update({
  region: 'ap-southeast-2'
});

var s3 = new AWS.S3();
var ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
});

/**
 *
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 *
 * @returns {Object} object - Object containing the current price of the stock
 *
 */
exports.lambdaHandler = async (event, context, callback) => {
  // const promise = new Promise(function(resolve, reject) {
  console.log(event);
  var params = {
    Key: event.detail.requestParameters.key,
    Bucket: event.detail.requestParameters.bucketName,
  };
  var manifestFile, manifestObj;
  try {
    manifestFile = await s3.getObject(params).promise();
  } catch (error) {
    console.log(error);
    return;
  }

  try {
    manifestObj = JSON.parse(manifestFile.Body.toString('utf8'));

    if (manifestObj.hasOwnProperty('releaseId') && manifestObj.hasOwnProperty('pipelines') && manifestObj.pipelines.length > 0) {
      //check to see if it exists already
      var exists = false;
      var params = {
        TableName: process.env.releasesTable,
        Key: {
          ReleaseId: manifestObj.releaseId + '',
        },
      };
      let existingRecord = await ddb.get(params).promise();
      console.log(existingRecord);

      if (existingRecord.hasOwnProperty('Item')) {
        console.log('already requested');
        return {
          steps: 0,
        };
      } else {
        console.log('logging release request ' + manifestObj.releaseId);
        params = {
          TableName: process.env.releasesTable,
          Item: {
            ReleaseId: manifestObj.releaseId + '',
            Requested: new Date().getTime() + ''
          },
        };
        console.log(params);
        // Add this release to the table
        try {
          let newRecord = await ddb.put(params).promise();
          console.log(newRecord);
        } catch (e) {
          console.log(e);
        }
      }
    } else {
      console.log("mainfestObj didn't pass test");
    }
  } catch (error) {
    console.log(error);
    return;
  }
  console.log('returning manifestObj etc');
  return {
    manifest: manifestObj,
    steps: manifestObj.pipelines.length,
  };
};