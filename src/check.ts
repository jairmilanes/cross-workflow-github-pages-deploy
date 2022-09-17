import { info } from "@actions/core";
import { Deployment, DeploymentStatusParams } from "./types";
import { cancelDeployment } from "./cancel";
import { getErrorStatus, sleep } from "./utils";
import { messages } from "./utils/error-messages";
import {
    getDeployStatusUrl,
    getErrorCount,
    getReportingInterval,
    getTimeout,
} from "./input";
import { getDeploymentStatus } from "./api";

const deploymentSucceeded = ({ status }: DeploymentStatusParams): boolean => {
    return status === "succeed";
};

const deploymentFailed = ({
    status,
}: DeploymentStatusParams): boolean | string => {
    if (status === "deployment_check_failed") {
        // Fall into permanent error, it may be caused by ongoing incident or malicious deployment content or exhausted automatic retry times.
        return messages.deploymentStatusFailed;
    }

    if (status === "deployment_failed") {
        // Fall into permanent error, it may be caused by ongoing incident or malicious deployment content or exhausted automatic retry times.
        return messages.deploymentFailed;
    }
    return false;
};

const deploymentContentFailed = ({
    status,
}: DeploymentStatusParams): boolean | string => {
    if (status === "deployment_content_failed") {
        // The uploaded artifact is invalid.
        return messages.invalidArtifact;
    }
    return false;
};

const deploymentErrorCountReached = ({
    errorCount,
}: DeploymentStatusParams): boolean | string => {
    if (errorCount >= getErrorCount()) {
        return messages.tooManyErrors;
    }
    return false;
};

const deploymentTimeoutReached = ({
    startTime,
    timeout,
}: DeploymentStatusParams): boolean | string => {
    // Handle timeout
    if (Date.now() - startTime >= timeout) {
        return messages.timeout;
    }
    return false;
};

const deploymentStatus = ({ status }: DeploymentStatusParams): boolean => {
    // Handle timeout
    info(
        getErrorStatus(String(status)) ||
            messages.currentStatus.replace("%s", String(status))
    );
    return false;
};

const checkStatus = async (
    deployment: Deployment,
    retries = 1
): Promise<string | number | void> => {
    try {
        return await getDeploymentStatus(
            deployment.status_url || getDeployStatusUrl()
        );
    } catch (e) {
        // Retry up to 3 times if there is an error
        if (retries <= 3) {
            await sleep(500);
            return checkStatus(deployment, retries + 1);
        }

        return "deployment_check_failed";
    }
};

export const checkDeploymentStatus = async (deployment: Deployment) => {
    const timeout = getTimeout();
    const startTime = Date.now();

    let errorCount = 0;

    /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
    while (true) {
        // Handle reporting interval
        await sleep(getReportingInterval());

        const currentStatus = await checkStatus(deployment);

        errorCount +=
            currentStatus != 200 || !!getErrorStatus(String(currentStatus))
                ? 1
                : 0;

        const runStatus = [
            deploymentSucceeded,
            deploymentFailed,
            deploymentContentFailed,
            deploymentErrorCountReached,
            deploymentTimeoutReached,
            deploymentStatus,
        ].reduce((status: boolean | string, callback) => {
            if (status === false) {
                return callback({
                    status: currentStatus,
                    errorCount,
                    startTime,
                    timeout,
                });
            }

            return status;
        }, false);

        if (runStatus !== false) {
            // throw if an error was found
            if (typeof runStatus === "string") {
                await cancelDeployment();
                throw new Error(runStatus);
            }

            break;
        }
    }
};
