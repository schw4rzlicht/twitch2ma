# twitch2ma [![Build Status](https://travis-ci.com/schw4rzlicht/twitch2ma.svg?branch=master)](https://travis-ci.com/schw4rzlicht/twitch2ma) [![npm](https://img.shields.io/npm/v/twitch2ma)](https://www.npmjs.com/package/twitch2ma) 

`twitch2ma` is a [Twitch](https://twitch.tv) chat bot that hooks into your channel and executes commands on a 
[GrandMA 2](https://www.malighting.com/grandma2/) console using telnet.

## Installation

To install `twitch2ma` you need to have at least [node.js](https://nodejs.org/en/) 14 installed. Run

```bash
npm install -g twitch2ma
```

## Usage
 
Before you can run `twitch2ma` you need a config file in JSON format. A sample file is 
[located in the root directory](https://github.com/schw4rzlicht/twitch2ma/blob/master/config.json.sample) of the 
repository and ships with the npm package.

After that, simply run

```bash
twitch2ma <pathToConfigFile.json>
```

## Contribution

If you have any issues, bugs, questions or want to contribute in any way, feel free to open an issue or a pull request. 
