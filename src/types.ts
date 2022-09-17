import { components } from "@octokit/openapi-types";

export type SafeAny<T = object> =
    | {
          [k in keyof T]?: SafeAny<T[k]>;
      }
    | boolean
    | number
    | string
    | symbol
    | null
    | undefined;

export interface SafeObject {
    [key: string]: SafeAny;
}

export type Artifact = components["schemas"]["artifact"];

export type Workflow = components["schemas"]["workflow"];

export enum ErrorTreatment {
    Fail = "fail",
    Warn = "warn",
    Ignore = "ignore",
}

export interface Deployment {
    status_url: string;
    page_url: string;
    preview_url?: string;
}

export interface ResponseInfo {
    message: string;
}

export type ResponseData = ResponseInfo | string | undefined;

export interface DeploymentStatusParams {
    status: string | number | void;
    errorCount: number;
    startTime: number;
    timeout: number;
}

export interface Inputs {
    artifact_name: string;
    branch?: string;
    workflowName?: string;
    repo: string;
    name: string;
    timeout: string;
    token: string;
    reporting_interval: string;
    error_count: string;
    on_error: string;
}

export interface DeploymentCheckError {
    statusSuccess: string;
    invalidContext: string;
    missingVariables: string;
    tokenNotWritable: string;
    workflowRunsError: string;
    noWorkflowRunsFound: string;
    workflowError: string;
    noWorkflowsInRepo: string;
    workflowNotFound: string;
    deploymentFailed: string;
    deploymentStatusFailed: string;
    artifactNotFound: string;
    invalidArtifact: string;
    tooManyErrors: string;
    timeout: string;
    failedStatusCode: string;
    currentStatus: string;
    noArtifactUrl: string;
    deploy403: string;
    deploy404: string;
    deploy500: string;
    deployError: string;
}
