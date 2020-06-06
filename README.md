# twitch2ma [![Build Status](https://travis-ci.com/schw4rzlicht/twitch2ma.svg?branch=master)](https://travis-ci.com/schw4rzlicht/twitch2ma) [![npm](https://img.shields.io/npm/v/twitch2ma)](https://www.npmjs.com/package/twitch2ma) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

`twitch2ma` is a [Twitch](https://twitch.tv) chat bot that hooks into your channel and executes commands on a 
[GrandMA 2](https://www.malighting.com/grandma2/) console using telnet.

Viewers can run user-defined commands like `!red` in chat to trigger whatever action on the desk. Additionally, viewers
can always run `!lights` in chat to list all available commands.

## Installation

To install `twitch2ma` you need to have at least [node.js](https://nodejs.org/en/) 14 installed. Run

```bash
npm install -g twitch2ma
```

## Configuration

Before you can run `twitch2ma` you need a config file in JSON or YAML format. A sample files are
located in the root directory ([JSON](config.json.sample) / [YAML](config.yml.sample)])
of the repository and ships with the npm package.

Find a detailed description of every option [here](docs/config.md).

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
twitch2ma [configFile]
```

`configFile` is optional and defaults to `config.json`.

## Changelog

Find the changelog [here](docs/CHANGELOG.md) .

## Contribution

If you have any issues, bugs, questions or want to contribute in any way, feel free to open an issue or a pull request. 
