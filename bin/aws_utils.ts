#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import Props from './props/app';
import { LayersStack } from '../lib/utils/layers/layers-stack';
import { lambdaStack } from '../lib/utils/lambda/lambda-stacks';

const app = new cdk.App();

const layers = new LayersStack(app, 'LayersStack', Props);
new lambdaStack(app, 'lambdaStack', Props, layers);


