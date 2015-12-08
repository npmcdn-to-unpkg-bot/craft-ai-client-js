# Developers instructions #

## Running the tests locally ##

1. Add _craft-ai/craft-ai-client-js_ (or your fork of it) to your **craft ai**
projects from the [workbench](https://workbench.craft.ai)
2. Retrieve your _appId/appSecret_ for this project from the [workbench](
https://workbench.craft.ai/workbench/craft-ai/craft-ai-client-js/master/craft_project.json)
3. On your dev machine, at the root of your clone, create a file named `.env` with the following content
````
CRAFT_APP_ID=<retrieved_appId>
CRAFT_APP_SECRET=<retrieved_appSecret>
````
4. run `npm install` and `npm run tests`

## Releasing a new version (needs administrator rights) ##

1. Make sure the build of the master branch is passing
[![Build](https://img.shields.io/travis/craft-ai/craft-ai-client-js/master.svg?style=flat-square)](https://travis-ci.org/craft-ai/craft-ai-client-js)
2. Checkout the master branch locally
````sh
git fetch
git checkout master
git reset --hard origin/master
````
3. Bump the version and push
````sh
npm version patch
git push origin master
git push --tags
````
