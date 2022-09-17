import axios from "axios";
import { getOctokit } from "@actions/github";
import { getToken } from "../input";
import { Artifact, Workflow } from "../types";

export const client = () => getOctokit(getToken() as string).rest;

// export const paginate = getOctokit(getToken()).paginate

export const fetchArtifacts = async (
    owner: string,
    repo: string
): Promise<Artifact[]> => {
    const response = await client().actions.listArtifactsForRepo({
        owner: owner,
        repo: repo,
        per_page: 100,
    });

    if (response.data.artifacts.length) {
        return response.data.artifacts;
    }

    return [];
};

export const fetchWorkflows = async (
    owner: string,
    repo: string
): Promise<Workflow[] | null> => {
    const response = await client().actions.listRepoWorkflows({
        owner,
        repo,
        per_page: 100,
    });

    if (response.data.workflows.length) {
        return response.data.workflows;
    }

    return null;
};

export const findWorkflowId = async (
    owner: string,
    repo: string,
    workflowName?: string
): Promise<number | undefined> => {
    if (!workflowName) {
        return undefined;
    }

    const workflows = await fetchWorkflows(owner, repo);

    if (!workflows?.length) {
        return undefined;
    }

    const workflow = workflows.find(
        (workflow) =>
            workflow.name === workflowName ||
            workflow.path.endsWith(workflowName) ||
            workflow.path.endsWith(`${workflowName}.yml`)
    );

    return workflow ? workflow.id : undefined;
};

export const fetchWorkflowRuns = async (
    owner: string,
    repo: string,
    workflowId: number
): Promise<number[]> => {
    const response = await client().actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: workflowId,
        per_page: 100,
    });

    return (response.data.workflow_runs || []).map((run) => run.id);
};

export const getDeploymentStatus = async (
    statusUrl: string
): Promise<number | string | void> => {
    const response = await axios.get(statusUrl, {
        headers: {
            Authorization: `token ${getToken()}`,
        },
    });

    return response.data.status;
};
