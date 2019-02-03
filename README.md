[![codecov](https://codecov.io/gh/jack-and-the-beans/buddies-backend/branch/master/graph/badge.svg)](https://codecov.io/gh/jack-and-the-beans/buddies-backend) 
[![Build Status](https://travis-ci.org/jack-and-the-beans/buddies-backend.svg?branch=master)](https://travis-ci.org/jack-and-the-beans/buddies-backend)

# Functions

### Testing
* We use the `beans-buddies-dev` Firebase project.  You need Google Service credentials in order to run the test.
    * We are source controlling `beans-buddies-dev.json.secret.enc` which is a secure, encrypted document with out keys.
    * For development, obtain but do not track a local, plaintext version of this file.
    * If you change the secret keys used to encrypt, make sure you update the ENV variables in Travis CI
```
Create IV/Key:
openssl enc -aes-256-cbc -k secret -P -md sha1

Decrypt:
openssl aes-256-cbc -K $encryption_key -iv $encryption_iv -in beans-buddies-dev.json.secret.enc -out beans-buddies-dev.json.secret -d

Encrypt:
openssl aes-256-cbc -K $encryption_key -iv $encryption_iv -out beans-buddies-dev.json.secret.enc -in beans-buddies-dev.json.secret -e
```
* We use Mocha and can use Sinon for mocking.
* We use Travis CI to automatically run tests on PRs


### Algolia
We have our Algolia app ID and API key setup as environment variables in cloud functions. To update that configuration, run the following command from the terminal, replacing `xxx`, `yyy`, `zzz` with the correct values from the Algolia console.

```sh
firebase functions:config:set algolia.app_id="xxx" algolia.api_key="yyy" algolia.search_api_key="zzz"
```

For development, this command will make sure the environment variables are also available in the local environment: `npm run setup-env`. It is automatically run whenever doing `npm run shell` or `npm run serve`.

To develop, do the following:
```sh
npm i -g firebase-tools
firebase login # Will log you in through the browser

# You will need to do the following if your node version is not the same as the functions-emulator requirement:
npm i -g @google-cloud/functions-emulator --ignore-engines
```

Once those are installed, you can test locally:
```sh
# CD to the `functions` directory of this repo, then:
npm run shell
# You'll now be inside a functions shell, and you can call a function like so to test basic functionality:
sendActivityDataToAlgolia({ before: {foo: 'old'}, after: {foo: 'new'} })
```

To deploy the functions (and only the functions), make sure you are in the `functions` directory, then run `npm run deploy`.

# Admin Portal

To develop:
1. cd to `web-dev/`
2. `npm install`
3. Copy `init.js` (ask Jake or Noah for this) to (relative to the repo root) `web-output/__/firebase/init.js` (create folders if need be)
4. `npm start` then navigate to [http://localhost:8080/](http://localhost:8080/) and log in

To deploy the website:
1. cd to `web-dev/`
2. `npm run deploy`.
