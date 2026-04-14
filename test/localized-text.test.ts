import * as lt from "../src/types/localized-text";
import { test, expect } from "bun:test";
import * as z from "zod"; // https://zod.dev/basics
import { Glob } from "bun";
import { basename, resolve } from "path";
import { JSONPath } from "jsonpath-plus";

const root = resolve(import.meta.dir, "..");

// While the exported types are not strict, it is good to have a strict version
// of the schema for testing purposes to verify that all expected locales are
// present and that there are no unrecognized keys. This ensures that new locales
// are added to the type and tests will surface instances where translations may be missing
// from various entities like items, maps, and projects.
const LocalizedTextStrict =
  lt.__internal__.LocalizedTextCanonical.strict().describe(
    "LocalizedTextStrict"
  );

function getParseError(result: z.ZodSafeParseResult<any>): string | undefined {
  if (result.success) {
    return undefined;
  }
  const prettyError = z.prettifyError(result.error);
  return prettyError;
}

function getNumLocalizedTextInstances(json: string): number {
  // TODO: Note that we can expand this to `(@.en && @.es)` or similar when xfail issues
  // are addressed (i.e. Hurricane map condition excluding all but english translation)
  return JSONPath({
    path: "$..[?(@.en)]",
    json: json
  }).length;
}

test("xfail: validate locale directories match LocalizedText struct", async () => {
  const glob = new Glob(`${root}/arctracker-ui/*.json`);
  const actualLocales = new Set<string>();
  for await (const path of glob.scan()) {
    const locale = basename(path, ".json");
    actualLocales.add(locale);
  }
  const expectedLocales = new Set<string>(
    Object.keys(LocalizedTextStrict.shape)
  );
  expect(actualLocales.size).toEqual(expectedLocales.size);
  var errorCount = 0;
  for (const locale of expectedLocales) {
    if (!actualLocales.has(locale)) {
      console.error(`Locale ${locale} is missing from arctracker-ui directory`);
      ++errorCount;
    }
  }
  expect(errorCount).toBe(1); // Remove xfail when this is 0
});

test("validate strict schema w/ small trinket item", () => {
  const path = `${root}/items/library_book.json`;
  const data = require(path);
  expect(getParseError(LocalizedTextStrict.safeParse(data.name))).toBe(
    undefined
  );
});

test("xfail: validate strict schema w/ all maps", async () => {
  const xfailError = `✖ Invalid input: expected string, received undefined
  → at he`;
  const maps = require(`${root}/maps.json`);
  const expectedNumEvaluations = getNumLocalizedTextInstances(maps);
  var errorCount = 0;
  var numEvaluations = 0;
  for (const map of maps) {
    const error = getParseError(LocalizedTextStrict.safeParse(map.name));
    if (error) {
      console.error(`Validation failed for ${map.id}, ${error}`);
      expect(error).toBe(xfailError);
      ++errorCount;
    }
    ++numEvaluations;
  }
  expect(errorCount).toBe(6); // Remove xfail when this is 0
  expect(numEvaluations).toBe(expectedNumEvaluations);
});

test("validate strict schema w/ all projects", async () => {
  interface Project {
    id: string;
    name: z.infer<typeof lt.LocalizedText>;
    description: z.infer<typeof lt.LocalizedText>;
    phases: {
      name: z.infer<typeof lt.LocalizedText>;
      description: z.infer<typeof lt.LocalizedText>;
      phase: number;
      requirementCategories?: {
        localizations: z.infer<typeof lt.LocalizedText>;
      }[];
    }[];
  }
  const projects = require(`${root}/projects.json`);
  const expectedNumEvaluations = getNumLocalizedTextInstances(projects);
  var errorCount = 0;
  var numEvaluations = 0;
  for (const project of projects as Project[]) {
    var error = getParseError(LocalizedTextStrict.safeParse(project.name));
    ++numEvaluations;
    if (error) {
      console.error(`Validation failed for ${project.id}->name, ${error}`);
      ++errorCount;
    }
    error = getParseError(LocalizedTextStrict.safeParse(project.description));
    ++numEvaluations;
    if (error) {
      console.error(
        `Validation failed for ${project.id}->description, ${error}`
      );
      ++errorCount;
    }
    if (project.phases && project.phases.length > 0) {
      for (const phase of project.phases) {
        error = getParseError(LocalizedTextStrict.safeParse(phase.name));
        ++numEvaluations;
        if (error) {
          console.error(
            `Validation failed for ${project.id}->${phase.name.en}->name, ${error}`
          );
          ++errorCount;
        }
        error = getParseError(LocalizedTextStrict.safeParse(phase.description));
        ++numEvaluations;
        if (error) {
          console.error(
            `Validation failed for ${project.id}->${phase.name.en}->description, ${error}`
          );
          ++errorCount;
        }
        if (phase.requirementCategories) {
          for (const category of phase.requirementCategories) {
            const error = getParseError(
              LocalizedTextStrict.safeParse(category.localizations)
            );
            ++numEvaluations;
            if (error) {
              console.error(
                `Validation failed for ${project.id}->${phase.name.en}->${category.localizations.en}, ${error}`
              );
              ++errorCount;
            }
          }
        }
      }
    }
  }
  expect(errorCount).toBe(0);
  expect(numEvaluations).toBe(expectedNumEvaluations);
});

