import { getInput, setFailed } from "@actions/core";
import { Artifact } from "./types";
import { findArtifact, findTargetArtifact } from "./artifact";
import * as input from "./input";
import { client } from "./api";
import { messages } from "./utils/error-messages";
import { getOctokitResponse } from "./__mocks__/@actions/github";
import inputsMock from "./__mocks__/inputs.mock";

jest.mock("@actions/core");
jest.mock("@actions/github");

const artifacts: Artifact[] = [
    {
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
    },
    {
        id: 1234,
        node_id: "mock_node_id_2",
        name: "mock-artifact-2",
        size_in_bytes: 123655443,
        url: "mock_url",
        archive_download_url: "mock_download_url",
        expired: false,
        created_at: Date.now().toString(),
        expires_at: Date.now().toString(),
        updated_at: Date.now().toString(),
        workflow_run: {
            id: 3454,
            repository_id: 1234,
            head_repository_id: 1233456,
            head_branch: "next",
            head_sha: "mock_sha_2",
        },
    },
    {
        id: 123456,
        node_id: "mock_node_id_3",
        name: "mock-artifact-3",
        size_in_bytes: 123655443,
        url: "mock_url",
        archive_download_url: "mock_download_url",
        expired: false,
        created_at: Date.now().toString(),
        expires_at: Date.now().toString(),
        updated_at: Date.now().toString(),
        workflow_run: {
            id: 34544,
            repository_id: 1234,
            head_repository_id: 1233456,
            head_branch: "test",
            head_sha: "mock_sha_3",
        },
    },
];

