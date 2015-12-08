# craft-ai-client-js #

[**craft ai**](http://craft.ai) API isomorphic javascript client, **craft ai**
is an AI engine providing a visual editor and simple APIs to easily add
contextual and personalized automation in mobile, web and IoT apps.

[![Version](https://img.shields.io/npm/v/craft-ai.svg?style=flat-square)](https://npmjs.org/package/craft-ai) [![Build](https://img.shields.io/travis/craft-ai/craft-ai-client-js/master.svg?style=flat-square)](https://travis-ci.org/craft-ai/craft-ai-client-js) [![License](https://img.shields.io/badge/license-BSD--3--Clause-42358A.svg?style=flat-square)](LICENSE)

# Setup #

To setup your project, follow these following steps, you'll end up with
`craftai`, refer to the [API reference](#API), below to learn how to use it.

## Browser ##

### Using [Browserify](http://browserify.org) or [Webpack](http://webpack.github.io) ###

```sh
npm install craft-ai --save
```

```js
var craftai = require('craft-ai');
```

or using es2015 syntax

```js
import craftai from 'craft-ai';
```

## Node.js ##

```sh
npm install craft-ai --save
```

```js
var craftai = require('craft-ai');
```

or using es2015 syntax

```js
import craftai from 'craft-ai';
```

# API #

## 1. Create an instance ##

````js
craftai({
  owner: '<project_owner>',
  name: '<project_name>',
  version: '<project_version>',
  appId: '<app_id>',
  appSecret: '<app_secret>',
  destroyOnExit: true/false
})
.then(function(instance) {
  // Use your instance here
  // instance = {
  //   "id": <instance_id>,
  //   "cfg": <instance_cfg>, // as provided to `craftai(...)`
  //   "getStatus": function() {...}, // Retrieve the current status of the instance
  //   ... // See below for other methods
  // }
})
.catch(function(error) {
  // Catch errors here
})
````

### `destroyOnExit` ###

If `true`, the instance will destroy itself when the window unloads or the
process exits.

- The **browser** version relies on the
[_beforeunload_](https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload)
event.
- The **nodejs** version relies on the
[_uncaughtException_](https://nodejs.org/api/process.html#process_event_uncaughtexception),
[_unhandledrejection_](https://nodejs.org/api/process.html#process_event_unhandledrejection),
[_SIGINT_, _SIGTERM_, _SIGQUIT_ and _SIGHUP_](https://nodejs.org/api/process.html#process_signal_events) events.

## 2. Register actions ##

> The current version of the client only supports actions registered using
WebSocket callbacks from the server.

````js
instance.registerAction(
  '<action_name>',
  (requestId, agentId, input, success, failure) => {
    // Implement what needs to be done here using:
    // - requestId, the unique identifier for this action request (ie this call),
    // - agentId, the identifier of the agent on which this reques is executed,
    // - input, a javascript object containing the action input provided in the Behavior Tree
    if (/* everything is good */) {
      success({
        output1: '<output1_value>',
        output2: '<output2_value>'
      })
    }
    else {
      failure({
        output1: '<output1_value>',
        output2: '<output2_value>'
      })
    }
  },
  (requestId, agentId, canceled) => {
    // This parameter is optional, it is the function called to cancel the action
    canceled();
  }
)
.then(function() {
  // Continue work on the instance here
})
.catch(function(error) {
  // Catch errors here
})
````

## 3. Agents ##

### Create ###

````js
instance.createAgent(
  '<bt_name>',
  <optional_initial_knowledge_content>)
.then(function(agent) {
  // Continue work on the instance here
  // agent = {
  //   "id": <agent_id>,
  //   "behavior": <bt_name>,
  //   "knowledge": <optional_initial_knowledge_content>
  // }
})
.catch(function(error) {
  // Catch errors here
})
````

### Destroy ###

_not available yet_

## 4. Update ##

### Single decision ###

````js
instance.update()
.then(function() {
  // Continue work on the instance here
})
.catch(function(error) {
  // Catch errors here
})
````

### Continuous regular decision ###

````js
instance.update(<decision_delta_time>)
````

## 5. Access Knowledge ##

### Retrieve the knowledge of an agent ###

````js
instance.getAgentKnowledge(<agent_id>)
.then(function(knowledge) {
  // Use retrieved knowledge
})
.catch(function(error) {
  // Catch errors here
})
````

#### Update the knowledge of an agent ####

````js
instance.updateAgentKnowledge(<agent_id>, {
  key1: '<key1_value>',
  key2: {
    key3: '<key3_value>'
  }
})
.then(function() {
  // Continue work on the instance here
})
.catch(function(error) {
  // Catch errors here
})
````

By default this method **sets** the knowledge to the new value, erasing the previous
one. If you want to merge the new knowledge value with the previous one you can
specify the optional third parameter with the value _merge_.

### Instance knowledge ###

In the same fashion, you can manipulate instance knowledge using
`instance.getInstanceKnowledge` and `instance.updateInstanceKnowledge`.

## 6. Destroy ##

````js
instance.destroy()
.then(function() {
  // Instance destroyed here (this also stops updates)
})
.catch(function(error) {
  // Catch errors here
})
````
