var AWS = require('aws-sdk');
var s3 = new AWS.S3();

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

/**
 * Sample Lambda function which mocks the operation of checking the current price of a stock.
 * For demonstration purposes this Lambda function simply returns a random integer between 0 and 100 as the stock price.
 * 
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 *
 * @returns {Object} object - Object containing the current price of the stock
 * 
 */
exports.lambdaHandler = async (event, context, callback) => {
    // console.log(context);
    // console.log(event.detail.requestParameters);
    let params = {
        Key: event.detail.requestParameters.key,
        Bucket: event.detail.requestParameters.bucketName
    };
    // console.log("calling getObject");

    try {
        var manifestFile = await s3.getObject(params).promise();
    } catch (error) {
        console.log(error);
        return;
    }

    try {
        var manifestObj = JSON.parse(manifestFile.Body.toString('utf8'));
        // console.log(manifestObj.steps);
    } catch (error) {
        console.log(error);
        return;
    }

    // Check current price of the stock
    stock_price = getRandomInt(100) // Current stock price is mocked as a random integer between 0 and 100
    return {
        'stock_price': stock_price,
        'manifest': manifestObj,
        'steps': manifestObj.pipelines.length
    }

};