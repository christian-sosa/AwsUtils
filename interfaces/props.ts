import { StackProps } from "aws-cdk-lib";

export default interface AppProps extends StackProps{
    stage: string;
    client: string;
    project: string;
    snsTopic: string;
    bucket: string;
}