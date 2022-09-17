import inputsMock from "../../__mocks__/inputs.mock";

export const getMissingVars = jest.fn().mockReturnValue([]);

export const getArtifactName = jest
    .fn()
    .mockReturnValue(inputsMock.artifact_name);

export const getErrorTreatment = jest.fn().mockReturnValue(inputsMock.on_error);

export const getErrorCount = jest.fn();

export const getTimeout = jest.fn();

export const getReportingInterval = jest.fn();

export const getDeployStatusUrl = jest.fn();

export const getToken = jest.fn().mockReturnValue(inputsMock.token);
