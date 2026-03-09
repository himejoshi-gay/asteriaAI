/* eslint-disable unused-imports/no-unused-vars -- used in eval */
import { pluralize } from "./pluralize.util";

const declensions = {
  d: {
    oneObject: "day",
    someObjects: "days",
    manyObjects: "days",
  },
  h: {
    oneObject: "hour",
    someObjects: "hours",
    manyObjects: "hours",
  },
  m: {
    oneObject: "minute",
    someObjects: "minutes",
    manyObjects: "minutes",
  },
  s: {
    oneObject: "second",
    someObjects: "seconds",
    manyObjects: "seconds",
  },
};

export function getDuration(seconds: number) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const values = ["d", "h", "m", "s"] as const;
  let return_value = "";

  for (let i = 0; i < values.length; i++) {
    const value = eval(values[i] ?? "d");

    if (value > 0 || (seconds === 0 && i === 3)) {
      const word = pluralize(value, "", declensions[values[i] ?? "d"]);
      return_value += `${value} ${word} `;
    }
  }
  return return_value.trim();
}
