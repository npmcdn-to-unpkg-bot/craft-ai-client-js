import _ from 'lodash';
import Time from './time';

export default function createContext(model, ...args) {
  if ( _.isUndefined(model) || _.isUndefined(model.context) ) {
    throw new Error('Unable to create context, the given model is not valid');
  }

  const inputContext = _.omit(model.context, model.output);

  return _.reduce(args, (context, arg) => {
    if (arg instanceof Time) {
      const { day_of_week, time_of_day, timezone } = arg;

      return _.mapValues(inputContext, (v, k) => {
        if (v.type === 'day_of_week' && (_.isUndefined(v.is_generated) || v.is_generated)) {
          return day_of_week;
        }
        else if (v.type === 'time_of_day' && (_.isUndefined(v.is_generated) || v.is_generated)) {
          return time_of_day;
        }
        else if (v.type === 'timezone') {
          return timezone;
        }
        else {
          return context[k];
        }
      });
    }
    else {
      return _.mapValues(inputContext, (v, k) => {
        return _.isUndefined( arg[k] ) ? context[k] : arg[k];
      });
    }
  }, _.mapValues(inputContext, () => {
    return undefined;
  }));
}
