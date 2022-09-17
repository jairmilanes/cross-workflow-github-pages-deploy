import axios from "jest-mock-axios";
import { error, info } from "@actions/core";
import { getErrorCount, getReportingInterval, getTimeout } from "./input";
import * as utils from "./utils";
import { messages } from "./utils/error-messages";
import { checkDeploymentStatus } from "./check";
import { envMock, mockEnv } from "./__mocks__/env.mock";
import { cancelDeployment } from "./cancel";

const { tick } = utils;

jest.mock("./input");
jest.mock("./cancel");
jest.mock("@actions/core");

const deployment = {
    status_url: "mock_status_url",
    page_url: "mock_page_url",
    preview_url: "mock_preview_url",
};

describe("Check Deployment Status", () => {
    beforeEach(() => {
        mockEnv({ ...envMock });
        jest.useFakeTimers({ legacyFakeTimers: true });
    });

    afterEach(() => {
        // jest.runOnlyPendingTimers()
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it("should exit if exceeds error count limit", async () => {
        jest.mocked(getErrorCount).mockReturnValue(5);
        jest.mocked(getTimeout).mockReturnValue(1000);
        jest.mocked(getReportingInterval).mockReturnValue(190);

        const sleepSpy = jest.spyOn(utils, "sleep");

        axios.get
            .mockResolvedValueOnce({ data: { status: "generic_error" } })
            .mockResolvedValueOnce({ data: { status: "generic_error" } })
            .mockResolvedValueOnce({ data: { status: "generic_error" } })
            .mockResolvedValueOnce({ data: { status: "generic_error" } })
            .mockResolvedValueOnce({ data: { status: "generic_error" } });

        axios.put.mockResolvedValueOnce({ data: { status: true } });

        try {
            const promise = checkDeploymentStatus(deployment);

            for (let i = 1; i <= 5; i++) {
                expect(sleepSpy).toHaveBeenCalledWith(190);

                sleepSpy.mockClear();
                jest.runOnlyPendingTimers();

                await tick();

                if (i < 5) {
                    expect(info).toHaveBeenCalledWith(
                        messages.currentStatus.replace("%s", "generic_error")
                    );
                }
            }

            await promise;
        } catch (e) {
            const error = e as Error;

            expect(error.message).toEqual(messages.tooManyErrors);
        }

        jest.mocked(info).mockClear();
        jest.mocked(error).mockClear();
    });

    it("should exit if exceeds timeout limit", async () => {
        jest.mocked(getErrorCount).mockReturnValue(5);
        jest.mocked(getTimeout).mockReturnValue(500);
        jest.mocked(getReportingInterval).mockReturnValue(190);

        const sleepSpy = jest.spyOn(utils, "sleep");

        axios.get.mockResolvedValueOnce({ data: { status: "generic_error" } });

        axios.put.mockResolvedValueOnce({ data: { status: true } });

        const nowMock = jest.spyOn(Date, "now");

        nowMock.mockReturnValueOnce(Date.now() - 500);

        try {
            const promise = checkDeploymentStatus(deployment);

            expect(sleepSpy).toHaveBeenCalledWith(190);
            sleepSpy.mockClear();
            jest.runOnlyPendingTimers();

            await tick();

            await promise;
        } catch (e) {
            const error = e as Error;

            expect(error.message).toEqual(messages.timeout);
        }
    });

    it("should exit is status = deployment_failed", async () => {
        jest.mocked(getErrorCount).mockReturnValue(5);
        jest.mocked(getTimeout).mockReturnValue(500);
        jest.mocked(getReportingInterval).mockReturnValue(190);

        const sleepSpy = jest.spyOn(utils, "sleep");

        axios.get.mockResolvedValueOnce({
            data: { status: "deployment_failed" },
        });

        axios.put.mockResolvedValueOnce({ data: { status: true } });

        try {
            const promise = checkDeploymentStatus(deployment);

            expect(sleepSpy).toHaveBeenCalledWith(190);
            sleepSpy.mockClear();
            jest.runOnlyPendingTimers();

            await tick();

            await promise;
        } catch (e) {
            const error = e as Error;

            expect(error.message).toEqual(messages.deploymentFailed);
        }
    });

    it("should exit is status = deployment_content_failed", async () => {
        jest.mocked(getErrorCount).mockReturnValue(5);
        jest.mocked(getTimeout).mockReturnValue(500);
        jest.mocked(getReportingInterval).mockReturnValue(190);

        const sleepSpy = jest.spyOn(utils, "sleep");

        axios.get.mockResolvedValueOnce({
            data: { status: "deployment_content_failed" },
        });

        axios.put.mockResolvedValueOnce({ data: { status: true } });

        try {
            const promise = checkDeploymentStatus(deployment);

            expect(sleepSpy).toHaveBeenCalledWith(190);
            sleepSpy.mockClear();
            jest.runOnlyPendingTimers();

            await tick();

            await promise;
        } catch (e) {
            const error = e as Error;

            expect(error.message).toEqual(messages.invalidArtifact);
        }
    });

    it("should exit is status = succeed", async () => {
        jest.mocked(getErrorCount).mockReturnValue(5);
        jest.mocked(getTimeout).mockReturnValue(500);
        jest.mocked(getReportingInterval).mockReturnValue(190);

        const sleepSpy = jest.spyOn(utils, "sleep");

        axios.get.mockResolvedValueOnce({ data: { status: "succeed" } });

        axios.put.mockResolvedValueOnce({ data: { status: true } });

        const promise = checkDeploymentStatus(deployment);

        expect(sleepSpy).toHaveBeenCalledWith(190);
        sleepSpy.mockClear();

        jest.runOnlyPendingTimers();

        await tick();

        expect(cancelDeployment).not.toHaveBeenCalled();

        await promise;
    });

    it("should exit if github api throws exception", async () => {
        jest.mocked(getErrorCount).mockReturnValue(5);
        jest.mocked(getTimeout).mockReturnValue(500);
        jest.mocked(getReportingInterval).mockReturnValue(190);

        const sleepSpy = jest.spyOn(utils, "sleep");

        axios.get.mockImplementation(() => {
            throw new Error("exception!");
        });

        try {
            const promise = checkDeploymentStatus(deployment);

            expect(sleepSpy).toHaveBeenCalledWith(190);
            sleepSpy.mockClear();

            jest.runAllTimers();

            await tick();

            for (let i = 1; i <= 3; i++) {
                jest.runAllTimers();

                await tick();
            }

            await promise;
        } catch (e) {
            const err = e as Error;

            expect(err.message).toEqual(messages.deploymentStatusFailed);
        }
    });
});
