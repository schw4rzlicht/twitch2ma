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

Before you can run `twitch2ma` you need a config file in JSON or YAML format. Sample files are
located in the root directory ([JSON](config.json.sample) / [YAML](config.yml.sample))
of the repository and ship with the npm package.

Find a detailed description of every option [here](docs/config.md).

### Twitch authentication

As mentioned above, you need a `clientId` and an `accessToken` when connecting the bot to a channel. To obtain these, 
you will need to register an app on [dev.twitch.tv](https://dev.twitch.tv/console/apps). Just use any name you like for 
the app. `OAuth Redirect URLSs` don't matter either, just fill in anything. Category is `Chat Bot` of course. You can
get your `clientId` from the manage page now.

After you have done that, you will need an access token. Unfortunately, this is not done by `twitch2ma` yet, so you have
to get it manually with [this neat tool](https://twitchapps.com/tmi/). You will get an OAuth token like 
`oauth:9ouvuuiv3mwvdd3rx5obks823jdp20dj`. Remove the `oauth:` and that is your access token for the configuration file.

### Locking commands and parameters

`twitch2ma` can receive sACN to temporarily lock commands. This is done by the `sacn` configuration options. If configured,
`twitch2ma` listens to the respective universe/channel combination and locks configured commands and parameters when the
channel value drops below 100%. This allows for a more flexible way of allowing or denying viewers' input.

When sACN is configured for a channel or parameter, it overrides `timeout` settings for that channel or parameter.

Additionally a `lockMessage` can be configured which is sent to Twitch chat when viewers try to execute a locked command/parameters.

## Usage
 
To run `twitch2ma`, just run the following command. Please be aware that you need to have a desk or onPC in your 
network, reachable under the IP adress you configured. You also have to have telnet turned on.

```bash
twitch2ma [configFile]
```

`configFile` is optional and defaults to `config.json`.

### Advanced usage

There are more commands and options available when running `twitch2ma`. Please run `twitch2ma -h` for more help.

## Changelog

Find the changelog [here](docs/CHANGELOG.md) .

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://deltaeight.de"><img src="https://avatars1.githubusercontent.com/u/19175262?v=4" width="100px;" alt=""/><br /><sub><b>Julian Rabe</b></sub></a><br /><a href="#question-schw4rzlicht" title="Answering Questions">💬</a> <a href="https://github.com/schw4rzlicht/twitch2ma/commits?author=schw4rzlicht" title="Code">💻</a> <a href="https://github.com/schw4rzlicht/twitch2ma/commits?author=schw4rzlicht" title="Documentation">📖</a> <a href="#example-schw4rzlicht" title="Examples">💡</a> <a href="#ideas-schw4rzlicht" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-schw4rzlicht" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-schw4rzlicht" title="Maintenance">🚧</a> <a href="#platform-schw4rzlicht" title="Packaging/porting to new platform">📦</a> <a href="https://github.com/schw4rzlicht/twitch2ma/commits?author=schw4rzlicht" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/kevinmaslona-rgb"><img src="https://avatars2.githubusercontent.com/u/65712477?v=4" width="100px;" alt=""/><br /><sub><b>Kevin Maslona</b></sub></a><br /><a href="#ideas-kevinmaslona-rgb" title="Ideas, Planning, & Feedback">🤔</a> <a href="#userTesting-kevinmaslona-rgb" title="User Testing">📓</a></td>
    <td align="center"><a href="https://github.com/AlexWHughes"><img src="https://avatars0.githubusercontent.com/u/32295023?v=4" width="100px;" alt=""/><br /><sub><b>AlexWHughes</b></sub></a><br /><a href="https://github.com/schw4rzlicht/twitch2ma/issues?q=author%3AAlexWHughes" title="Bug reports">🐛</a> <a href="#ideas-AlexWHughes" title="Ideas, Planning, & Feedback">🤔</a> <a href="#userTesting-AlexWHughes" title="User Testing">📓</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
