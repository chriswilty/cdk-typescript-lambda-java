import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Code, Function, Runtime, SnapStartConf } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { AssetHashType, BundlingOutput, ILocalBundling, Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { execSync } from 'node:child_process';
import { createHash, Hash } from 'node:crypto';
import { readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, normalize } from 'node:path';
import { sync as md5Sync } from 'md5-file';

export class DemoAppStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		const tryLocalBuild = (this.node.tryGetContext('buildlocal') as string) === 'true';

		const local: ILocalBundling | undefined = tryLocalBuild ? {
			tryBundle(outDir: string): boolean {
				console.log('Bundling locally ...');
				try {
					execSync([
						`cd ${join(__dirname, '../lambdas/run-length-encoder')}`,
						`${normalize('../mvnw')} clean package`,
						`cp ${normalize('target/runlengthencoder.jar')} ${outDir}`
					].join(' && '));
					return true;
				} catch (err: unknown) {
					console.log('Fail :(');
					console.error(err);
					return false;
				}
			}
		} : undefined;

		const runLengthEncoderFn = new Function(this, 'run-length-encoder', {
			functionName: 'run-length-encoder',
			handler: 'com.example.runlengthencoder.App',
			runtime: Runtime.JAVA_21,
			snapStart: SnapStartConf.ON_PUBLISHED_VERSIONS,
			code: Code.fromAsset(join(__dirname, '../lambdas'), {
				assetHashType: AssetHashType.CUSTOM,
				assetHash: calculateHash(join(__dirname, '../lambdas/run-length-encoder/src')),
				bundling: {
					image: Runtime.JAVA_21.bundlingImage,
					user: 'root',
					entrypoint: ['/bin/sh', '-c'],
					command: [
						'cd run-length-encoder && ' +
						'../mvnw clean package && ' +
						'cp target/runlengthencoder.jar /asset-output/'
					],
					volumes: [{
						containerPath: '/root/.m2',
						hostPath: join(homedir(), '.m2'),
					}],
					outputType: BundlingOutput.ARCHIVED,
					local,
				},
			}),
			logRetention: RetentionDays.ONE_DAY,
		});

		// Then API Gateway and endpoint
		const httpApi = new HttpApi(this, 'my-api');
		httpApi.addRoutes({
			path: '/run-length-encoder',
			methods: [HttpMethod.POST],
			integration: new HttpLambdaIntegration('run-length-encoder-integration', runLengthEncoderFn),
		});
	}
}

const calculateHash = (() => {
	const hashDir = (path: string): Hash =>
		readdirSync(path).reduce(
			(hash, file) => {
				const filePath = join(path, file);
				const fileStats = statSync(filePath);
				const nextPart: string | Buffer | null =
					fileStats.isFile() ? md5Sync(filePath) :
						fileStats.isDirectory() ? hashDir(filePath).digest() :
							null;
				return nextPart ? hash.update(nextPart) : hash;
			},
			createHash('md5')
		);

	return (basePath: string) => hashDir(basePath).digest('hex');
})();
