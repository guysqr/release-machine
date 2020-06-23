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
    TableName: process.env.executionsTable,
    IndexName: 'releaseIndex',
    KeyConditionExpression: 'ReleaseId = :hkey',
    ExpressionAttributeValues: {
      ':hkey': event.manifest.releaseId + '',
    },
  };

  var query = await ddb.query(params).promise();
  console.log(query);
  if (query && query.hasOwnProperty('Items') && query.Items.length > 0) {
    for (var i = 0; i < query.Items.length; i++) {
      var executionParams = {
        pipelineExecutionId: query.Items[i].ExecutionId /* required */,
        pipelineName: query.Items[i].Pipeline /* required */,
      };
      var execution = await codepipeline.getPipelineExecution(executionParams).promise();
      console.log(execution);
      if (execution.pipelineExecution.status !== query.Items[i].Status) {
        console.log('New status: ' + execution.pipelineExecution.status);
      }
    }
  }

  //   params = {
  //     TableName: process.env.executionsTable,
  //     Item: {
  //       ExecutionId: execution.pipelineExecutionId,
  //       ReleaseId: event.releaseId,
  //       Pipeline: event.pipeline,
  //       Timestamp: new Date().getTime() + '',
  //       Status: 'Started',
  //     },
  //   };
  //   console.log(params);

  //   // Add this execution to the table
  //   try {
  //     let newRecord = await ddb.put(params).promise();
  //     console.log(newRecord);
  //   } catch (e) {
  //     console.log(e);
  //   }
  //   var params = {
  //     name: event.pipeline,
  //   };
  //   var params = {
  //     pipelineExecutionId: 'STRING_VALUE' /* required */,
  //     pipelineName: 'STRING_VALUE' /* required */,
  //   };
  //   codepipeline.getPipelineExecution(params, function (err, data) {
  //     if (err) console.log(err, err.stack);
  //     // an error occurred
  //     else console.log(data); // successful response
  //   });

  //   var execution = await codepipeline.startPipelineExecution(params).promise();
  //   console.log(execution); // successful response
  //   if (execution.hasOwnProperty('pipelineExecutionId')) {
  //     params = {
  //       TableName: process.env.executionsTable,
  //       Item: {
  //         ExecutionId: execution.pipelineExecutionId,
  //         ReleaseId: event.releaseId,
  //         Pipeline: event.pipeline,
  //         Timestamp: new Date().getTime() + '',
  //         Status: 'Started',
  //       },
  //     };
  //     console.log(params);
  //     // Add this execution to the table
  //     try {
  //       let newRecord = await ddb.put(params).promise();
  //       console.log(newRecord);
  //     } catch (e) {
  //       console.log(e);
  //     }
  //     return execution;
  //   } else {
  //     console.log('Failed to start pipeline ' + event.pipeline);
  //   }
};
