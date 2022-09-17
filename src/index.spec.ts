import { spawn } from "node:child_process";
import { setOutput } from "@actions/core";
import * as artifacts from "./artifact";
import * as utils from "./utils";
import * as deploy from "./deploy";
import * as check from "./check";
import * as input from "./input";
import { Artifact, Deployment } from "./types";
import inputsMock from "./__mocks__/inputs.mock";
import { envMock, mockEnv } from "./__mocks__/env.mock";
import { messages } from "./utils/error-messages";

jest.mock("@actions/core");
jest.mock("@actions/github");
jest.mock("./artifact");
jest.mock("./utils");
jest.mock("./deploy");
jest.mock("./check");
jest.mock("./input");

const artifact: Artifact = {
    id: 123,
    node_id: "mock_node_id_1",
    name: "awesome-artifact",
    size_in_bytes: 12365544,
    url: "mock_url",
    archive_download_url: "mock_download_url",
    expired: false,
    created_at: Date.now().toString(),
    expires_at: Date.now().toString(),
    updated_at: Date.now().toString(),
    workflow_run: {
        id: 345,
        repository_id: 1234,
        head_repository_id: 1233456,
        head_branch: "master",
        head_sha: "mock_sha",
    },
};

const deployment: Deployment = {
    status_url: "mock_status_url",
    page_url: "mock_page_url",
    preview_url: "mock_preview_url",
};

mockEnv({ ...envMock });

describe("Index", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should execute", (done) => {
        const prs = spawn("npx", ["ts-node", "./index.ts"], {
            env: process.env,
            cwd: __dirname,
            shell: true,
        });

        let data = "";
        prs.stdout.on("data", function (chunk: Buffer) {
            data += chunk.toString();
        });

        prs.stderr.on("data", function (chunk: Buffer) {
            data += chunk.toString();
        });

        prs.on("close", () => {
            expect(data).toMatch("::set-output name=status::failed");
            expect(data).toMatch(
                "::set-output name=error_message::Missing required variables: artifact_name, github_token"
            );
            done();
        });
    });

    it("should gracefully handle signals", (done) => {
        const prs = spawn("npx", ["ts-node", "./index.ts"], {
            env: process.env,
            cwd: __dirname,
            shell: true,
        });

        prs.on("close", (code, signal) => {
            try {
                expect(code).toBeFalsy();
                expect(signal).toEqual("SIGTERM");
                done();
            } catch (e) {
                done(e);
            }
        });

        prs.kill();
    });

    it("should fail if missing vars", (done) => {
        jest.isolateModules(() => {
            const missingVars: string[] = ["artifact_name", "github_token"];
            jest.mocked(input.getMissingVars).mockReturnValueOnce(missingVars);

            return require("./index")
                .default.then(() => {
                    expect(setOutput).toHaveBeenCalledWith("status", "failed");

                    expect(utils.setExitMessage).toHaveBeenCalledWith(
                        inputsMock.on_error,
                        messages.missingVariables.replace(
                            "%s",
                            missingVars.join(", ")
                        )
                    );

                    done();
                })
                .catch((e: Error) => done(e));
        });
    });

    it("should fail if cant get a valid token", (done) => {
        jest.isolateModules(() => {
            // @ts-ignore
            jest.mocked(utils.getValidIdToken).mockReturnValueOnce();

            return require("./index")
                .default.then(() => {
                    expect(setOutput).toHaveBeenCalledWith("status", "failed");

                    expect(utils.setExitMessage).toHaveBeenCalledWith(
                        inputsMock.on_error,
                        messages.tokenNotWritable
                    );

                    done();
                })
                .catch((e: Error) => done(e));
        });
    });

    it("should FAIL if no artifact is found", (done) => {
        jest.isolateModules(() => {
            jest.mocked(artifacts.findTargetArtifact).mockResolvedValueOnce();

            require("./index")
                .default.then(() => {
                    expect(setOutput).toHaveBeenCalledWith("status", "failed");

                    expect(utils.setExitMessage).toHaveBeenCalledWith(
                        inputsMock.on_error,
                        messages.artifactNotFound.replace(
                            "%s",
                            input.getArtifactName()
                        )
                    );

                    done();
                })
                .catch((e: Error) => done(e));
        });
    });

    it("should fail if create deployment trows", (done) => {
        jest.isolateModules(() => {
            const error = "Mock deployment error";
            // @ts-ignore
            jest.mocked(artifacts.findTargetArtifact).mockResolvedValueOnce(
                artifact
            );
            jest.mocked(deploy.createDeployment).mockImplementationOnce(() => {
                throw new Error(error);
            });

            return require("./index")
                .default.then(() => {
                    expect(setOutput).toHaveBeenCalledWith("status", "failed");

                    expect(utils.setExitMessage).toHaveBeenCalledWith(
                        inputsMock.on_error,
                        error
                    );

                    done();
                })
                .catch((e: Error) => done(e));
        });
    });

    it("should fail if check deployment trows", (done) => {
        jest.isolateModules(() => {
            const error = "Mock check error";
            // @ts-ignore
            jest.mocked(artifacts.findTargetArtifact).mockResolvedValueOnce(
                artifact
            );
            jest.mocked(deploy.createDeployment).mockResolvedValueOnce(
                deployment
            );
            jest.mocked(check.checkDeploymentStatus).mockImplementationOnce(
                () => {
                    throw new Error(error);
                }
            );

            return require("./index")
                .default.then(() => {
                    expect(setOutput).toHaveBeenCalledWith("status", "failed");

                    expect(utils.setExitMessage).toHaveBeenCalledWith(
                        inputsMock.on_error,
                        error
                    );

                    done();
                })
                .catch((e: Error) => done(e));
        });
    });

    it("should create a deployment when an artifact is found", (done) => {
        jest.isolateModules(() => {
            jest.mocked(artifacts.findTargetArtifact).mockResolvedValueOnce(
                artifact
            );
            jest.mocked(deploy.createDeployment).mockResolvedValueOnce(
                deployment
            );

            utils
                .getValidIdToken()
                .then((token) => {
                    return require("./index").default.then(() => token);
                })
                .then((token) => {
                    expect(artifacts.findTargetArtifact).toHaveBeenCalled();
                    expect(deploy.createDeployment).toHaveBeenCalledWith(
                        artifact,
                        token
                    );
                    expect(check.checkDeploymentStatus).toHaveBeenCalledWith(
                        deployment
                    );
                    expect(utils.setExitMessage).not.toHaveBeenCalled();

                    done();
                })
                .catch((e: Error) => done(e));
        });
    });
});
