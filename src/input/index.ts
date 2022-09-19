import { getInput } from "@actions/core";
import { ErrorTreatment } from "../types";

export const getTargetBranch = (): string | void => {
    const branch = getInput("branch");

    if (branch) {
        return branch.replace(/^refs\/heads\//, "");
    }
};

export const getTargetEvent = (): { event?: string } => {
    const event = getInput("event");

    return event ? { event } : {};
};

export const getArtifactName = (): string => getInput("artifact_name");

export const getRepoName = (): string =>
    (getInput("repo") || process.env.GITHUB_REPOSITORY) as string;

export const getWorkflowName = (): string => getInput("workflowName");

export const getToken = (): string => getInput("token");

export const getTimeout = (): number => Number(getInput("timeout"));

export const getReportingInterval = (): number =>
    Number(getInput("reporting_interval"));

export const getErrorCount = (): number => Number(getInput("error_count"));

export const getBuildVersion = (): string => process.env.GITHUB_SHA as string;

export const getRuntimeUrl = (): string =>
    process.env.ACTIONS_RUNTIME_URL as string;

export const getRuntimeToken = (): string =>
    process.env.ACTIONS_RUNTIME_TOKEN as string;

export const getBuildActor = (): string => process.env.GITHUB_ACTOR as string;

export const getActionsId = (): string => process.env.GITHUB_ACTION as string;

export const getGithubApiUrl = (): string =>
    process.env.GITHUB_API_URL ?? "https://api.github.com";

export const getDeploymentUrl = (): string =>
    `${getGithubApiUrl()}/repos/${getRepoName()}/pages/deployment`;

export const getDeployStatusUrl = (): string =>
    `${getGithubApiUrl()}/repos/${getRepoName()}/pages/deployment/status/${getBuildVersion()}`;

export const getDeployCancelUrl = (): string =>
    `${getGithubApiUrl()}/repos/${getRepoName()}/pages/deployment/cancel/${getBuildVersion()}`;

export const getArtifactUrl = (workflowRunId: number): string =>
    `${getRuntimeUrl()}_apis/pipelines/workflows/${workflowRunId}/artifacts?api-version=6.0-preview`;

export const getErrorTreatment = (): ErrorTreatment =>
    getInput("on_error") as ErrorTreatment;

export const getMissingVars = (): string[] => {
    const requiredVars: { [key: string]: string | undefined } = {
        artifact_name: getArtifactName() || undefined,
        runTime_url: getRuntimeUrl(),
        repository_name: getRepoName(),
        github_sha: getBuildVersion(),
        github_actor: getBuildActor(),
        github_action: getActionsId(),
        github_token: getToken() || undefined,
    };

    return Object.keys(requiredVars).filter(
        (key) => requiredVars[key as string] === undefined
    );
};
