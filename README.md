# **craft ai** javascript client #

[**craft ai**](http://craft.ai) API isomorphic javascript client.

[![Version](https://img.shields.io/npm/v/craft-ai.svg?style=flat-square)](https://npmjs.org/package/craft-ai) [![Build](https://img.shields.io/travis/craft-ai/craft-ai-client-js/master.svg?style=flat-square)](https://travis-ci.org/craft-ai/craft-ai-client-js) [![License](https://img.shields.io/badge/license-BSD--3--Clause-42358A.svg?style=flat-square)](LICENSE) [![Dependencies](https://img.shields.io/david/craft-ai/craft-ai-client-js.svg?style=flat-square)](https://david-dm.org/craft-ai/craft-ai-client-js) [![Dev Dependencies](https://img.shields.io/david/dev/craft-ai/craft-ai-client-js.svg?style=flat-square)](https://david-dm.org/craft-ai/craft-ai-client-js#info=devDependencies)

**craft ai** enables developers to create applications and services that adapt to each individual user.

> :construction: **craft ai** is currently in private beta, you can request an access at https://beta.craft.ai/signup

## Get Started! ##

**craft ai** is based around the concept of **agents**. In most use cases, one agent is created per user or per device.

An agent has the **context** of its user or device's context, and learns which **decision** to take based on the evolution of this context in the form of a **decision tree**.

### Retrieve your `owner` and `token` ###

**craft ai** agents belong to **owners**, in the current version, each identified users defines a owner, in the future we will introduce shared organization-level owners.

On top of that, calls to **craft ai** are authenticated using personal **JWT tokens**.

> :information_source: To retrieve your **owner** and **token**, visit the 'Settings' tab in the **craft ai** control center at [`https://beta.craft.ai/settings`](https://beta.craft.ai/settings).

### Install ###

Let's first install the package from npm.

```sh
npm install craft-ai --save
```
Then import it in your code

```js
var craftai = require('craft-ai').createClient;
```

or using es2015 syntax

```js
import craftai from 'craft-ai';
```

_These instructions are compliant with a browser project (be it packaged with
[Browserify](http://browserify.org) or [Webpack](http://webpack.github.io)) as
well as with a Node.js project._

### Initialize ###

````js
let client = craftai({
  owner: '{owner}',
  token: '{token}',
  // Optional, default value is 500
  operationsChunksSize: {max_number_of_operations_sent_at_once},
  // Optional, default value is 60
  operationsAdditionWait: {time_in_seconds_waited_before_flushing_operations_cache}
})
````

### And then... ###

The basic setup is done, you need to integrate the following 4 operations in your app:

1. [Create an agent](#create),
2. When the context is updated, let the agent know by [adding context operations](#add-operations),
3. Regularly, compute the [decision tree](#compute) from the agent's context history,
4. Then use it to [take decisions](#take-decision).

That's it! :+1:

## API ##

### Timestamp ###

As you'll see in the reference, the **craft ai** API heavily relies on `timestamps`. A `timestamp` is an instant represented as a [Unix time](https://en.wikipedia.org/wiki/Unix_time), that is to say the amount of seconds elapsed since Thursday, 1 January 1970 at midnight UTC. In most programming languages this representation is easy to retrieve, you can refer to [**this page**](https://github.com/techgaun/unix-time/blob/master/README.md) to find out how. The **craft ai** API expects integer values for `timestamps`. If your `timestamps` do not use this representation correctly, your agent will not learn properly, especially if if relies on time.

In **craft ai**, `timestamps` are used to:
1. **order** the different states of the agents, i.e. a context update occurring at a `timestamp` of _14500000**10**_ takes place **before** an update occuring at _14500000**15**_;
2. **measure** how long an agent is in a given state, i.e. if its color becomes _blue_ at a `timestamp` of _14500000**10**_, _red_ at _14500000**20**_ and again _blue_ at _14500000**25**_, between _14500000**10**_ and _14500000**25**_ it has been _blue_ twice as long as _red_.

The agents model's `time_quantum` describes, in the same representation as `timestamps`, the minimum amount of time that is meaningful for an agent. Context updates occurring faster than this quantum won't be taken into account.

### Model ###

Each agent is based upon a model, the model defines:

- the context schema, i.e. the list of property keys and their type (as defined in the following section),
- the output properties, i.e. the list of property keys on which the agent takes decisions,

> :warning: In the current version, only one output property can be provided, and must be of type `enum`.

- the [`time_quantum`](#timestamp).

##### Context properties types ####

###### Base types: `enum` and `continuous` ######

`enum` and `continuous` are the two base **craft ai** types:

- `enum` properties can take any string values;
- `continuous` properties can take any real number value.

###### Time types: `timezone`, `time_of_day` and `day_of_week` ######

**craft ai** defines 3 types related to time:

- `time_of_day` properties can take any real number belonging to **[0.0; 24.0[**
representing the number of hours in the day since midnight (e.g. 13.5 means
13:30),
- `day_of_week` properties can take any integer belonging to **[0, 6]**, each
value represents a day of the week starting from Monday (0 is Monday, 6 is
Sunday).
- `timezone` properties can take string values representing the timezone as an
offset from UTC, the expected format is **±[hh]:[mm]** where `hh` represent the
hour and `mm` the minutes from UTC (eg. `+01:30`)), between `-12:00` and
`+14:00`.

> :information_source: By default, the values of `time_of_day` and `day_of_week`
> properties are > generated from the [`timestamp`](#timestamp) of an agent's
> state and the agent's current > `timezone`.
>
> If you wish to provide their value manually, add `is_generated: false` to the
> time types in your model. In this case, since you provide the values, you must
> update the context whenever one of these time values changes in a way that is
> significant for your system.

##### Examples #####

Let's take a look at the following model. It is designed to model the **color**
of a lightbulb (the `lightbulbColor` property, defined as an output) depending
on the **outside light intensity** (the `lightIntensity` property), the **time
of the day** (the `time` property) and the **day of the week** (the `day`
property).

`day` and `time` values will be generated automatically, hence the need for
`tz`, the current Time Zone, to compute their value from given
[`timestamps`](#timestamp).

The `time_quantum` is set to 100 seconds, which means that if the lightbulb
color is changed from red to blue then from blue to purple in less that 1
minutes and 40 seconds, only the change from red to purple will be taken into
account.

```json
{
  "context": {
      "lightIntensity":  {
        "type": "continuous"
      },
      "time": {
        "type": "time_of_day"
      },
      "day": {
        "type": "day_of_week"
      },
      "tz": {
        "type": "timezone"
      },
      "lightbulbColor": {
          "type": "enum"
      }
  },
  "output": ["lightbulbColor"],
  "time_quantum": 100
}
```

In this second examples, the `time` property is not generated, no property of
type `timezone` is therefore needed. However values of `time` must be manually
provided continuously.

```json
{
  "context": {
    "time": {
      "type": "time_of_day",
      "is_generated": false
    },
    "lightIntensity":  {
        "type": "continuous"
    },
    "lightbulbColor": {
        "type": "enum"
    }
  },
  "output": ["lightbulbColor"],
  "time_quantum": 100
}
```

### Agent ###

#### Create ####

Create a new agent, and create its [model](#model).

````js
client.createAgent(
  { // The model
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

If `true`, the agent will destroy itself when the window unloads or the process
exits.

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

#### Retrieve ####

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

By default, this method adds the given operations to a cache that is flushed at
least once every `cfg.operationsAdditionWait`.

````js
client.addAgentContextOperations(
  'aphasic_parrot', // The agent id
  [ // The list of operations
    {
      timestamp: 1464600000, // Operation timestamp
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
  ],
  false // Flush immediately the given operations, default is false
)
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

#### Retrieve state ####

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

### Decision tree ###

#### Compute ####

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

#### Take Decision ####

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

> This method retrieve the decision tree then apply it on the given context,
> To get a chance to store and reuse the decision tree, use `getAgentDecisionTree`
> and `decide` instead.

### Logging ###

The **craft ai** client is using
[visionmedia/debug](https://www.npmjs.com/package/debug) under the namespace
`'craft-ai:client:*'`, please refer to their documentation for further
information.
