import { ErrorTreatment } from "../types";
import { getIDToken, info, setFailed, setOutput, warning } from "@actions/core";
import { getToken } from "../input";

export const getValidIdToken = async (): Promise<string | undefined> => {
    try {
        return await getIDToken();
    } catch (error) {
        warning((error as Error).message);
    }
};

export const getRequestHeaders = () => ({
    Accept: "application/vnd.github.v3+json",
    Authorization: `Bearer ${getToken()}`,
    "Content-type": "application/json",
});

export const setExitMessage = (
    ifNoArtifactFound: ErrorTreatment,
    message: string
) => {
    switch (ifNoArtifactFound) {
        case ErrorTreatment.Fail:
            setFailed(message);
            break;
        case ErrorTreatment.Warn:
            warning(message);
            setOutput("error_message", message);
            break;
        case ErrorTreatment.Ignore:
        default:
            info(message);
            setOutput("error_message", message);
            break;
    }
};

export const tick = () => new Promise((r) => process.nextTick(r));

export const sleep = (interval: number) =>
    new Promise((r) => setTimeout(r, interval));

export const getErrorStatus = (status: string): string | undefined =>
    ({
        unknown_status: "Unable to get deployment status.",
        not_found: "Deployment not found.",
        deployment_attempt_error:
            "Deployment temporarily failed, a retry will be automatically scheduled...",
    }[status]);
