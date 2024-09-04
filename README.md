# AWS Lambdas in Java, in a TypeScript CDK app

I've always written my [CDK stacks in TypeScript](https://docs.aws.amazon.com/cdk/v2/guide/languages.html)
because (a) it's a nice, fluent language to use, and (b) I often write my application code in TypeScript, be that a
[Node.js](https://nodejs.org) server or a [React](https://react.dev/) / [Angular](https://angular.dev/) /
[WebComponents](https://hybrids.js.org/) UI, and it makes sense to write my _infrastructure-as-code_ using
the same language.

In the past, I've successfully integrated lambda functions written in C# with a TypeScript CDK app, making use of
[Code Assets](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.Code.html) to build and package my
lambdas at synth time. Here I achieve the same for a
[Java lambda function](https://docs.aws.amazon.com/lambda/latest/dg/lambda-java.html).

## Commands

Remember to `npm ci` before running your first command.

* `npm run synth`   Synthesizes the CloudFormation templates
* `npm run deploy`  Deploys all resources to your default AWS account/region
* `npm run destroy` Destroys all deployed resources
* `npm run clean`   Deletes the `cdk.out` directory

### Synth

Compilation and bundling of the lambda function (via [maven](https://maven.apache.org/wrapper/)) are performed during
the `synth` step. By default, this is done in a Docker container, which is the most portable solution.

If that doesn't work for you, you can enable local build via context property `buildlocal`.
This can be provided on command-line:

```shell
npm run synth -- --context buildlocal=true
```

Alternatively, you can add it to your `cdk.context.json` file:

```json
{
  "buildlocal": true
}
```

## Testing Locally

If you have the
[SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
installed, you can use the following commands to test the stack without needing to deploy to an AWS account.
Remember to `npm run synth` first!

### Test the Lambda function

```shell
# Invoke the lambda with a test event
npm run sam:lambda run-length-encoder -- -e lambdas/run-length-encoder/events/apigw_1.json

# Expected output:
{"statusCode": 200, "headers": {"Content-Type": "text/plain"}, "body": "a3b5c", "isBase64Encoded": false}
```

### Test the API Gateway endpoint

```shell
# Run the HTTP API Gateway locally ...
npm run sam:api

# ... Then hit the endpoint in a separate terminal
curl http://localhost:3000/run-length-encoder -d "aaabbbbbcddeeeeeee"

# Expected output:
a3b5cd2e7
```

## Final Thoughts

It would be quite simple to write an
[L3 construct](https://docs.aws.amazon.com/cdk/v2/guide/constructs.html#constructs_lib_levels)
based on this stack, but I leave that exercise for another day.

Oh, and I stick by my choice of TypeScript for the CDK code, even when writing lambdas in Java.
Have you seen how verbose Java CDK code is? Builder hell, no thank you...
