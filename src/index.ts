import { error, info, setOutput } from "@actions/core";
import * as artifacts from "./artifact";
import { createDeployment } from "./deploy";
import { checkDeploymentStatus } from "./check";
import { getArtifactName, getErrorTreatment, getMissingVars } from "./input";
import { getValidIdToken, setExitMessage } from "./utils";
import { messages } from "./utils/error-messages";
import { cancelDeployment } from "./cancel";

async function cancelHandler(evtOrExitCodeOrError: number | string) {
    await cancelDeployment();
    process.exit(isNaN(+evtOrExitCodeOrError) ? 1 : +evtOrExitCodeOrError);
}

const main = async (): Promise<void> => {
    try {
        // Check required vars
        const missingVars = getMissingVars();

        if (missingVars.length) {
            throw new Error(
                messages.missingVariables.replace("%s", missingVars.join(", "))
            );
        }

        const idToken = await getValidIdToken();

        if (!idToken) {
            throw new Error(messages.tokenNotWritable);
        }

        info(`OICD Token: ${ Buffer.from(idToken).toString('base64')}`)

        const artifactRawUrl = await artifacts.findTargetArtifact();

        if (!artifactRawUrl) {
            setOutput("artifact", false);

            throw new Error(
                messages.artifactNotFound.replace(
                    "%s",
                    getArtifactName() as string
                )
            );
        }

        const deployment = await createDeployment(artifactRawUrl, idToken);

        if (deployment) {
            setOutput("page_url", deployment.page_url);

            await checkDeploymentStatus(deployment);

            info(messages.statusSuccess);

            setOutput("status", "succeed");
        }
    } catch (e) {
        const err = e as Error;

        setOutput("status", "failed");

        error(JSON.stringify(err));

        setExitMessage(getErrorTreatment(), err.message);
    }
};

// Register signal handlers for workflow cancellation
process.on("SIGINT", cancelHandler);
process.on("SIGTERM", cancelHandler);

export default main();
