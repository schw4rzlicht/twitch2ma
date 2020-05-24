export default class Telnet {
    connect = jest.fn(() => new Promise(resolve => resolve()));
    exec = jest.fn(() => new Promise(resolve => resolve()));
}
