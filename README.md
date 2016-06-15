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
  token: '<token>',
  operationsChunksSize: <max_number_of_operations_sent_at_once>, // Optional, default value is 500
  operationsAdditionWait: <time_in_seconds_waited_before_flushing_operations_cache> // Optional, default value is 60
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
  'aphasic_parrot', // id for the agent, if undefined a random id is generated
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
.catch(function(error) {
  // Catch errors here
})
````

#### Retrieve agent details ####

````js
client.getAgent(
  'aphasic_parrot' // The agent id
)
.then(function(agent) {
  // Agent details
})
.catch(function(error) {
  // Catch errors here
})
````

#### Retrieve the agent inspector URL ####

````js
client.getAgentInspectorUrl(
  'aphasic_parrot', // The agent id.
  1464600256 // optional, the timestamp for which you want to inspect the tree.
)
.then(function(url) {
  // Url to the agent's inspector
})
.catch(function(error) {
  // Catch errors here
})
````

### Context ###

#### Add operations ####

Use this method to add context operations to an agent. By default, it adds the
given operations to a cache that is flushed at least once every
`cfg.operationsAdditionWait`.

````js
client.addAgentContextOperations(
  'aphasic_parrot', // The agent id
  [ // The list of operations
    {
      timestamp: 1464600000, // Operation timestamp, cf. https://beta.craft.ai/doc#timestamp
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
    },
    false // Flush immediately the given operations, default is false
  ])
.then(function() {
  // The operations where successfully added to the cache
  // OR (if specified)
  // The operations where successfully added to agent context on the server side
})
.catch(function(error) {
  // Catch errors here
})
````

##### Error handling #####

When an addition is cached, subsequent method calls related to this agent will
force a flush before proceeding. For example:

````js
// Adding a first bunch of context operations
client.addAgentContextOperations('aphasic_parrot', [ /* ... */ ])
.then(function() {
  // Adding a second bunch of context operations
  client.addAgentContextOperations('aphasic_parrot', [ /* ... */ ])
})
.catch(function(error) {
  // You won't catch anything there
})
.then(function() {
  // The operations where successfully added to the cache, we don't know **yet**
  // if the additions actually failed or not
  return client.getAgentContext('aphasic_parrot', 1464600256);
})
.then(function(context) {
  // Work on context
})
.catch(function(error) {
  // Catch errors related to the previous calls to
  // `client.addAgentContextOperations` as well as `client.getAgentContext`
})
````

#### List operations ####

````js
client.getAgentContextOperations(
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
client.getAgentContext(
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

### Decision Tree ###

#### Retrieve decision tree ####

````js
import { decide, Time } from 'craft-ai';

client.getAgentDecisionTree(
  'aphasic_parrot', // The agent id
  1464600256 // The timestamp at which the decision tree is retrieved
)
.then(function(tree) {
  // Works with the given tree, e.g.
  let decision = decide(tree, {
    presence: 'gisele',
    lightIntensity: 0.75
  },
  new Time('2010-01-01T05:06:30'));
})
.catch(function(error) {
  // Catch errors here
})
````

### Decision ###

#### Take decision ####

````js
client.computeAgentDecision(
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
