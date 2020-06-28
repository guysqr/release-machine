var AWS = require('aws-sdk');
AWS.config.update({
  region: 'ap-southeast-2',
});

var codepipeline = new AWS.CodePipeline();
var ddb = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
});

/**
 *
 * @param {Object} event - Input event to the Lambda function
 * @param {Object} context - Lambda Context runtime methods and attributes
 *
 */

exports.lambdaHandler = async (event, context) => {
  console.log(event);
  console.log(context);
  var params = {
    name: event.pipeline,
  };
  try {
    var execution = await codepipeline.startPipelineExecution(params).promise();
    console.log(execution);
    if (execution.hasOwnProperty('pipelineExecutionId')) {
      params = {
        TableName: process.env.executionsTable,
        Item: {
          ExecutionId: execution.pipelineExecutionId,
          ReleaseId: event.releaseId + '',
          Pipeline: event.pipeline,
          Started: new Date().getTime() + '',
        },
      };
      console.log(params);
      try {
        let newRecord = await ddb.put(params).promise();
        console.log(newRecord);
      } catch (e) {
        console.log(e);
        return { error: e };
      }
      return { error: '', pipeline: event.pipeline, executionId: execution };
    } else {
      console.log('Failed to start pipeline ' + event.pipeline);
    }
  } catch (e) {
    console.log('Error starting pipeline - not found: ' + event.pipeline);
    return { error: 'PipelineNotFoundException', pipeline: event.pipeline };
  }
};
