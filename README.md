# twitch2ma [![Build Status](https://travis-ci.com/schw4rzlicht/twitch2ma.svg?branch=master)](https://travis-ci.com/schw4rzlicht/twitch2ma) [![npm](https://img.shields.io/npm/v/twitch2ma)](https://www.npmjs.com/package/twitch2ma) 

`twitch2ma` is a [Twitch](https://twitch.tv) chat bot that hooks into your channel and executes commands on a 
[GrandMA 2](https://www.malighting.com/grandma2/) console using telnet.

Viewers can run user-defined commands like `!red` in chat to trigger whatever action on the desk. Additionally, viewers
can always run `!ma` in chat to list all available commands.

## Installation

To install `twitch2ma` you need to have at least [node.js](https://nodejs.org/en/) 14 installed. Run

```bash
npm install -g twitch2ma
```

## Configuration

Before you can run `twitch2ma` you need a config file in JSON format. A sample file is 
[located in the root directory](https://github.com/schw4rzlicht/twitch2ma/blob/master/config.json.sample) of the 
repository and ships with the npm package.

### Options in detail

- `timeout`: The time in seconds between any command can be executed (prevents flooding/spamming). Does not apply to 
moderators and the channel owners.
- `ma`
  - `host`: The IP adress of your GrandMA 2 in you local network.
  - `user`/`password`: The GrandMA user and password that should run the commands on the desk. Not mandatory, defaults 
  to `administrator` and `admin` if not set.
- `twitch`
  - `clientId`: Your client ID obtained by Twitch
  - `accessToken`: Your access token obtained by Twitch
  - `channel`: The channel you want the bot to listen to
- `commands`: A definition of your commands. You can define as many commands as you want to. Commands always start with
`!`. So when `chatCommand` is `red` for example, viewers have to put `!red` into the chat to trigger it.
  - `chatCommand`: The command viewers need to use to trigger the action. Pleasae be aware that the command `ma` is
  reserved to display help for the viewers.
  - `consoleCommand`: The command that gets executed on the desk. Could be anything you could use in the command line of
  the desk.
  - `message`: A message that is sent to Twitch chat by the bot when the command was executed on the desk. `{user}` gets
  replaced by the user who issued the command in the chat. Not mandatory.
  - `help`: The message to be displayed when viewers run the command `!ma !chatCommand` so they know what the 
  corresponding command does. Not mandatory.

### Twitch authentication

As mentioned above, you need a `clientId` and an `accessToken` when connecting the bot to a channel. To obtain these, 
you will need to register an app on [dev.twitch.tv](https://dev.twitch.tv/console/apps). Just use any name you like for 
the app. `OAuth Redirect URLSs` don't matter either, just fill in anything. Category is `Chat Bot` of course. You can
get your `clientId` from the manage page now.

After you have done that, you will need an access token. Unfortunately, this is not done by `twitch2ma` yet, so you have
to get it manually with [this neat tool](https://twitchapps.com/tmi/). You will get an OAuth token like 
`oauth:9ouvuuiv3mwvdd3rx5obks823jdp20dj`. Remove the `oauth:` and that is your access token for the configuration file.

## Usage
 
To run `twitch2ma`, just run the following command. Please be aware that you need to have a desk or onPC in your 
network, reachable under the IP adress you configured. You also have to have telnet turned on.

```bash
twitch2ma <pathToConfigFile.json>
```

## Contribution

If you have any issues, bugs, questions or want to contribute in any way, feel free to open an issue or a pull request. 
