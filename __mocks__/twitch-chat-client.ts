export default class TwitchChatClient {

    static forTwitchClient = jest.fn(() => {
        return {
            connect: jest.fn(() => new Promise(resolve => resolve())),
            onRegister: jest.fn(),
            onPrivmsg: jest.fn()
        };
    });
}
