var AWS = require('aws-sdk');
AWS.config.update({
  region: 'ap-southeast-2',
});

var codepipeline = new AWS.CodePipeline();
var ddbdc = new AWS.DynamoDB.DocumentClient({
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
    TableName: process.env.executionsTable,
    IndexName: 'releaseIndex',
    KeyConditionExpression: 'ReleaseId = :hkey',
    ExpressionAttributeValues: {
      ':hkey': event.manifest.releaseId + '',
    },
  };

  var query = await ddbdc.query(params).promise();
  console.log(query);
  var status = 'FAILED';

  if (query && query.hasOwnProperty('Items') && query.Items.length > 0) {
    var progressing = 0;
    var complete = 0;
    var failed = 0;
    for (var i = 0; i < query.Items.length; i++) {
      var executionParams = {
        pipelineExecutionId: query.Items[i].ExecutionId,
        pipelineName: query.Items[i].Pipeline,
      };
      var execution = await codepipeline.getPipelineExecution(executionParams).promise();
      console.log(execution);
      if (execution.pipelineExecution.status === 'Succeeded') {
        complete++;
      } else if (execution.pipelineExecution.status === 'InProgress') {
        progressing++;
      } else {
        failed++;
      }
      if (execution.pipelineExecution.status !== query.Items[i].Status) {
        console.log('New status: ' + execution.pipelineExecution.status);
        var updateParams = {
          TableName: process.env.executionsTable,
          Key: {
            ExecutionId: execution.pipelineExecution.pipelineExecutionId,
          },
          UpdateExpression: 'SET #new = :s',
          ExpressionAttributeValues: {
            ':s': new Date().getTime() + '',
          },
          ExpressionAttributeNames: {
            '#new': execution.pipelineExecution.status,
          },
          ReturnValues: 'UPDATED_NEW',
        };
        console.log(updateParams);
        var updateQuery = await ddbdc.update(updateParams).promise();
        console.log(updateQuery);
      }
    }
    if (failed === 0 && progressing === 0) {
      status = 'COMPLETED';
    } else if (failed > 0) {
      status = 'FAILED';
    } else {
      status = 'IN_PROGRESS';
    }
  }
  return {
    releaseStatus: status,
    releaseTimestamp: new Date().getTime() + '',
    releaseId: event.manifest.releaseId + '',
    states: [complete, progressing, failed],
    manifest: event.manifest,
  };
};
