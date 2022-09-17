import axios from "jest-mock-axios";
import {
    getDeploymentStatus,
    client,
    fetchArtifacts,
    fetchWorkflowRuns,
    fetchWorkflows,
    findWorkflowId,
} from "./index";
import { getDeployStatusUrl, getToken } from "../input";
import { envMock, mockEnv } from "../__mocks__/env.mock";
import { getOctokitResponse } from "../__mocks__/@actions/github";

jest.mock("@actions/core");

describe("Api", () => {
    beforeEach(() => {
        mockEnv({ ...envMock });
    });

    afterEach(() => {
        axios.reset();
    });

    describe("fetchArtifacts", () => {
        it("should return fetchArtifacts", async () => {
            const artifact = {
                test: 1,
            };

            jest.mocked(
                client().actions.listArtifactsForRepo
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 1,
                    artifacts: [artifact],
                })
            );

            const artifacts = await fetchArtifacts("owner", "repo");

            expect(artifacts?.length).toEqual(1);
            expect(artifacts?.[0]).toEqual(artifact);
        });
    });

    describe("fetchWorkflows", () => {
        it("should return workflows", async () => {
            const workflow = {
                test: 1,
            };

            jest.mocked(
                client().actions.listRepoWorkflows
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 1,
                    workflows: [workflow],
                })
            );

            const workflowRuns = await fetchWorkflows("owner", "repo");

            expect(client().actions.listRepoWorkflows).toHaveBeenCalledWith({
                owner: "owner",
                repo: "repo",
                per_page: 100,
            });
            expect(workflowRuns?.length).toEqual(1);
            expect(workflowRuns?.[0]).toEqual(workflow);
        });
    });

    describe("findWorkflowId", () => {
        it("should return workflow id", async () => {
            const workflows = [
                {
                    id: 1,
                    name: "test",
                    path: "workflows/test.yml",
                },
                {
                    id: 2,
                    name: "test-2",
                    path: "workflows/test-2.yml",
                },
            ];

            jest.mocked(
                client().actions.listRepoWorkflows
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 1,
                    workflows,
                })
            );

            const workflowId = await findWorkflowId("owner", "repo", "test");

            expect(workflowId).toEqual(1);
        });

        it("should return workflow id by path", async () => {
            const workflows = [
                {
                    id: 1,
                    name: "test-1",
                    path: "workflows/test.yml",
                },
                {
                    id: 2,
                    name: "test-2",
                    path: "workflows/test-2.yml",
                },
            ];

            jest.mocked(
                client().actions.listRepoWorkflows
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 1,
                    workflows,
                })
            );

            const workflowId = await findWorkflowId(
                "owner",
                "repo",
                "test.yml"
            );

            expect(workflowId).toEqual(1);
        });

        it("should return undefined if no workflowName", async () => {
            const workflow = {
                id: 1,
                name: "test",
                path: "workflows/test.yml",
            };

            jest.mocked(
                client().actions.listRepoWorkflows
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 1,
                    workflows: [workflow],
                })
            );

            const workflowId = await findWorkflowId("owner", "repo");

            expect(workflowId).toBeUndefined();
        });

        it("should return undefined if no workflows found", async () => {
            jest.mocked(
                client().actions.listRepoWorkflows
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 1,
                    workflows: [],
                })
            );

            const workflowId = await findWorkflowId("owner", "repo");

            expect(workflowId).toBeUndefined();
        });

        it("should return undefined if workflow is not found", async () => {
            const workflow = {
                id: 1,
                name: "test",
                path: "workflows/test.yml",
            };

            jest.mocked(
                client().actions.listRepoWorkflows
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 1,
                    workflows: [workflow],
                })
            );

            const workflowId = await findWorkflowId(
                "owner",
                "repo",
                "no-found"
            );

            expect(workflowId).toBeUndefined();
        });
    });

    describe("fetchWorkflowRuns", () => {
        it("should return workflow runs", async () => {
            const workflowRun = {
                id: 1,
                workflow_id: 2,
            };

            jest.mocked(
                client().actions.listWorkflowRuns
            ).mockResolvedValueOnce(
                getOctokitResponse(200, {
                    total_count: 1,
                    workflow_runs: [workflowRun],
                })
            );

            const workflowRuns = await fetchWorkflowRuns("owner", "repo", 123);

            expect(client().actions.listWorkflowRuns).toHaveBeenCalledWith({
                owner: "owner",
                repo: "repo",
                workflow_id: 123,
                per_page: 100,
            });
            expect(workflowRuns?.length).toEqual(1);
            expect(workflowRuns?.[0]).toEqual(workflowRun.id);
        });
    });

    describe("getDeploymentStatus", () => {
        it("should fetch the existing status", async () => {
            axios.get.mockResolvedValueOnce({ data: { status: "succeeded" } });

            const status = await getDeploymentStatus(getDeployStatusUrl());

            expect(axios.get).toHaveBeenCalledWith(getDeployStatusUrl(), {
                headers: {
                    Authorization: `token ${getToken()}`,
                },
            });

            expect(status).toEqual("succeeded");
        });
    });
});
