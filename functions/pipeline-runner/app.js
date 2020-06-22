var AWS = require('aws-sdk');
var codepipeline = new AWS.CodePipeline();
/**
 * Sample Lambda function which mocks the operation of buying a random number of shares for a stock.
 * For demonstration purposes, this Lambda function does not actually perform any  actual transactions. It simply returns a mocked result.
 * 
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 *
 * @returns {Object} object - Object containing details of the stock buying transaction
 * 
 */

exports.lambdaHandler = async (event, context) => {
    console.log(event);
    var params = {
        name: event.pipeline,
    };
    try {
        var execution = await codepipeline.startPipelineExecution(params).promise();
        console.log(execution); // successful response
        return execution;
    } catch (error) {
        console.log(error);
    }
};