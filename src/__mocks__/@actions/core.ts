import { jest } from "@jest/globals";
import inputMocks from "../../__mocks__/inputs.mock";
import {Inputs} from "../../types";

export const warning = jest.fn();

export const info = jest.fn();

export const error = jest.fn();

export const debug = jest.fn();

export const setOutput = jest.fn();

export const setFailed = jest.fn();

export const getInput = jest.fn((key: string) => inputMocks[key as keyof Inputs]);

export const getIDToken = jest.fn(() =>
    Promise.resolve(Buffer.from("test").toString("base64"))
);
