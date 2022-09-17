import axios from "jest-mock-axios";
import { Artifact } from "./types";
import { createDeployment, createError } from "./deploy";
import { getRequestHeaders } from "./utils";
import { messages } from "./utils/error-messages";
import { getBuildVersion, getDeploymentUrl } from "./input";

jest.mock("@actions/core");
jest.mock("@actions/github");

const artifact: Artifact = {
    id: 123,
    node_id: "mock_node_id_1",
    name: "mock-artifact-1",
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

const deployment = {
    status_url: "mock_status_url",
    page_url: "mock_page_url",
    preview_url: "mock_preview_url",
};

describe("deploy", () => {
    it("should throw if no artifact url", async () => {
        try {
            await createDeployment(
                { ...artifact, url: null } as any,
                "mock_token"
            );
        } catch (e) {
            const error = e as Error;
            expect(error).toBeInstanceOf(Error);
            expect(error.message as string).toEqual(messages.noArtifactUrl);
        }
    });

    /* it('should create a new deployment', async () => {
        const response = {
            data: deployment
        }

        axios.post.mockResolvedValueOnce(response)

        const result = await createDeployment(artifact, 'mock_token')

        expect(result).toEqual(response.data)
    }) */

    it("should create a new deployment", async () => {
        const response = {
            data: deployment,
        };

        axios.post.mockResolvedValueOnce(response);

        const result = await createDeployment(artifact, "mock_token");

        expect(axios.post).toHaveBeenCalledWith(
            getDeploymentUrl(),
            {
                artifact_url: `${artifact.url}&%24expand=SignedContent`,
                pages_build_version: getBuildVersion(),
                oidc_token: "mock_token",
            },
            {
                headers: getRequestHeaders(),
            }
        );

        expect(result).toEqual(response.data);
    });

    it("should handle a 500 error", async () => {
        const response = {
            response: {
                status: 500,
            },
        };

        axios.post.mockRejectedValueOnce(response);

        try {
            await createDeployment(artifact, "mock_token");
        } catch (e) {
            const error = e as Error;
            expect(error.message).toEqual(
                createError(500, messages.deploy500).message
            );
        }
    });

    it("should handle a 404 error", async () => {
        const response = {
            response: {
                status: 404,
            },
        };

        axios.post.mockRejectedValueOnce(response);

        try {
            await createDeployment(artifact, "mock_token");
        } catch (e) {
            const error = e as Error;
            expect(error.message).toEqual(
                createError(404, messages.deploy404).message
            );
        }
    });

    it("should handle a 403 error", async () => {
        const response = {
            response: {
                status: 403,
            },
        };

        axios.post.mockRejectedValueOnce(response);

        try {
            await createDeployment(artifact, "mock_token");
        } catch (e) {
            const error = e as Error;
            expect(error.message).toEqual(
                createError(403, messages.deploy403).message
            );
        }
    });

    it("should handle a 400 error with string response", async () => {
        const response = {
            response: {
                status: 400,
                data: "400 Error message",
            },
        };

        axios.post.mockRejectedValueOnce(response);

        try {
            await createDeployment(artifact, "mock_token");
        } catch (e) {
            const error = e as Error;
            expect(error.message).toEqual(
                createError(400, messages.deployError).message.replace(
                    "%s",
                    "400 Error message"
                )
            );
        }
    });

    it("should handle a 400 error with Error response", async () => {
        const response = {
            response: {
                status: 400,
                data: new Error("400 Error message"),
            },
        };

        axios.post.mockRejectedValueOnce(response);

        try {
            await createDeployment(artifact, "mock_token");
        } catch (e) {
            const error = e as Error;
            expect(error.message).toEqual(
                createError(400, messages.deployError).message.replace(
                    "%s",
                    "400 Error message"
                )
            );
        }
    });

    it("should handle a Unknown error", async () => {
        const response = {
            response: {
                status: "Unknown",
            },
        };

        axios.post.mockRejectedValueOnce(response);

        try {
            await createDeployment(artifact, "mock_token");
        } catch (e) {
            const error = e as Error;
            expect(error.message).toEqual(createError("Unknown").message);
        }
    });

    it("should handle a error with no response object", async () => {
        const response = new Error();

        axios.post.mockRejectedValueOnce(response);

        try {
            await createDeployment(artifact, "mock_token");
        } catch (e) {
            const error = e as Error;
            expect(error).toEqual(response);
        }
    });
});
