import * as core from '@actions/core'
import * as artifactApi from '@actions/artifact'
import * as os from 'os'
import { Artifact } from "./types";


export const pullArtifact = async (artifact: Artifact) => {
    const tempDir = os.tmpdir()
    const artifactClient = artifactApi.create()

    const filename = `${artifact.name}.zip`;

    // download a single artifact
    core.info(`Starting download for ${artifact.name}`)

    const downloadResponse = await artifactClient.downloadArtifact(
        filename,
        tempDir,
        { createArtifactFolder: false }
    )

    core.info(
        `Artifact ${downloadResponse.artifactName} was downloaded to ${downloadResponse.downloadPath}`
    )

    core.info(
        `Uploading artifact ${downloadResponse.artifactName} to current workflow run`
    )

    const uploadResponse = await artifactClient.uploadArtifact(
        artifact.name,
        [downloadResponse.downloadPath],
        tempDir
    )

    if (uploadResponse.failedItems.length === 0) {
        core.info(
            `Artifact ${downloadResponse.artifactName} uploaded successfully!`
        )

        return true
    }

    core.error(
        `Artifact ${downloadResponse.artifactName} upload failed!`
    )

    return false;
}
