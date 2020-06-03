module.exports = () => {
    return jest.fn(() => {
        return {
            connect: jest.fn(() => new Promise(resolve => resolve())),
            exec: jest.fn(() => new Promise(resolve => resolve("")))
        };
    });
}
