import { info } from "@actions/core";
import filesize from "filesize";
import { Artifact } from "./types";
import { fetchArtifacts, fetchWorkflowRuns, findWorkflowId } from "./api";
import {
    getArtifactName,
    getArtifactUrl,
    getRepoName, getRuntimeId, getRuntimeToken,
    getTargetBranch, getToken,
    getWorkflowName
} from "./input";
import { messages } from "./utils/error-messages";
import axios from "axios";
import { pullArtifact } from "./pull-artifact";

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

        info(`--- Checking artifact -> ${artifact.name} === ${artifactName}`)
        return artifact.name === artifactName;
    });
};

const getUnsignedDownloadUrl = async (artifact: Artifact): Promise<string|undefined> => {
    if (!artifact.workflow_run) return undefined;

    const workflowArtifactsUrl = getArtifactUrl(getRuntimeId())

    info(`===> Requesting workflow artifacts to swap download URL from: ${workflowArtifactsUrl} using Github Token`)

    const { data } = await axios.get(
        workflowArtifactsUrl,
        {
            headers: {
                Authorization: `Bearer ${getRuntimeToken()}`,
                'Content-Type': 'application/json'
            }
        }
    )

    const { url } = data?.value?.find((art: Artifact) => art.name === artifact.name)

    return `${url}?%24expand=SignedContent`
}

export const findTargetArtifact = async (): Promise<string | void> => {
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

        await pullArtifact(artifact);

        const artifactRawUrl = await getUnsignedDownloadUrl(artifact);

        if (!artifactRawUrl) {
            throw new Error(messages.noArtifactUrl);
        }

        info(`==> Artifact found: ${artifact.name}.zip (${size})`);

        return artifactRawUrl
    }
};
