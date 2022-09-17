import * as actions from "@actions/core";
import mockAxios from "jest-mock-axios";
import { cancelDeployment } from "./cancel";
import { getDeployCancelUrl } from "./input";
import { getRequestHeaders } from "./utils";

jest.mock("@actions/core");

describe("Cancel Deployment", () => {
    afterEach(() => {
        mockAxios.reset();
    });

    it("should cancel deployment", async () => {
        jest.mocked(mockAxios.put).mockResolvedValue({});

        await cancelDeployment();

        expect(mockAxios.put).toHaveBeenCalled();
        expect(mockAxios.put).toHaveBeenCalledWith(
            getDeployCancelUrl(),
            {},
            { headers: getRequestHeaders() }
        );
        expect(actions.info).toHaveBeenCalledWith(
            `Deployment cancelled with ${getDeployCancelUrl()}`
        );
    });

    it("should set failed on exception", async () => {
        const error = {
            message: "error message",
            response: {
                data: "Mock error data",
            },
        };

        mockAxios.put.mockRejectedValueOnce(error);

        await cancelDeployment();

        expect(actions.setFailed).toHaveBeenCalledWith(JSON.stringify(error.response));
    });
});
