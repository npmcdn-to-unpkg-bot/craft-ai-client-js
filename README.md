# **craft ai** isomorphic javascript client #

[![Version](https://img.shields.io/npm/v/craft-ai.svg?style=flat-square)](https://npmjs.org/package/craft-ai) [![Build](https://img.shields.io/travis/craft-ai/craft-ai-client-js/master.svg?style=flat-square)](https://travis-ci.org/craft-ai/craft-ai-client-js) [![License](https://img.shields.io/badge/license-BSD--3--Clause-42358A.svg?style=flat-square)](LICENSE) [![Dependencies](https://img.shields.io/david/craft-ai/craft-ai-client-js.svg?style=flat-square)](https://david-dm.org/craft-ai/craft-ai-client-js) [![Dev Dependencies](https://img.shields.io/david/dev/craft-ai/craft-ai-client-js.svg?style=flat-square)](https://david-dm.org/craft-ai/craft-ai-client-js#info=devDependencies)

[**craft ai** _AI-as-a-service_](http://craft.ai) enables developers to create Apps and Things that adapt to each user. To go beyond useless dashboards and spammy notifications, **craft ai** learns how users behave to automate recurring tasks, make personalized recommendations, or detect anomalies.

## Get Started! ##

### 0 - Signup ###

If you're reading this you are probably already registered with **craft ai**, if not, head to [`https://beta.craft.ai/signup`](https://beta.craft.ai/signup).

> :construction: **craft ai** is currently in private beta, as such we validate accounts, this step should be quick.

### 1 - Retrieve your credentials ###

Once your account is setup, you need to retrieve your **owner** and **token**. Both are available in the 'Settings' tab in the **craft ai** control center at [`https://beta.craft.ai/settings`](https://beta.craft.ai/settings).

### 2 - Setup ###

#### Install ####

##### [Node.js](https://nodejs.org/en/) / [Webpack](http://webpack.github.io) / [Browserify](http://browserify.org) #####

Let's first install the package from npm.

```sh
npm install craft-ai --save
```
Then import it in your code

```js
var craftai = require('craft-ai').createClient;
```

or using [es2015](https://babeljs.io/docs/learn-es2015/) syntax

```js
import craftai from 'craft-ai';
```

##### Plain Old Javascript #####

Thanks to [npmcdn](https://npmcdn.com), you can include the pre-generated bundle in your html file, for the latest version use

```html
<script type="text/javascript" src="https://npmcdn.com/craft-ai/dist/craft-ai.min.js"></script>
```

to include a specific version specify it in the url like

```html
<script type="text/javascript" src="https://npmcdn.com/craft-ai@0.1.13/dist/craft-ai.min.js"></script>
```

#### Initialize ####

```js
let client = craftai({
  owner: '{owner}',
  token: '{token}',
  // Optional, default value is 500
  operationsChunksSize: {max_number_of_operations_sent_at_once},
  // Optional, default value is 60
  operationsAdditionWait: {time_in_seconds_waited_before_flushing_operations_cache}
});
```

### 3 - Create an agent ###

**craft ai** is based around the concept of **agents**. In most use cases, one agent is created per user or per device.

An agent is an independent module that stores the history of the **context** of its user or device's context, and learns which **decision** to take based on the evolution of this context in the form of a **decision tree**.

In this example, we will create an agent that learns the **decision model** of a light bulb based on the time of the day and the number of people in the room. In practice, it means the agent's context have 4 properties:

- `peopleCount` which is a `continuous` property,
- `timeOfDay` which is a `time_of_day` property,
- `tz`, a property of type `timezone` needed to generate proper values for `timeOfDay` (cf. the [context properties type section](#context-properties-types) for further information),
- and finally `lightbulbState` which is an `enum` property that is also the output of this model.

```js
var AGENT_ID = 'my_first_agent';

client.createAgent(
  {
    context: {
      peopleCount: {
        type: 'continuous'
      },
      timeOfDay: {
        type: 'time_of_day'
      },
      tz: {
        type: 'timezone'
      },
      lightbulbState: {
        type: 'enum'
      }
    },
    output: [ 'lightbulbState' ]
  },
  AGENT_ID
)
.then(function(agent) {
  console.log('Agent ' + agent.id + ' successfully created!');
})
.catch(function(error) {
  console.err('Error!', error);
});
```

Pretty straightforward to test! Open [`https://beta.craft.ai/inspector`](https://beta.craft.ai/inspector), your agent is now listed.

Now, if you run that a second time, you'll get an error: the agent `'my_first_agent'` is already existing. Let's see how we can delete it before recreating it.

```js
var AGENT_ID = 'my_first_agent';

client.deleteAgent(AGENT_ID)
.then(function() {
  console.log('Agent ' + AGENT_ID + ' no longer exists.');
  return client.createAgent(/*...*/);
})
.then(function(agent) {
  console.log('Agent ' + agent.id + ' successfully created!');
})
.catch(function(error) {
  console.err('Error!', error);
});
```

_For further information, check the ['create agent' reference documentation](#create)._

### 4 - Add context operations ###

We have now created our first agent but it is not able to do much yet, to learn a decision model it needs to be provided with data, in **craft ai** these are called context operations.

In the following we add 8 operations:

1. The initial one sets the initial state of the agent, on July the 25th of 2016 at 5:30, in Paris, nobody is there and the light is off;
2. At 7:02, someone enters the room the light is turned on;
3. At 7:15, someone else enters the room;
4. At 7:31, the light is turned off;
5. At 8:12, everyone leave the room;
6. At 19:23, 2 people enters the room;
7. At 22:35, the light is turned on;
8. At 23:06, everyone leave the room and the light is turned off.

```js
var AGENT_ID = 'my_first_agent';

client.deleteAgent(AGENT_ID)
.then(function() {
  console.log('Agent ' + AGENT_ID + ' no longer exists.');
  return client.createAgent(/*...*/);
})
.then(function(agent) {
  console.log('Agent ' + agent.id + ' successfully created!');
  return client.addAgentContextOperations(
    AGENT_ID,
    [
      {
        timestamp: 1469410200,
        diff: {
          tz: '+02:00',
          peopleCount: 0,
          lightbulbState: 'OFF'
        }
      },
      {
        timestamp: 1469415720,
        diff: {
          peopleCount: 1,
          lightbulbState: 'ON'
        }
      },
      {
        timestamp: 1469416500,
        diff: {
          peopleCount: 2
        }
      },
      {
        timestamp: 1469417460,
        diff: {
          lightbulbState: 'OFF'
        }
      },
      {
        timestamp: 1469419920,
        diff: {
          peopleCount: 0
        }
      },
      {
        timestamp: 1469460180,
        diff: {
          peopleCount: 2
        }
      },
      {
        timestamp: 1469471700,
        diff: {
          lightbulbState: 'ON'
        }
      },
      {
        timestamp: 1469473560,
        diff: {
          peopleCount: 0
        }
      }
    ]
  );
})
.then(function(agent) {
  console.log('Successfully added initial operations to agent ' + agent.id + '.');
})
.catch(function(error) {
  console.err('Error!', error);
});
```

In real-world applications, you'll probably do the same kind of thing when the agent is created and then regularly throughout the lifetime of the agent with newer data.

_For further information, check the ['add context operations' reference documentation](#add-operations)._

### 5 - Compute the decision tree ###

The agent has acquire a context history, we can now compute a decision tree from it!

The decision tree is computed at a given timestamp, which means it will consider the context history from the creation of this agent up to this moment. Let's first try to compute the decision tree at midnight on July the 26th of 2016.

```js
var AGENT_ID = 'my_first_agent';

client.deleteAgent(AGENT_ID)
.then(function() {
  console.log('Agent ' + AGENT_ID + ' no longer exists.');
  return client.createAgent(/*...*/);
})
.then(function(agent) {
  console.log('Agent ' + agent.id + ' successfully created!');
  return client.addAgentContextOperations(AGENT_ID, /*...*/);
})
.then(function(agent) {
  console.log('Successfully added initial operations to agent ' + agent.id + '.');
  return client.getAgentDecisionTree(AGENT_ID, 1469476800);
})
.then(function(tree) {
  console.log('Decision tree retrieved!', tree);
})
.catch(function(error) {
  console.err('Error!', error);
});
```

Try to retrieve the tree at different timestamps to see how it gradually learns from the new operations. To visualize the trees, use the [inspector](https://beta.craft.ai/inspector)!

_For further information, check the ['compute decision tree' reference documentation](#compute)._

### 6 - Take a decision ###

Once the decision tree is computed it can be used to take a decision. In our case it is basically answering this type of question: "What is the anticipated **state of the lightbulb** at 7:15 if there is 2 persons in the room ?".

```js
var AGENT_ID = 'my_first_agent';

client.deleteAgent(AGENT_ID)
.then(function() {
  console.log('Agent ' + AGENT_ID + ' no longer exists.');
  return client.createAgent(/*...*/);
})
.then(function(agent) {
  console.log('Agent ' + agent.id + ' successfully created!');
  return client.addAgentContextOperations(AGENT_ID, /*...*/);
})
.then(function(agent) {
  console.log('Successfully added initial operations to agent ' + agent.id + '.');
  return client.getAgentDecisionTree(AGENT_ID, 1469476800);
})
.then(function(tree) {
  console.log('Decision tree retrieved!', tree);
  let res = craftai.decide(tree, {
    tz: '+02:00',
    timeOfDay: 7.25,
    peopleCount: 2
  });
  console.log('The anticipated lightbulb state is "' + res.decision.lightbulbState + '".');
})
.catch(function(error) {
  console.err('Error!', error);
});
```

_For further information, check the ['take decision' reference documentation](#take-decision)._

## API ##

### Owner ###

**craft ai** agents belong to **owners**. In the current version, each identified users defines a owner, in the future we will introduce shared organization-level owners.

### Model ###

Each agent is based upon a model, the model defines:

- the context schema, i.e. the list of property keys and their type (as defined in the following section),
- the output properties, i.e. the list of property keys on which the agent takes decisions,

> :warning: In the current version, only one output property can be provided, and must be of type `enum`.

- the `time_quantum` is the minimum amount of time, in seconds, that is meaningful for an agent; context updates occurring faster than this quantum won't be taken into account.

#### Context properties types ####

##### Base types: `enum` and `continuous` #####

`enum` and `continuous` are the two base **craft ai** types:

- `enum` properties can take any string values;
- `continuous` properties can take any real number value.

##### Time types: `timezone`, `time_of_day` and `day_of_week` #####

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

> :information_source: By default, the values of the `time_of_day` and `day_of_week`
> properties are generated from the [`timestamp`](#timestamp) of an agent's
> state and the agent's current `timezone`. Therefore, whenever you use generated
> `time_of_day` and/or `day_of_week` in your model, you **must** provide a
> `timezone` value in the context.
>
> If you wish to provide their values manually, add `is_generated: false` to the
> time types properties in your model. In this case, since you provide the values, the
> `timezone` property is not required, and you must update the context whenever
> one of these time values changes in a way that is significant for your system.

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

### Timestamp ###

**craft ai** API heavily relies on `timestamps`. A `timestamp` is an instant represented as a [Unix time](https://en.wikipedia.org/wiki/Unix_time), that is to say the amount of seconds elapsed since Thursday, 1 January 1970 at midnight UTC. In most programming languages this representation is easy to retrieve, you can refer to [**this page**](https://github.com/techgaun/unix-time/blob/master/README.md) to find out how.

#### `craftai.Time` ####

The `craftai.Time` class facilitates the handling of time types in **craft ai**. It is able to extract the different **craft ai** formats from various _datetime_ representations, thanks to [Moment.js](http://momentjs.com).

```js
// From a unix timestamp and an explicit UTC offset
const t1 = new craftai.Time(1465496929, '+10:00');

// t1 === {
//   utc: '2016-06-09T18:28:49.000Z',
//   timestamp: 1465496929,
//   day_of_week: 4,
//   time_of_day: 4.480277777777778,
//   timezone: '+10:00'
// }

// From a unix timestamp and using the local UTC offset.
const t2 = new craftai.Time(1465496929);

// Value are valid if in Paris !
// t2 === {
//   utc: '2016-06-09T18:28:49.000Z',
//   timestamp: 1465496929,
//   day_of_week: 3,
//   time_of_day: 20.480277777777776,
//   timezone: '+02:00'
// }

// From a ISO 8601 string
const t3 = new craftai.Time('1977-04-22T01:00:00-05:00');

// t3 === {
//   utc: '1977-04-22T06:00:00.000Z',
//   timestamp: 230536800,
//   day_of_week: 4,
//   time_of_day: 1,
//   timezone: '-05:00'
// }

// Retrieve the current time with the local UTC offset
const now = new craftai.Time();

// Retrieve the current time with the given UTC offset
const nowP5 = new craftai.Time(undefined, '+05:00');
```

### Agent ###

#### Create ####

Create a new agent, and create its [model](#model).

```js
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
  true, // `deleteOnExit`, default is false
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
```

##### `deleteOnExit` #####

If `true`, the agent will delete itself when the window unloads or the process
exits.

- The **browser** version relies on the
[_beforeunload_](https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload)
event.
- The **nodejs** version relies on the
[_uncaughtException_](https://nodejs.org/api/process.html#process_event_uncaughtexception),
[_unhandledrejection_](https://nodejs.org/api/process.html#process_event_unhandledrejection),
[_SIGINT_, _SIGTERM_, _SIGQUIT_ and _SIGHUP_](https://nodejs.org/api/process.html#process_signal_events) events.

#### Delete ####

```js
client.deleteAgent(
  'aphasic_parrot' // The agent id
)
.then(function() {
  // The agent was successfully deleted
})
.catch(function(error) {
  // Catch errors here
})
```

#### Retrieve ####

```js
client.getAgent(
  'aphasic_parrot' // The agent id
)
.then(function(agent) {
  // Agent details
})
.catch(function(error) {
  // Catch errors here
})
```

#### List ####

```js
client.listAgents()
.then(function(agentIds) {
  // list of agent ids, eg. ['impervious_kraken', 'aphasic_parrot']
})
.catch(function(error) {
  // Catch errors here
})
```

#### Retrieve the agent inspector URL ####

```js
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
```

### Context ###

#### Add operations ####

By default, this method adds the given operations to a cache that is flushed at
least once every `cfg.operationsAdditionWait`.

```js
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
```

##### Error handling #####

When an addition is cached, subsequent method calls related to this agent will
force a flush before proceeding. For example:

```js
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
```

#### List operations ####

```js
client.getAgentContextOperations(
  'aphasic_parrot' // The agent id
)
.then(function(operations) {
  // Work on operations
})
.catch(function(error) {
  // Catch errors here
})
```

#### Retrieve state ####

```js
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
```

### Decision tree ###

#### Compute ####

```js
client.getAgentDecisionTree(
  'aphasic_parrot', // The agent id
  1464600256 // The timestamp at which the decision tree is retrieved
)
.then(function(tree) {
  // Works with the given tree
})
.catch(function(error) {
  // Catch errors here
})
```

#### Take Decision ####

The first method retrieves the decision tree then apply it on the given context.

```js
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
```

To get a chance to store and reuse the decision tree, use `getAgentDecisionTree` and use `craftai.decide`, a simple function evaluating a decision tree **offline**.

```js
// `tree` is the decision tree as retrieved through the craft ai REST API
let tree = { ... };

// Compute the decision on a context created from the given one and filling the
// `day_of_week`, `time_of_day` and `timezone` properties from the given `Time`
let decision = craftai.decide(
  tree,
  {
    presence: 'gisele'
  },
  new Time('2010-01-01T05:06:30'));
```

> Any number of partial contextes and/or `craftai.Time` instances can be provided to `decide`, it follows the same semantics than [Object.assign(...)](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign): the later arguments overriding the properties value from the previous ones)

The computed `decision` looks like:

```js
{
  context: { // In which context the decision was taken
    presence: 'gisele',
    day: 4,
    time: 5.108333333333333,
    tz: '+01:00'
  },
  decision: { // The decision itself
    blind: 'OPEN'
  },
  confidence: 0.9937745256361138, // The confidence in the decision
  predicates: [ // The ordered list of predicates that were validated to reach this decision
    {
      property: 'timeOfDay',
      op: 'continuous.greaterthanorequal',
      value: 6
    },
    {
      property: 'timeOfDay',
      op: 'continuous.lessthan',
      value: 19
    },
    {
      property: 'dayOfWeek',
      op: 'continuous.greaterthanorequal',
      value: 5
    },
    {
      property: 'timeOfDay',
      op: 'continuous.greaterthanorequal',
      value: 10
    }
  ]
}
```

### Logging ###

The **craft ai** client is using
[visionmedia/debug](https://www.npmjs.com/package/debug) under the namespace
`'craft-ai:client:*'`, please refer to their documentation for further
information.
