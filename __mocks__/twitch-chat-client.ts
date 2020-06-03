import _ = require("lodash");

export default class TwitchChatClient {

    onPrivmsgHandler: Function;
    onRegisterHandler: Function;

    onPrivmsg = jest.fn(handler => this.onPrivmsgHandler = handler);
    onRegister = jest.fn(handler => this.onRegisterHandler = handler);
    join = jest.fn(TwitchChatClient.joinImplementation());
    quit = jest.fn().mockResolvedValue(null);

    connect = jest.fn(() => {
        if(_.isFunction(this.onRegisterHandler)) {
            this.onRegisterHandler();
        }
        return new Promise(resolve => resolve())
    });

    static forTwitchClient = jest.fn(() => new TwitchChatClient());

    // Utility
    static joinImplementation: Function = jest.fn(() => () => new Promise(resolve => resolve()));
}
