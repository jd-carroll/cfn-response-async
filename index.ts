import https from 'https';
import { parse, UrlWithStringQuery } from 'url';
import { promisify } from 'util';

import { CloudFormationCustomResourceEvent, Context, CloudFormationCustomResourceResponse } from 'aws-lambda';

export const SUCCESS = "SUCCESS";
export const FAILED = "FAILED";

type ResponseStatus = typeof SUCCESS | typeof FAILED;
const timeoutPromise = promisify(setTimeout);

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

  let retryCount = 0;
  while (retryCount++ < retries) {
    // This call will only fail when the network call fails
    // If the call succeeds, but receives a non-200 response, the promise still resolves successfully
    const result = await to(sendRequest(parsedUrl, responseBody));
    if (result[0] == null) {
      break;
    }

    // Just in case there was a network blip
    await timeoutPromise(500 * retryCount);
  }
};

const to  = <T, U = Error>(
  promise: Promise<T>,
  errorExt?: object
): Promise<[U | null, T | undefined]> => {
  return promise
    .then<[null, T]>((data: T) => [null, data])
    .catch<[U, undefined]>((err: U) => {
      if (errorExt) {
        Object.assign(err, errorExt);
      }

      return [err, undefined];
    });
}

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
      reject();
    });

    request.write(responseBody);
    request.end();
  });
};

export default send;
