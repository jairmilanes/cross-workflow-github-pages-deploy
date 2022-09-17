export const getValidIdToken = jest
    .fn()
    .mockImplementation(() => Promise.resolve("mock_id_token"));

export const setExitMessage = jest.fn();
