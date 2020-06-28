var AWS = require('aws-sdk');
AWS.config.update({
  region: 'ap-southeast-2',
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
 * @returns {Object} object - Object containing the manifest data
 *
 */
exports.lambdaHandler = async (event, context) => {
  console.log(event);
  console.log(context);
  var manifestObj;
  if (event.hasOwnProperty('releaseId')) {
    manifestObj = event;
    console.log('Got manifest from API call');
  } else if (event.hasOwnProperty('detail') && event.detail.hasOwnProperty('requestParameters')) {
    var params = {
      Key: event.detail.requestParameters.key,
      Bucket: event.detail.requestParameters.bucketName,
    };

    try {
      var manifestFile = await s3.getObject(params).promise();
      try {
        manifestObj = JSON.parse(manifestFile.Body.toString('utf8'));
      } catch (e) {
        console.log('manifest could not be parsed');
        return { description: 'Manifest from S3 could not be parsed', error: e, steps: 0 };
      }
    } catch (e) {
      console.log(error);
      return { description: 'Manifest could not be read from S3', error: e, steps: 0 };
    }
  } else {
    console.log(error);
    return { description: 'No manifest was provided!', error: e, steps: 0 };
  }
  try {
    if (manifestObj.hasOwnProperty('releaseId') && manifestObj.hasOwnProperty('pipelines') && manifestObj.pipelines.hasOwnProperty('length')) {
      //check to see if release record exists already
      var params = {
        TableName: process.env.releasesTable,
        Key: {
          ReleaseId: manifestObj.releaseId + '',
        },
      };
      let existingRecord = await ddb.get(params).promise();
      console.log(existingRecord);
      // TODO could do more useful things here, like clean up failed deployments and try again
      // for now, we just ignore if attempted before
      if (existingRecord.hasOwnProperty('Item')) {
        console.log('already requested');
        return {
          steps: 0,
          error: '',
        };
      } else {
        console.log('logging release request ' + manifestObj.releaseId);
        params = {
          TableName: process.env.releasesTable,
          Item: {
            ReleaseId: manifestObj.releaseId + '',
            Requested: new Date().getTime() + '',
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
      return { description: 'Manifest was missing required fields', error: e, steps: 0 };
    }
  } catch (e) {
    console.log(error);
    return { description: 'Manifest was invalid', error: e, steps: 0 };
  }
  console.log('returning manifestObj etc');
  return {
    manifest: manifestObj,
    steps: manifestObj.pipelines.length,
    error: '',
  };
};
