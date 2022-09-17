import { jest } from "@jest/globals";
import { OctokitResponse } from "@octokit/types";

export const getOctokitResponse = <S extends number>(
    status: S,
    data: any
): OctokitResponse<any, S> => ({
    status,
    headers: {},
    url: "",
    data: data,
});

export const getOctokit = jest.fn().mockReturnValue({
    paginate: jest.fn(),
    rest: {
        actions: {
            listWorkflowRuns: jest.fn(() => Promise.resolve()),
            listRepoWorkflows: jest.fn(() => Promise.resolve()),
            listArtifactsForRepo: jest.fn(() => Promise.resolve()),
        },
    },
});
