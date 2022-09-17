import axios, { AxiosError } from "axios";
import { info, setFailed } from "@actions/core";
import { ResponseInfo } from "./types";
import { getDeployCancelUrl } from "./input";
import { getRequestHeaders } from "./utils";

export const cancelDeployment = async (): Promise<void> => {
    try {
        await axios.put(
            getDeployCancelUrl(),
            {},
            { headers: getRequestHeaders() }
        );

        info(`Deployment cancelled with ${getDeployCancelUrl()}`);
    } catch (error) {
        const err = error as AxiosError<ResponseInfo>;

        setFailed(JSON.stringify(err.response));
    }
};
