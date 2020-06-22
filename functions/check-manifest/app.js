var AWS = require('aws-sdk');
var s3 = new AWS.S3();

/**
 *
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 *
 * @returns {Object} object - Object containing the current price of the stock
 *
 */
exports.lambdaHandler = async (event, context, callback) => {
  console.log(event);
  var params = {
    Key: event.detail.requestParameters.key,
    Bucket: event.detail.requestParameters.bucketName,
  };
  var manifestFile;
  try {
    manifestFile = await s3.getObject(params).promise();
  } catch (error) {
    console.log(error);
    return;
  }

  try {
    var manifestObj = JSON.parse(manifestFile.Body.toString('utf8'));
  } catch (error) {
    console.log(error);
    return;
  }

  return {
    manifest: manifestObj,
    steps: manifestObj.pipelines.length,
  };
};
