import https from 'https';
import { parse, UrlWithStringQuery } from 'url';

import { CloudFormationCustomResourceEvent, Context, CloudFormationCustomResourceResponse } from 'aws-lambda';

import { retry } from './retry';

export const SUCCESS = "SUCCESS";
export const FAILED = "FAILED";

type ResponseStatus = typeof SUCCESS | typeof FAILED;

export const send = async (
  event: CloudFormationCustomResourceEvent,
  context: Context,
  status: ResponseStatus,
  response?: any,
  physicalResourceId?: string,
  retries = 3
) => {
  const cfnResponse: CloudFormationCustomResourceResponse = {
    Status: status,
    Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
    PhysicalResourceId: physicalResourceId || context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: response
  };

  const responseBody = JSON.stringify(cfnResponse);
  console.log("Response body:\n", responseBody);

  const parsedUrl = parse(event.ResponseURL);
  const boundRequest = sendRequest.bind(null, parsedUrl, responseBody);
  await retry(boundRequest, { retries });
};

const sendRequest = async (parsedUrl: UrlWithStringQuery, responseBody: string) => {
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: "PUT",
    headers: {
      "content-type": "",
      "content-length": responseBody.length
    }
  };

  return new Promise((resolve, reject) => {
    var request = https.request(options, (response) => {
      console.log("Status code: " + response.statusCode);
      console.log("Status message: " + response.statusMessage);
      resolve();
    });

    request.on("error", (error) => {
      console.log("send(..) failed executing https.request(..): " + error);
      reject(error);
    });

    request.write(responseBody);
    request.end();
  });
};

export default send;