describe("Artifacts", () => {
    describe("findArtifact", () => {
        it("should find a valid artifact by name", () => {
            jest.mocked(getInput)
                .mockReturnValueOnce("")
                .mockReturnValueOnce("")
                .mockReturnValueOnce("mock-artifact-1");
            const artifact = findArtifact(artifacts, []);

            expect(artifact).toEqual(artifacts[0]);
        });

        it("should find a valid artifact by name & workflowName", () => {
            jest.mocked(getInput)
                .mockReturnValueOnce("")
                .mockReturnValueOnce("test")
                .mockReturnValueOnce("mock-artifact-2");
            const artifact = findArtifact(artifacts, [3454, 12563587]);

            expect(artifact).toEqual(artifacts[1]);
        });

        it("should find a valid artifact by name, workflowName & branch", () => {
            jest.mocked(getInput)
                .mockReturnValueOnce("test")
                .mockReturnValueOnce("test")
                .mockReturnValueOnce("mock-artifact-3");
            const artifact = findArtifact(artifacts, [34544, 12563587]);

            expect(artifact).toEqual(artifacts[2]);
        });

        it("should NOT find an artifact if name does not match", () => {
            jest.mocked(getInput)
                .mockReturnValueOnce("master")
                .mockReturnValueOnce("test")
                .mockReturnValueOnce("mock-artifact-10");
            const artifact = findArtifact(artifacts, [345, 12563587]);

            expect(artifact).toBeUndefined();
        });

        it("should NOT find an artifact if branch does not match", () => {
            jest.mocked(getInput)
                .mockReturnValueOnce("hello")
                .mockReturnValueOnce("test")
                .mockReturnValueOnce("mock-artifact-2");
            const artifact = findArtifact(artifacts, [3454, 12563587]);

            expect(artifact).toBeUndefined();
        });

        it("should NOT find an artifact if workflow does not match", () => {
            jest.mocked(getInput)
                .mockReturnValueOnce("")
                .mockReturnValueOnce("test")
                .mockReturnValueOnce("mock-artifact-3");
            const artifact = findArtifact(artifacts, [654987, 12563587]);

            expect(artifact).toBeUndefined();
        });
    });

    describe("findTargetArtifact", () => {
        afterEach(() => {
            jest.clearAllMocks();
            [
                input.getWorkflowName,
                input.getTargetBranch,
                input.getArtifactName,
            ].forEach((fn: any) => {
                if (jest.isMockFunction(fn)) {
                    jest.mocked(fn).mockRestore();
                }
            });
        });

        it("should fail if cant find workflow id", async () => {
            jest.mocked(
                client().actions.listRepoWorkflows
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 0,
                    workflows: [],
                })
            );

            try {
                await findTargetArtifact();
            } catch (e) {
                const error = e as Error;
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toEqual(
                    messages.workflowNotFound.replace(
                        "%s",
                        inputsMock?.workflowName as string
                    )
                );
            }
        });

        it("should fail if no workflow runs", async () => {
            jest.spyOn(input, "getWorkflowName").mockReturnValue("test");

            jest.mocked(
                client().actions.listRepoWorkflows
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 0,
                    workflows: [
                        {
                            id: 1,
                            name: "test",
                            path: `workflows/test.yml`,
                        },
                    ],
                })
            );

            jest.mocked(
                client().actions.listWorkflowRuns
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 0,
                    workflow_runs: [],
                })
            );

            try {
                await findTargetArtifact();
            } catch (e) {
                const error = e as Error;
                expect(error).toBeInstanceOf(Error);
                expect(error.message).toEqual(
                    messages.noWorkflowRunsFound.replace("%s", "test")
                );
            }
        });

        it("should fail if branch does not match", async () => {
            jest.spyOn(input, "getArtifactName").mockReturnValue(
                artifacts[2].name
            );
            jest.spyOn(input, "getWorkflowName").mockReturnValue("test");
            jest.spyOn(input, "getTargetBranch").mockReturnValue("not-found");

            jest.mocked(
                client().actions.listRepoWorkflows
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 0,
                    workflows: [
                        {
                            id: 1,
                            name: "test",
                            path: `workflows/test.yml`,
                        },
                    ],
                })
            );

            jest.mocked(
                client().actions.listWorkflowRuns
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 1,
                    workflow_runs: [
                        {
                            id: 34544,
                            workflow_id: 1,
                        },
                    ],
                })
            );

            jest.mocked(
                client().actions.listArtifactsForRepo
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 0,
                    artifacts: [...artifacts],
                })
            );

            const artifact = await findTargetArtifact();

            expect(artifact).toBeUndefined();
            expect(setFailed).not.toHaveBeenCalled();
        });

        it("should fail if artifact does not exist", async () => {
            jest.spyOn(input, "getArtifactName").mockReturnValue(
                artifacts[1].name
            );
            jest.spyOn(input, "getWorkflowName").mockReturnValue("test");
            jest.spyOn(input, "getTargetBranch").mockReturnValue(
                artifacts[1].workflow_run?.head_branch
            );

            jest.mocked(
                client().actions.listRepoWorkflows
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 0,
                    workflows: [
                        {
                            id: 1,
                            name: "test",
                            path: `workflows/test.yml`,
                        },
                    ],
                })
            );

            jest.mocked(
                client().actions.listWorkflowRuns
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 1,
                    workflow_runs: [
                        {
                            id: 3454,
                            workflow_id: 1,
                        },
                    ],
                })
            );

            jest.mocked(
                client().actions.listArtifactsForRepo
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 0,
                    artifacts: [],
                })
            );

            const artifact = await findTargetArtifact();

            expect(artifact).toBeUndefined();
            expect(setFailed).not.toHaveBeenCalled();
        });

        it("should find an artifact without workflow name", async () => {
            jest.spyOn(input, "getWorkflowName").mockReturnValue("");
            jest.spyOn(input, "getTargetBranch").mockReturnValue("");
            jest.spyOn(input, "getArtifactName").mockReturnValue(
                artifacts[1].name
            );

            jest.mocked(
                client().actions.listArtifactsForRepo
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 0,
                    artifacts: [...artifacts],
                })
            );

            const artifact = await findTargetArtifact();

            expect(artifact).toEqual(artifacts[1]);
            expect(setFailed).not.toHaveBeenCalled();
        });

        it("should find an artifact with workflow name", async () => {
            jest.spyOn(input, "getWorkflowName").mockReturnValue("test");
            jest.spyOn(input, "getTargetBranch").mockReturnValue("");
            jest.spyOn(input, "getArtifactName").mockReturnValue(
                artifacts[1].name
            );

            jest.mocked(
                client().actions.listRepoWorkflows
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 0,
                    workflows: [
                        {
                            id: 1,
                            name: "test",
                            path: "workflows/test.yml",
                        },
                    ],
                })
            );

            jest.mocked(
                client().actions.listWorkflowRuns
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 1,
                    workflow_runs: [
                        {
                            id: 3454,
                            workflow_id: 1,
                        },
                    ],
                })
            );

            jest.mocked(
                client().actions.listArtifactsForRepo
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 0,
                    artifacts: [...artifacts],
                })
            );

            const artifact = await findTargetArtifact();

            expect(artifact).toEqual(artifacts[1]);
            expect(setFailed).not.toHaveBeenCalled();
        });

        it("should find an artifact with workflow name & branch name", async () => {
            jest.spyOn(input, "getWorkflowName").mockReturnValue("test");
            jest.spyOn(input, "getTargetBranch").mockReturnValue("next");
            jest.spyOn(input, "getArtifactName").mockReturnValue(
                artifacts[1].name
            );

            jest.mocked(
                client().actions.listRepoWorkflows
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 0,
                    workflows: [
                        {
                            id: 1,
                            name: "test2",
                            path: "workflows/test.yml",
                        },
                    ],
                })
            );

            jest.mocked(
                client().actions.listWorkflowRuns
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 1,
                    workflow_runs: [
                        {
                            id: 3454,
                            workflow_id: 1,
                        },
                    ],
                })
            );

            jest.mocked(
                client().actions.listArtifactsForRepo
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 3,
                    artifacts: [...artifacts],
                })
            );

            const artifact = await findTargetArtifact();

            expect(artifact).toEqual(artifacts[1]);
            expect(setFailed).not.toHaveBeenCalled();
        });
    });
});
