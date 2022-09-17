export const envMock = {
    GITHUB_REPOSITORY: "actions/is-awesome",
    GITHUB_API_URL: "https://api.github.com",
    ACTIONS_RUNTIME_URL: "mock-routing-url",
    GITHUB_ACTOR: "mockActor",
    GITHUB_SHA: "mockSha",
    GITHUB_ACTION: "mockAction",
    GITHUB_TOKEN: "gha-token",
    ACTIONS_RUNTIME_TOKEN: "mockRuntimeToken",
};

export const mockEnv = (envVars: { [key: string]: string | undefined }) =>
    Object.keys(envVars).forEach((key) => (process.env[key] = envVars[key]));
