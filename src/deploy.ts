import { info } from "@actions/core";
import axios, { AxiosError } from "axios";
import { Deployment, ResponseData } from "./types";
import {
    getActionsId,
    getBuildActor,
    getBuildVersion,
    getDeploymentUrl,
} from "./input";
import { getRequestHeaders } from "./utils";
import { messages } from "./utils/error-messages";

export const createError = (
    status: number | string,
    suffix?: string
): Error => {
    return new Error(
        `Failed to create deployment (status: ${status}) with build version ${getBuildVersion()}. ${suffix}`
    );
};

export const throwCustomErrorMessage = (
    error: AxiosError<ResponseData>
): void => {
    // build customized err message based on server response
    if (error.response) {
        if (error.response.status == 400) {
            let message = "";
            if (
                typeof error.response.data !== "string" &&
                error.response.data?.message
            ) {
                message = error.response.data?.message;
            } else {
                message = error.response.data as string;
            }
            throw createError(
                error.response.status,
                messages.deployError.replace("%s", message)
            );
        } else if (error.response.status == 403) {
            throw createError(error.response.status, messages.deploy403);
        } else if (error.response.status == 404) {
            throw createError(error.response.status, messages.deploy404);
        } else if (error.response.status >= 500) {
            throw createError(error.response.status, messages.deploy500);
        } else {
            throw createError(error.response.status);
        }
    } else {
        throw error;
    }
};

export const createDeployment = async (
    artifactRawUrl: string,
    idToken: string
): Promise<Deployment | undefined> => {
    try {
        info(`Actor: ${getBuildActor()}`);
        info(`Action ID: ${getActionsId()}`);

        const payload = {
            artifact_url: artifactRawUrl,
            pages_build_version: getBuildVersion(),
            oidc_token: idToken,
        };

        info(
            `Creating deployment with payload:\n${JSON.stringify(
                payload,
                null,
                "\t"
            )}`
        );

        const response = await axios.post(getDeploymentUrl(), payload, {
            headers: getRequestHeaders(),
        });

        info(`Created deployment for ${getBuildVersion()}`);

        /* if (response && response.data) {
            info(JSON.stringify(response.data))
            return response.data
        }*/

        return response.data;
    } catch (error) {
        throwCustomErrorMessage(error as AxiosError<ResponseData>);
    }
};
