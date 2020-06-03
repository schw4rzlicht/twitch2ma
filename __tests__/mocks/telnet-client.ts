module.exports = () => {
    return jest.fn().mockImplementation(() => {
        return {
            connect: jest.fn(() => new Promise(resolve => resolve())),
            exec: jest.fn(() => new Promise(resolve => resolve("")))
        };
    });
}
