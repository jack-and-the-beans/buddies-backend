## Functions

### Algolia:
We have our Algolia app ID and API key setup as environment variables in cloud functions. To update that configuration, run the following command from the terminal, replacing `xxx`, `yyy`, `zzz` with the correct values from the Algolia console.

```sh
firebase functions:config:set algolia.app_id="xxx" algolia.api_key="yyy" algolia.search_api_key="zzz"
```

## Admin Portal

To develop:
1. cd to `web-dev/`
2. `npm install`
3. Copy `init.js` (ask Jake or Noah for this) to (relative to the repo root) `web-output/__/firebase/init.js` (create folders if need be)
4. `npm start` then navigate to [http://localhost:8080/](http://localhost:8080/) and log in

To deploy the website:
1. cd to `web-dev/`
2. `npm run deploy`.
