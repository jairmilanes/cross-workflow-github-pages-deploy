import { getInput } from "@actions/core";
import {
    getActionsId,
    getArtifactName,
    getBuildActor,
    getDeployCancelUrl,
    getDeploymentUrl,
    getDeployStatusUrl,
    getErrorCount,
    getGithubApiUrl,
    getMissingVars,
    getRepoName,
    getReportingInterval,
    getRuntimeUrl,
    getTargetBranch,
    getTargetEvent,
    getTimeout,
    getToken,
    getWorkflowName,
} from "./index";
import * as input from "./index";
import { envMock, mockEnv } from "../__mocks__/env.mock";
import inputsMock from "../__mocks__/inputs.mock";

jest.mock("@actions/core");

describe("Inputs", () => {
    beforeEach(() => {
        mockEnv({ ...envMock });
    });

    it("getTargetBranch", () => {
        (getInput as jest.Mock).mockReturnValueOnce("mockBranch");
        expect(getTargetBranch()).toEqual("mockBranch");
    });

    it("getTargetEvent", () => {
        (getInput as jest.Mock).mockReturnValueOnce("mockEvent");
        expect(getTargetEvent()).toEqual({ event: "mockEvent" });
    });

    it("getRepoName", () => {
        expect(getRepoName()).toEqual(inputsMock.repo);
    });

    it("getWorkflowName", () => {
        (getInput as jest.Mock).mockReturnValueOnce("mockWorkflowName");
        expect(getWorkflowName()).toEqual("mockWorkflowName");
    });

    it("getGithubApiUrl", () => {
        expect(getGithubApiUrl()).toEqual(envMock.GITHUB_API_URL);
    });

    it("getDeploymentUrl", () => {
        expect(getDeploymentUrl()).toEqual(
            `${envMock.GITHUB_API_URL}/repos/${inputsMock.repo}/pages/deployment`
        );
    });

    it("getDeployStatusUrl", () => {
        expect(getDeployStatusUrl()).toEqual(
            `${envMock.GITHUB_API_URL}/repos/${inputsMock.repo}/pages/deployment/status/${envMock.GITHUB_SHA}`
        );
    });

    it("getDeployCancelUrl", () => {
        expect(getDeployCancelUrl()).toEqual(
            `${envMock.GITHUB_API_URL}/repos/${inputsMock.repo}/pages/deployment/cancel/${envMock.GITHUB_SHA}`
        );
    });

    it("getRuntimeUrl", () => {
        expect(getRuntimeUrl()).toEqual(envMock.ACTIONS_RUNTIME_URL);
    });

    it("getBuildActor", () => {
        expect(getBuildActor()).toEqual(envMock.GITHUB_ACTOR);
    });

    it("getActionsId", () => {
        expect(getActionsId()).toEqual(envMock.GITHUB_ACTION);
    });

    it("getToken", () => {
        expect(getToken()).toEqual(inputsMock.token);
    });

    it("getArtifactName", () => {
        expect(getArtifactName()).toEqual(inputsMock.artifact_name);
    });

    it("getTimeout", () => {
        expect(getTimeout()).toEqual(Number(inputsMock.timeout));
    });

    it("getReportingInterval", () => {
        expect(getReportingInterval()).toEqual(
            Number(inputsMock.reporting_interval)
        );
    });

    it("getErrorCount", () => {
        expect(getErrorCount()).toEqual(Number(inputsMock.error_count));
    });

    it("getMissingVars", () => {
        // @ts-ignore
        jest.spyOn(input, "getRuntimeUrl").mockReturnValueOnce(undefined);
        expect(getMissingVars()).toEqual(["runTime_url"]);
        jest.restoreAllMocks();

        // @ts-ignore
        jest.spyOn(input, "getRepoName").mockReturnValueOnce(undefined);
        expect(getMissingVars()).toEqual(["repository_name"]);
        jest.restoreAllMocks();

        // @ts-ignore
        jest.spyOn(input, "getBuildVersion").mockReturnValueOnce(undefined);
        expect(getMissingVars()).toEqual(["github_sha"]);
        jest.restoreAllMocks();

        // @ts-ignore
        jest.spyOn(input, "getBuildActor").mockReturnValueOnce(undefined);
        expect(getMissingVars()).toEqual(["github_actor"]);
        jest.restoreAllMocks();

        // @ts-ignore
        jest.spyOn(input, "getActionsId").mockReturnValueOnce(undefined);
        expect(getMissingVars()).toEqual(["github_action"]);
        jest.restoreAllMocks();

        // @ts-ignore
        jest.spyOn(input, "getToken").mockReturnValueOnce(undefined);
        expect(getMissingVars()).toEqual(["github_token"]);
        jest.restoreAllMocks();

        // @ts-ignore
        jest.spyOn(input, "getArtifactName").mockReturnValueOnce(undefined);
        // @ts-ignore
        jest.spyOn(input, "getRuntimeUrl").mockReturnValueOnce(undefined);
        // @ts-ignore
        jest.spyOn(input, "getRepoName").mockReturnValueOnce(undefined);
        // @ts-ignore
        jest.spyOn(input, "getBuildVersion").mockReturnValueOnce(undefined);
        // @ts-ignore
        jest.spyOn(input, "getBuildActor").mockReturnValueOnce(undefined);
        // @ts-ignore
        jest.spyOn(input, "getActionsId").mockReturnValueOnce(undefined);
        // @ts-ignore
        jest.spyOn(input, "getToken").mockReturnValueOnce(undefined);

        expect(getMissingVars()).toEqual([
            "artifact_name",
            "runTime_url",
            "repository_name",
            "github_sha",
            "github_actor",
            "github_action",
            "github_token",
        ]);
        jest.restoreAllMocks();
    });
});