test("validate strict schema w/ all skills", async () => {
  interface Skill {
    id: string;
    name: z.infer<typeof lt.LocalizedText>;
    description: z.infer<typeof lt.LocalizedText>;
    impactedSkill: z.infer<typeof lt.LocalizedText>;
  }
  const skills = require(`${root}/skillNodes.json`);
  const expectedNumEvaluations = getNumLocalizedTextInstances(skills);
  var errorCount = 0;
  var numEvaluations = 0;
  for (const skill of skills as Skill[]) {
    var error = getParseError(LocalizedTextStrict.safeParse(skill.name));
    ++numEvaluations;
    if (error) {
      console.error(`Validation failed for ${skill.id}->name, ${error}`);
      ++errorCount;
    }
    error = getParseError(LocalizedTextStrict.safeParse(skill.description));
    ++numEvaluations;
    if (error) {
      console.error(`Validation failed for ${skill.id}->description, ${error}`);
      ++errorCount;
    }
    error = getParseError(LocalizedTextStrict.safeParse(skill.impactedSkill));
    ++numEvaluations;
    if (error) {
      console.error(
        `Validation failed for ${skill.id}->impactedSkill, ${error}`
      );
      ++errorCount;
    }
  }
  expect(errorCount).toBe(0);
  expect(numEvaluations).toBe(expectedNumEvaluations);
});

test("validate strict schema w/ all hideouts", async () => {
  const glob = new Glob(`${root}/hideout/*.json`);
  var errorCount = 0;
  var expectedNumEvaluations = 0;
  var numEvaluations = 0;
  for await (const path of glob.scan()) {
    const data = require(path);
    expectedNumEvaluations += getNumLocalizedTextInstances(data);
    const error = getParseError(LocalizedTextStrict.safeParse(data.name));
    ++numEvaluations;
    if (error) {
      console.error(`Validation failed for ${data.id}, ${error}`);
      ++errorCount;
    }
  }
  expect(errorCount).toBe(0);
  expect(numEvaluations).toBe(expectedNumEvaluations);
});

test("xfail: validate strict schema w/ all items", async () => {
  const xfailError = `✖ Unrecognized key: "kr"
✖ Invalid input: expected string, received undefined
  → at ["ko-KR"]`;
  const glob = new Glob(`${root}/items/*.json`);
  var errorCount = 0;
  for await (const path of glob.scan()) {
    const data = require(path);
    const error = getParseError(LocalizedTextStrict.safeParse(data.name));
    if (error) {
      console.error(`Validation failed for ${data.id}, ${error}`);
      expect(error).toBe(xfailError);
      ++errorCount;
    }
    if (data.description) {
      const error = getParseError(
        LocalizedTextStrict.safeParse(data.description)
      );
      if (error) {
        console.error(
          `Validation failed for ${data.id}->description, ${error}`
        );
        expect(error).toBe(xfailError);
        ++errorCount;
      }
    }
  }
  expect(errorCount).toBe(12); // Remove xfail when this is 0
});

// The value of this test relative to the previous one is
// that it verifies that we can coerce the non-canonical "ko" and "kr" keys to
// "ko-KR" in the raw schema. Once the preceding strict check passes, we can
// consider removing this test and the non-canonical keys from the raw schema.
test("validate schema w/ all items", async () => {
  const glob = new Glob(`${root}/items/*.json`);
  var errorCount = 0;
  for await (const path of glob.scan()) {
    const data = require(path);
    const error = getParseError(lt.LocalizedText.safeParse(data.name));
    if (error) {
      console.error(`Validation failed for ${path}.name, ${error}`);
      ++errorCount;
    }
    if (data.description) {
      const error = getParseError(lt.LocalizedText.safeParse(data.description));
      if (error) {
        console.error(`Validation failed for ${path}.description, ${error}`);
        ++errorCount;
      }
    }
  }
  expect(errorCount).toBe(0);
});

test("xfail: validate strict schema w/ all map events", async () => {
  interface MapEvent {
    localizations: z.infer<typeof lt.LocalizedText>;
  }
  const events = require(`${root}/map-events/map-events.json`);
  const expectedNumEvaluations = getNumLocalizedTextInstances(events);
  var errorCount = 0;
  var numEvaluations = 0;
  for (const [name, instance] of Object.entries(events.eventTypes) as [
    string,
    MapEvent
  ][]) {
    const error = getParseError(
      LocalizedTextStrict.safeParse(instance.localizations)
    );
    ++numEvaluations;
    if (error) {
      console.error(`Validation failed for map event ${name}, ${error}`);
      ++errorCount;
    }
  }
  expect(errorCount).toBe(15); // Remove xfail when this is 0
  expect(numEvaluations).toBe(expectedNumEvaluations);
});

test("validate strict schema w/ all quests", async () => {
  const glob = new Glob(`${root}/quests/*.json`);
  var errorCount = 0;
  var expectedNumEvaluations = 0;
  var numEvaluations = 0;
  for await (const path of glob.scan()) {
    const data = require(path);
    expectedNumEvaluations += getNumLocalizedTextInstances(data);
    var error = getParseError(LocalizedTextStrict.safeParse(data.name));
    ++numEvaluations;
    if (error) {
      console.error(`Validation failed for ${data.id}.name, ${error}`);
      ++errorCount;
    }
    error = getParseError(LocalizedTextStrict.safeParse(data.description));
    ++numEvaluations;
    if (error) {
      console.error(`Validation failed for ${data.id}.description, ${error}`);
      ++errorCount;
    }
    for (const [index, objective] of data.objectives.entries()) {
      const error = getParseError(LocalizedTextStrict.safeParse(objective));
      ++numEvaluations;
      if (error) {
        console.error(
          `Validation failed for ${data.id}.objectives[${index}], ${error}`
        );
        ++errorCount;
      }
    }
  }
  expect(errorCount).toBe(0);
  expect(numEvaluations).toBe(expectedNumEvaluations);
});
