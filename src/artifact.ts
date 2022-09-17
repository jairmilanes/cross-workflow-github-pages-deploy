import { info } from "@actions/core";
import filesize from "filesize";
import { Artifact } from "./types";
import { fetchArtifacts, fetchWorkflowRuns, findWorkflowId } from "./api";
import {
    getArtifactName,
    getRepoName,
    getTargetBranch,
    getWorkflowName,
} from "./input";
import { messages } from "./utils/error-messages";

export const findArtifact = (artifacts: Artifact[], workflowIds: number[]) => {
    const branch = getTargetBranch();
    const workflowName = getWorkflowName();
    const artifactName = getArtifactName();

    return artifacts.find((artifact) => {
        if (
            workflowName &&
            workflowIds.indexOf(artifact.workflow_run?.id as number) < 0
        ) {
            return false;
        }

        if (branch && artifact.workflow_run?.head_branch !== branch) {
            return false;
        }

        return artifact.name === artifactName;
    });
};

export const findTargetArtifact = async (): Promise<Artifact | void> => {
    const [owner, repo] = (getRepoName() as string).split("/");
    const branch = getTargetBranch();
    const workflowName = getWorkflowName();
    const artifactName = getArtifactName();

    info(`==> Repository: ${owner}/${repo}`);
    info(`==> Artifact: ${artifactName}`);

    if (workflowName) {
        info(`==> Workflow: ${workflowName}`);
    }

    if (branch) {
        info(`==> Branch: ${branch}`);
    }

    // Resolve the provided workflowName to it's id
    const workflowId = await findWorkflowId(owner, repo, workflowName);

    if (workflowName && !workflowId) {
        throw new Error(messages.workflowNotFound.replace("%s", workflowName));
    }

    // Find the latest workflow runs
    const workflowsRuns = workflowId
        ? await fetchWorkflowRuns(owner, repo, workflowId as number)
        : [];

    if (workflowName && (!workflowsRuns || !workflowsRuns.length)) {
        throw new Error(
            messages.noWorkflowRunsFound.replace("%s", String(workflowName))
        );
    }

    // fetch the latest (100 max) artifacts
    const artifacts = await fetchArtifacts(owner, repo);

    info(`==> Found ${artifacts.length} artifacts, searching...`);

    // find the target artifact by name
    const artifact = findArtifact(artifacts, workflowsRuns);

    if (artifact) {
        const size = filesize(artifact.size_in_bytes, { base: 10 });

        info(`==> Artifact found: ${artifact.name}.zip (${size})`);

        return artifact;
    }
};