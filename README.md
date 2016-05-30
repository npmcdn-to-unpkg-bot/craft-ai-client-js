# **craft ai** javascript client #

[**craft ai**](http://craft.ai) API isomorphic javascript client.

[![Version](https://img.shields.io/npm/v/craft-ai.svg?style=flat-square)](https://npmjs.org/package/craft-ai) [![Build](https://img.shields.io/travis/craft-ai/craft-ai-client-js/master.svg?style=flat-square)](https://travis-ci.org/craft-ai/craft-ai-client-js) [![License](https://img.shields.io/badge/license-BSD--3--Clause-42358A.svg?style=flat-square)](LICENSE) [![Dependencies](https://img.shields.io/david/craft-ai/craft-ai-client-js.svg?style=flat-square)](https://david-dm.org/craft-ai/craft-ai-client-js) [![Dev Dependencies](https://img.shields.io/david/dev/craft-ai/craft-ai-client-js.svg?style=flat-square)](https://david-dm.org/craft-ai/craft-ai-client-js#info=devDependencies)

## About **craft ai** ##

**craft ai** is an _AI-as-a-service_ API enabling developers to create services,
apps & devices that adapt to each user in minutes.

The **craft ai JavaScript client** allows you to integrate your browser or
Node.js application with the **craft ai** engine in a matter of minutes.

> **craft ai** is currently in private beta, you can require an access at http://www.craft.ai

## Setup ##

Follow the following steps to install `craftai` in your JavaScript project. The
[API reference](#API) below will give you directions on how to use it.

```sh
npm install craft-ai --save
```

```js
var craftai = require('craft-ai').createClient;
```

or using es2015 syntax

```js
import craftai from 'craft-ai';
```

These instructions are compliant with a browser project (be it packaged with [Browserify](http://browserify.org) or [Webpack](http://webpack.github.io)) as well as with a Node.js project.

## API ##

### Client ###

````js
let client = craftai({
  owner: '<owner>',
  token: '<token>'
})
````

### Agent ###

#### Create ####

````js
client.createAgent(
  { // The model, cf. https://beta.craft.ai/doc
    context: {
      presence: {
        type: 'enum'
      },
      lightIntensity: {
        type: 'continuous'
      },
      lightbulbColor: {
        type: 'enum'
      }
    },
    output: [
      lightbulbColor
    ],
    time_quantum: 100
  },
  'aphasic_parrot', // Optionally, an id for the agent
  true, // `destroyOnExit`, default is false
)
.then(function(agent) {
  // Work on the agent here
  // agent = {
  //   "id": <agent_id>,
  //   "model": <model_id>
  // }
})
.catch(function(error) {
  // Catch errors here
})
````

##### `destroyOnExit` #####

If `true`, the agent will destroy itself when the window unloads or the
process exits.

- The **browser** version relies on the
[_beforeunload_](https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload)
event.
- The **nodejs** version relies on the
[_uncaughtException_](https://nodejs.org/api/process.html#process_event_uncaughtexception),
[_unhandledrejection_](https://nodejs.org/api/process.html#process_event_unhandledrejection),
[_SIGINT_, _SIGTERM_, _SIGQUIT_ and _SIGHUP_](https://nodejs.org/api/process.html#process_signal_events) events.

#### Destroy ####

````js
client.destroyAgent(
  'aphasic_parrot' // The agent id
)
.then(function() {
  // The agent was successfully destroyed
})
.catch(function() {
  // Catch errors here
})
````

### Context ###

#### Add operations ####

````js
instance.addAgentContextOperations(
  'aphasic_parrot', // The agent id
  [ // The list of operations
    {
      timestamp: 1464600000, // Operation timestamp, cf. https://beta.craft.ai/doc#header-timestamp
      diff: {
        presence: 'robert',
        lightIntensity: 0.4,
        lightbulbColor: 'green'
      }
    },
    {
      timestamp: 1464600500,
      diff: {
        presence: 'gisele',
        lightbulbColor: 'purple'
      }
    }
  ])
.then(function() {
  // The operations where successfully added
})
.catch(function(error) {
  // Catch errors here
})
````

#### List operations ####

````js
instance.getAgentContextOperations(
  'aphasic_parrot' // The agent id
)
.then(function(operations) {
  // Work on operations
})
.catch(function(error) {
  // Catch errors here
})
````

#### Retrieve context state ####

````js
instance.getAgentContext(
  'aphasic_parrot', // The agent id
  1464600256 // The timestamp at which the context state is retrieved
)
.then(function(context) {
  // Work on context
})
.catch(function(error) {
  // Catch errors here
})
````

### Decision ###

#### Take decision ####

````js
instance.computeAgentDecision(
  'aphasic_parrot', // The agent id
  1464600256, // The timestamp at which the decision is taken
  { // The context on which the decision is taken
    presence: 'gisele',
    lightIntensity: 0.75
  }
)
.then(function(decision) {
  // Work on the decision
})
.catch(function(error) {
  // Catch errors here
})
````

### Logging ###

The **craft ai** client is using
[visionmedia/debug](https://www.npmjs.com/package/debug) under the namespace
`'craft-ai:client:*'`, please refer to their documentation for further
information.
