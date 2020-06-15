# [1.13.0-rc.12](https://github.com/schw4rzlicht/twitch2ma/compare/v1.13.0-rc.11...v1.13.0-rc.12) (2020-06-15)


### Bug Fixes

* Improve error handling ([58c40cf](https://github.com/schw4rzlicht/twitch2ma/commit/58c40cf469caae4f4ef2ec8f70774e08ec85df1e))

# [1.13.0-rc.11](https://github.com/schw4rzlicht/twitch2ma/compare/v1.13.0-rc.10...v1.13.0-rc.11) (2020-06-14)


### Bug Fixes

* Error reporting when config file was not found ([78fc048](https://github.com/schw4rzlicht/twitch2ma/commit/78fc0482d906da5b7338b11660500bc8eb54109f))

# [1.13.0-rc.10](https://github.com/schw4rzlicht/twitch2ma/compare/v1.13.0-rc.9...v1.13.0-rc.10) (2020-06-14)


### Bug Fixes

* Detect corrupt sACN ([675cbbc](https://github.com/schw4rzlicht/twitch2ma/commit/675cbbce4f68f9e2e20217b212ddc301de76a9bb))
* Resolve path to .env ([9d97959](https://github.com/schw4rzlicht/twitch2ma/commit/9d97959e3e80b3d6ed4dbf0e2084c9b4bf28be2c))

# [1.13.0-rc.9](https://github.com/schw4rzlicht/twitch2ma/compare/v1.13.0-rc.8...v1.13.0-rc.9) (2020-06-14)


### Bug Fixes

* Resolve sentry.json ([4f60c91](https://github.com/schw4rzlicht/twitch2ma/commit/4f60c91d273e1b4213810296ac32f82c4e641bb4))

# [1.13.0-rc.8](https://github.com/schw4rzlicht/twitch2ma/compare/v1.13.0-rc.7...v1.13.0-rc.8) (2020-06-14)


### Bug Fixes

* Timing out sACN according to E1.31 specs ([ffdaf65](https://github.com/schw4rzlicht/twitch2ma/commit/ffdaf65c5344c15f45dbdf73d6431d1ca5225953))


### Features

* Add sACN status ([c14bdba](https://github.com/schw4rzlicht/twitch2ma/commit/c14bdba21477dc6af2ca41a682bb333f3eb02ed6))

# [1.13.0-rc.7](https://github.com/schw4rzlicht/twitch2ma/compare/v1.13.0-rc.6...v1.13.0-rc.7) (2020-06-14)


### Bug Fixes

* Add default sACN object to config ([15970fb](https://github.com/schw4rzlicht/twitch2ma/commit/15970fbeee5ad6393af52bf35bf171b3d9912162))
* Filter exceptions ([7777311](https://github.com/schw4rzlicht/twitch2ma/commit/7777311d4d95811905ccd0db04b17f03ee841954))
* Null pointer when config.sacn is not used ([08b69f2](https://github.com/schw4rzlicht/twitch2ma/commit/08b69f2edce9fcb647e6ff46b5960a00a24c24ad))
* Null pointer when sACN was never received ([bc30dd9](https://github.com/schw4rzlicht/twitch2ma/commit/bc30dd99a54f88c64a49649cdaf4de2dd1a31ae7))
* Throw TelnetError where it occurs ([efb525a](https://github.com/schw4rzlicht/twitch2ma/commit/efb525ae23cb0f63886b9439ae2b4eac47b3da6c))

# [1.13.0-rc.6](https://github.com/schw4rzlicht/twitch2ma/compare/v1.13.0-rc.5...v1.13.0-rc.6) (2020-06-13)


### Bug Fixes

* Wrong function call in production ([cef76ca](https://github.com/schw4rzlicht/twitch2ma/commit/cef76caa7c62779957bdb83f2b2afdeefdb43bda))

# [1.13.0-rc.5](https://github.com/schw4rzlicht/twitch2ma/compare/v1.13.0-rc.4...v1.13.0-rc.5) (2020-06-13)


### Bug Fixes

* Add more error capturing ([5b576a6](https://github.com/schw4rzlicht/twitch2ma/commit/5b576a6c34710e4e981585e4c0349767041ff548))

# [1.13.0-rc.4](https://github.com/schw4rzlicht/twitch2ma/compare/v1.13.0-rc.3...v1.13.0-rc.4) (2020-06-12)


### Bug Fixes

* Add more help to errors ([d7c9103](https://github.com/schw4rzlicht/twitch2ma/commit/d7c9103f8408200bc6b703d5aeacd00ee3daa80b)), closes [#7](https://github.com/schw4rzlicht/twitch2ma/issues/7)
* Integration tests ([61194d8](https://github.com/schw4rzlicht/twitch2ma/commit/61194d83a81267cba1974b72dfddd0e0837354c4))

# [1.13.0-rc.3](https://github.com/schw4rzlicht/twitch2ma/compare/v1.13.0-rc.2...v1.13.0-rc.3) (2020-06-12)


### Bug Fixes

* Make sACN interface configurable ([48eafa0](https://github.com/schw4rzlicht/twitch2ma/commit/48eafa02644ba209901901ff70065da1db9de140))

# [1.13.0-rc.2](https://github.com/schw4rzlicht/twitch2ma/compare/v1.13.0-rc.1...v1.13.0-rc.2) (2020-06-11)


### Features

* Add sentry ([95ba4fe](https://github.com/schw4rzlicht/twitch2ma/commit/95ba4fe88867476d657c13bca3bf15caf64011a5))

# [1.13.0-rc.1](https://github.com/schw4rzlicht/twitch2ma/compare/v1.12.0...v1.13.0-rc.1) (2020-06-10)


### Bug Fixes

* Enable graceful shutdown ([24272bd](https://github.com/schw4rzlicht/twitch2ma/commit/24272bd573d25c232d7b245f854fd6f30bc6e247))
* Fix line numbers being wrong in index tests (see https://github.com/evanw/node-source-map-support/issues/279) ([56fd884](https://github.com/schw4rzlicht/twitch2ma/commit/56fd884de80b20ff87fab071604701685c8a36ec))
* Graceful closing connections ([9b2ceb7](https://github.com/schw4rzlicht/twitch2ma/commit/9b2ceb75ef02a6acd0279f659db1e250d13b6c42))
* Improve graceful shutdown ([626430d](https://github.com/schw4rzlicht/twitch2ma/commit/626430d16e8ec9eda9ce27aaa8f0a8a909ef47b0))


### Features

* Add command to log when permissions are denied ([40bdf94](https://github.com/schw4rzlicht/twitch2ma/commit/40bdf94b2742394993b91963729e4e9d6c8cb24e))
* Add sACN lock ([c3a08c5](https://github.com/schw4rzlicht/twitch2ma/commit/c3a08c544bcaa5b7d080fc8dcc6dc9a3b824422c)), closes [#2](https://github.com/schw4rzlicht/twitch2ma/issues/2)

# [1.12.0](https://github.com/schw4rzlicht/twitch2ma/compare/v1.11.0...v1.12.0) (2020-06-09)


### Features

* Use dashes in commands and parameters ([#6](https://github.com/schw4rzlicht/twitch2ma/issues/6)) ([a570c1d](https://github.com/schw4rzlicht/twitch2ma/commit/a570c1d2f2e4fdb7f2192b7a64f1cc0eca1de2b2))

# [1.11.0](https://github.com/schw4rzlicht/twitch2ma/compare/v1.10.0...v1.11.0) (2020-06-07)


### Features

* Add console logs for permissions ([3928982](https://github.com/schw4rzlicht/twitch2ma/commit/3928982b29ba20783c29f0e6b0b2e97e80366252))

# [1.10.0](https://github.com/schw4rzlicht/twitch2ma/compare/v1.9.0...v1.10.0) (2020-06-06)


### Features

* Add update notification ([23d57b5](https://github.com/schw4rzlicht/twitch2ma/commit/23d57b5a0dd4d72c4d3cc79df683e90efa8c07cd))

# [1.9.0](https://github.com/schw4rzlicht/twitch2ma/compare/v1.8.1...v1.9.0) (2020-06-05)


### Bug Fixes

* docs ([05fd88e](https://github.com/schw4rzlicht/twitch2ma/commit/05fd88e8e291bb5e1783144265b697ecdc43a189))


### Features

* Add YAML support ([0d1f9cd](https://github.com/schw4rzlicht/twitch2ma/commit/0d1f9cd6a0b90233a556138748cd3b9f11971ea3))

## [1.8.1](https://github.com/schw4rzlicht/twitch2ma/compare/v1.8.0...v1.8.1) (2020-06-05)


### Bug Fixes

* Automated releases ([574c37e](https://github.com/schw4rzlicht/twitch2ma/commit/574c37ed03ecc796d715088439ce0a7f81429c1e))
* Fix broken dependency ([d6fc66a](https://github.com/schw4rzlicht/twitch2ma/commit/d6fc66abaa3bcb1c4b061e1af63b5e5651c32c6e))

# [1.8.0](https://github.com/schw4rzlicht/twitch2ma/compare/v1.7.0...v1.8.0) (2020-06-05)


### Features

* Make config file argument optional ([919f9c1](https://github.com/schw4rzlicht/twitch2ma/commit/919f9c169c2ddd7debe402700367eaef87c11f68))
