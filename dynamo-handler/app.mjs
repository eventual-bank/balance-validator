// DynamoDB

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});

const dynamo = DynamoDBDocumentClient.from(client);

const tableName = "account";

// CloudWatch

import  { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import { PutMetricDataCommand } from "@aws-sdk/client-cloudwatch;

const REGION = "us-east-1"
const cloudWatch = new CloudWatchClient({ region: REGION });

async function sendBalanceMetric(balance) {
  const params = {
    MetricData: [
      {
        MetricName: "OverallBalance",
        Dimensions: [
          {
            Name: "Total",
            Value: "Total",
          },
        ],
        Value: balance,
      },
    ],
    Namespace: "event_bank",
  };  

  const data = await cloudWatch.send(new PutMetricDataCommand(params));
  console.log("Success", data.$metadata.requestId);
}

export const handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json",
  };

  try {
    body = await dynamo.send(
      new ScanCommand({ TableName: tableName, AttributesToGet: ["balance"] })
    );
    body = body.Items;
    body = body.reduce((a,b) => a+b.balance, 0)

    console.log ("sendBalanceMetric: ", typeof sendBalanceMetric)

    await sendBalanceMetric(body)
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body);
  }
  return {
    statusCode,
    body,
    headers,
  };
};