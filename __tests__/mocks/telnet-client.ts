module.exports = () => {
    return jest.fn(() => {
        return {
            connect: jest.fn().mockResolvedValue(null),
            exec: jest.fn().mockResolvedValue("")
        };
    });
}
