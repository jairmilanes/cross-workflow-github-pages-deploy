import { getIDToken, setFailed, setOutput, warning, info } from "@actions/core";
import {
    getValidIdToken,
    getErrorStatus,
    getRequestHeaders,
    setExitMessage,
    sleep,
} from "./index";
import * as input from "../input";
import { ErrorTreatment } from "../types";

jest.mock("@actions/core");

describe("Utils", () => {
    describe("getValidIdToken", () => {
        it("should handle exception on getIDToken", async () => {
            jest.mocked(getIDToken).mockRejectedValueOnce(
                new Error("Mock error")
            );
            expect(await getValidIdToken()).toBeUndefined();
        });

        it("should return an id token", async () => {
            expect(await getValidIdToken()).toEqual("dGVzdA==");
        });
    });

    describe("getRequestHeaders", () => {
        it("should return request headers object", () => {
            expect(getRequestHeaders()).toEqual({
                Accept: "application/vnd.github.v3+json",
                Authorization: `Bearer ${input.getToken()}`,
                "Content-type": "application/json",
            });
        });
    });

    describe("setExitMessage", () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        it("should set a failed message ifNoArtifactFound is fail", () => {
            setExitMessage(ErrorTreatment.Fail, "mock message 1");
            expect(setFailed).toHaveBeenCalledWith("mock message 1");
        });

        it("should log warning ifNoArtifactFound is warn", () => {
            setExitMessage(ErrorTreatment.Warn, "mock message 2");

            expect(warning).toHaveBeenCalledWith("mock message 2");
            expect(setOutput).toHaveBeenCalledWith(
                "error_message",
                "mock message 2"
            );
        });

        it("should log info ifNoArtifactFound is ignore", () => {
            setExitMessage(ErrorTreatment.Ignore, "mock message 3");

            expect(info).toHaveBeenCalledWith("mock message 3");
            expect(setOutput).toHaveBeenCalledWith(
                "error_message",
                "mock message 3"
            );
        });
    });

    describe("sleep", () => {
        beforeAll(() => {
            jest.useFakeTimers();
        });

        beforeEach(() => {
            jest.clearAllTimers();
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        it("should sleep for given time", () => {
            jest.spyOn(global, "setTimeout");
            const callback = jest.fn();

            const promise = sleep(2000)
                .then(() => callback())
                .then(() => {
                    expect(callback).toHaveBeenCalled();
                });

            expect(setTimeout).toHaveBeenCalled();
            expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);

            expect(callback).not.toHaveBeenCalled();

            jest.runAllTimers();
            jest.runAllTicks();

            return promise;
        });
    });

    describe("getErrorStatus", () => {
        it("should return unknown_status message", () => {
            expect(getErrorStatus("unknown_status")).toEqual(
                "Unable to get deployment status."
            );
        });

        it("should return not_found message", () => {
            expect(getErrorStatus("not_found")).toEqual(
                "Deployment not found."
            );
        });

        it("should return deployment_attempt_error message", () => {
            expect(getErrorStatus("deployment_attempt_error")).toEqual(
                "Deployment temporarily failed, a retry will be automatically scheduled..."
            );
        });

        it("should return undefined if status does nto exist", () => {
            expect(getErrorStatus("mock_status")).toBeUndefined();
        });
    });
});
