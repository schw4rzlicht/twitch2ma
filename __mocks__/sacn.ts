export class Receiver {

    on = jest.fn();

    close = jest.fn((callback?: () => any) => {
        if(callback instanceof Function) {
            callback();
        }
    });
}
