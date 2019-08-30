Async / Await alternative to the `cfn-response` module

**Please Read The Documentation** 

The `cfn-response` module can be tricky, it is sometimes injected automagically and sometimes not.  For a full understanding, please read the documentation [here][1]. 

Specifically pay attention to the following:

> **Note**
>
> The cfn-response module is available only when you use the ZipFile property to write your source code. It isn't available for source code that's stored in Amazon S3 buckets. For code in buckets, you must write your own functions to send responses.

### Someone on the AWS Lambda team should really take this project over

If you notice the code here is out of sync with the latest, official version from Amazon, please send a pull request and link to where Amazon has posted the latest code.

## Installation
```
$ npm install cfn-response-async
```

Sample usage:
```typescript
import { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';
import { send, SUCCESS } from 'cfn-response-async';

export const handler = async (event: CloudFormationCustomResourceEvent, context: Context) {
  console.log('request:', JSON.stringify(event, undefined, 2));
  await send(event, context, SUCCESS, {
    Response: `Hello, async/await CustomResource`
  });
};
```

Note: The example also assumes you've installed `@types/aws-lambda`

[1]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/cfn-lambda-function-code-cfnresponsemodule.html
