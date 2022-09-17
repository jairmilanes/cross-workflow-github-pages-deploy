import { DeploymentCheckError } from "../types";

export const messages: DeploymentCheckError = {
    statusSuccess: "Deployment completed successfully!",
    invalidContext: "Invalid context, please fix the following errors:",
    missingVariables: "Missing required variables: %s",
    tokenNotWritable: 'Ensure GITHUB_TOKEN has permission "idToken: write".',
    currentStatus: "Current status: %s",
    workflowRunsError: 'Error while fetching workflowRuns for workflow id "%s"',
    noWorkflowRunsFound: 'Could not find workflow runs for workflow "%s"',
    workflowError:
        'Error while attempting to find workflow "%s", make sure the workflow exists in the current repository.',
    noWorkflowsInRepo: "Current repository has no existing workflows",
    workflowNotFound:
        "Workflow %s could not be found in the current repository.",
    deploymentFailed: "Deployment failed, try again later.",
    deploymentStatusFailed:
        "Error while trying to check the deployment status.",
    artifactNotFound: 'Artifact named "%s" does not exist.',
    invalidArtifact:
        "Artifact could not be deployed. Please ensure the content does not contain any hard links, symlinks and total size is less than 10GB.",
    tooManyErrors: "Too many errors, aborting!",
    timeout: "Timeout reached, aborting!",
    failedStatusCode: "Failed with status code: %s",
    noArtifactUrl:
        "No uploaded artifact was found! Please check if there are any errors at build step, or uploaded artifact name is correct.",
    deploy403: `Ensure GITHUB_TOKEN has permission "pages: write".`,
    deploy404: `Ensure GitHub Pages has been enabled.`,
    deploy500: `Server err, is githubstatus.com reporting a Pages outage? Please re-run the deployment at a later time.`,
    deployError: `Responded with: %s`,
};
