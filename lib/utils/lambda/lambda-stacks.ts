import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { App, Stack, Duration } from 'aws-cdk-lib';
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Vpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { Function, Runtime, Code, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { LayersStack } from '../layers/layers-stack';
import AppProps from '../../../interfaces/props';



export class StepFunctionStack extends Stack {
    public readonly CopyCommand:Function;
    public readonly Manifest:Function;
    constructor(scope: App, id: string, props: AppProps, layers: LayersStack){
        super(scope, id, props);
        const roleLambda = this.lambdaRole(props);

        const sfnArn = 'inserte SF arn aqui';


        const diffAthenaRedshift = this.CreatelambdaCheckDiff(props, roleLambda.roleArn);
        const redshiftCount = this.CreatelambdaDailyCount(props, roleLambda.roleArn, layers);
        const sendSns = this.CreatelambdaSendSNS(props, roleLambda.roleArn);
        const trigger = this.CreatelambdaTrigger(props, roleLambda.roleArn, sfnArn);
        const triggerEvent = this.CreatelambdaTriggerEmergencia(props, roleLambda.roleArn, sfnArn);



        //get VPC Info form AWS account, FYI we are not rebuilding we are referencing
        const DefaultVpc = Vpc.fromVpcAttributes(this, 'dev-vpc-athenas', {
            vpcId:'	vpc',
            availabilityZones: ['us-east-1a'],
            privateSubnetIds: ['subnet']
        });
    
        const securityGroup = SecurityGroup.fromSecurityGroupId(this, 'SG', 'sg', {
            mutable: false
        });
        
        
        if(props.stage == "prd"){
            var db = "prod"
        } else {
            var db = "dev"
        }

        const lambdaCopyName = "lambdaCopyCommand";

        this.CopyCommand = new Function(this, lambdaCopyName + 'Handler', {
            functionName: lambdaCopyName,
            runtime: Runtime.PYTHON_3_8,
            code: Code.fromAsset('microservice/lambda/copycommand'),
            handler: 'copycommand.lambda_handler',
            role: roleLambda,
            vpc: DefaultVpc,
            securityGroups: [securityGroup],
            layers: [layers.psycopg2],
            memorySize: 516,
            timeout: Duration.minutes(15),
            environment: {
                'REDSHIFT_SN': 'redshift',
                'REDSHIFT_DBNAME': db,
                'REDSHIFT_PORT': 'port',
                'REDSHIFT_USER': 'user',
                'REDSHIFT_PASS': 'pass',
                'REDSHIFT_HOST': 'host',
                'REDSHIFT_ROLE': 'role',
                "bucketAnalytics": `${props.bucket}`
            }
        });
    
        const lambdaManifestName = "lambdaCopyManifest";
        this.Manifest = new Function(this, lambdaManifestName + 'Handler', {
            functionName: lambdaManifestName,
            runtime: Runtime.PYTHON_3_8,
            code: Code.fromAsset('microservice/lambda/copymanifest'),
            handler: 'copymanifest.lambda_handler',
            role: roleLambda,
            vpc: DefaultVpc,
            securityGroups: [securityGroup],
            layers: [layers.psycopg2],
            memorySize: 516,
            timeout: Duration.minutes(15),
            environment: {
              'REDSHIFT_SN': 'redshift',
              'REDSHIFT_DBNAME': db,
              'REDSHIFT_PORT': 'port',
              'REDSHIFT_USER': 'user',
              'REDSHIFT_PASS': 'pass',
              'REDSHIFT_HOST': 'host',
              'REDSHIFT_ROLE': 'role',
              "bucketAnalytics": `${props.bucket}`
            }
        });
       
    };

    private lambdaRole(props:AppProps){
        const role = new iam.Role(this, `lambda-role-${props.stage}`, {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            roleName: `lambda-role-${props.stage}`,
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2FullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('AmazonSNSFullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole')]
        });
        role.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["lambda:InvokeFunction"],
            resources: ["*"]
        }));
        return role;
    };

    private CreatelambdaCheckDiff(props:AppProps,role:string){
        const roleLambda =  Role.fromRoleArn(this,`roleCheckDiff-${props.stage}`,role)
        const lambdaCheckDiff = new lambda.Function(this, `Lambda-Handler-CheckDiff-${props.stage}`, {
            functionName: `CheckDiffAthena-Redshift-${props.stage}`,
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset('microservice/lambda/diffAthenaRedshift'),
            handler: 'diffAthenaRedshift.lambda_handler',
            role: roleLambda,
            memorySize: 512,
            timeout: Duration.minutes(15),
            environment:{
                "stage": `${props.stage}`
            }
          });
        return lambdaCheckDiff;
    };

    private CreatelambdaDailyCount(props: any, role: string, layers: LayersStack) {
        const DefaultVpc = Vpc.fromVpcAttributes(this, 'dev-vpc-athenas', {
            vpcId: '	vpc',
            availabilityZones: ['us-east-1a'],
            privateSubnetIds: ['subnet']
        });

        const securityGroup = SecurityGroup.fromSecurityGroupId(this, 'SG', 'sg', {
            mutable: false
        });
        const roleLambda = Role.fromRoleArn(this, `role-redshift-count-${props.stage}`, role)
        const lambdaRedshiftCount = new lambda.Function(this, `Lambda-redshift-count-${props.stage}`, {
            functionName: `redshift-count-${props.stage}`,
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset('microservice/lambda/redshiftCount'),
            handler: 'redshiftCount.lambda_handler',
            role: roleLambda,
            memorySize: 512,
            vpc: DefaultVpc,
            securityGroups: [securityGroup],
            layers: [layers.psycopg2],
            timeout: Duration.minutes(3),
            environment: {
                'REDSHIFT_SN': 'redshift',
                'REDSHIFT_DBNAME': `${props.env}`,
                'REDSHIFT_PORT': 'port',
                'REDSHIFT_USER': 'user',
                'REDSHIFT_PASS': 'pass',
                'REDSHIFT_HOST': 'host',
                'REDSHIFT_ROLE': 'role',
            }
        });
        return lambdaRedshiftCount;
    };

    private CreatelambdaRedshiftSchema(props:AppProps,role:string,layers: LayersStack){
        const DefaultVpc = Vpc.fromVpcAttributes(this, 'dev-vpc-athenas', {
            vpcId:'	vpc-0c33bbb3bb70a814b',
            availabilityZones: ['us-east-1a'],
            privateSubnetIds: ['subnet-0abfb9aa15e86bf61']
          });
      
          const securityGroup = SecurityGroup.fromSecurityGroupId(this, 'SG', 'sg-0b2fa7989fc66fd28', {
            mutable: false
          });

        if(props.stage == "prd"){
            var db = "prod"
          } else {
            var db = "dev"
          }
        const roleLambda =  Role.fromRoleArn(this,`roleRedshiftSchema-${props.stage}`,role)
        const lambdaDemand = new lambda.Function(this, `Lambda-Handler-RedshiftSchema-${props.stage}`, {
            functionName: `lambdaRedshiftSchema-${props.stage}`,
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset('microservice/stepfunctions/sf-full/lambdaRedshiftSchema'),
            handler: 'lambdaRedshiftSchema.lambda_handler',
            role: roleLambda,
            memorySize: 128,
            vpc: DefaultVpc,
            securityGroups: [securityGroup],
            layers: [layers.psycopg2],
            timeout: cdk.Duration.minutes(15),
            environment: {
                'REDSHIFT_SN': 'cen-datalake-cluster-redshift',
                'REDSHIFT_DBNAME': db,
                'REDSHIFT_PORT': 'NTQzOQ==',
                'REDSHIFT_USER': 'YXdzdXNlcg==',
                'REDSHIFT_PASS': 'SHkqRG1MRjhIN2okOCU0Rg==',
                'REDSHIFT_HOST': 'Y2VuLWRhdGFsYWtlLWNsdXN0ZXIuY2p1cnJiZ2dnZWVuLnVzLWVhc3QtMS5yZWRzaGlmdC5hbWF6b25hd3MuY29t',
                'REDSHIFT_ROLE': 'YXJuOmF3czppYW06OjIzMzY2OTI4NjM4Mzpyb2xlL2Nlbi1jYWxpZGFkLXJlZHNoaWZ0LXJvbGU='
              }
          });
        return lambdaDemand.functionArn;
    };

    private CreatelambdaSendSNS(props: any, role: string) {
        const roleLambda = Role.fromRoleArn(this, `role-SendSNS-${props.stage}`, role)
        const lambdaSendSNS = new lambda.Function(this, `Lambda-SendSNS-Handler-${props.stage}`, {
            functionName: `lambdaSendSNS-${props.stage}`,
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset('microservice/lambda/sendSns'),
            handler: 'sendSns.lambda_handler',
            role: roleLambda,
            memorySize: 128,
            timeout: Duration.minutes(3),
            environment: {
                "TopicArn": props.snsTopic,
                "env": props.stage
            }
        });
        return lambdaSendSNS;
    };

    private CreatelambdaTriggerEmergencia(props:AppProps,role:string,sfnArn:string){
        const roleLambda =  Role.fromRoleArn(this,`roleTriggerEmergencia-Event-${props.stage}`,role)
        const lambdaTrigger = new lambda.Function(this, `Lambda-Handler-Trigger-Event-${props.stage}`, {
            functionName: `Trigger-SF-DELTA-CHECK-${props.stage}`,
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset('microservice/lambda/triggerStepFunctionByEventBridge'),
            handler: 'triggerStepFunctionByEventBridge.lambda_handler',
            role: roleLambda,
            memorySize: 128,
            timeout: Duration.minutes(3),
            environment:{
                "arnSfnDelta": `${sfnArn}`,
                "bucketAnalytics": `${props.bucket}`,
            }
          });
        return lambdaTrigger;
    };

    private CreatelambdaTrigger(props:AppProps,role:string,sfnArn:string){
        const roleLambda =  Role.fromRoleArn(this,`roleTriggerEmergencia-${props.stage}`,role)
        const lambdaTrigger = new lambda.Function(this, `Lambda-Handler-Trigger-${props.stage}`, {
            functionName: `Trigger-SF-DELTA-CHECK-${props.stage}`,
            runtime: lambda.Runtime.PYTHON_3_8,
            code: lambda.Code.fromAsset('microservice/lambda/triggerStepFunction'),
            handler: 'triggerStepFunction.lambda_handler',
            role: roleLambda,
            memorySize: 128,
            timeout: Duration.minutes(3),
            environment:{
                "arnSfnDelta": `${sfnArn}`,
                "bucketAnalytics": `${props.bucket}`,
            }
          });
        return lambdaTrigger;
    };

}