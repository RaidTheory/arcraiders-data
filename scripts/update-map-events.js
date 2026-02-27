#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Downloads the public map-event rotation, merges it with local metadata, and
 * rewrites map-events/map-events.json.
 * Can be used in a github action to automate the process
 */
const API_URL = "https://arctracker.io/api/map-events";

const prefixToMapId = {
  dam: "dam-battleground",
  buriedCity: "buried-city",
  spaceport: "the-spaceport",
  blueGate: "blue-gate",
  stellaMontis: "stella-montis"
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const targetPath = path.join(repoRoot, "map-events", "map-events.json");

async function run() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${API_URL}: ${response.status} ${response.statusText}`
    );
  }

  const payload = await response.json();
  if (!Array.isArray(payload.fullRotation)) {
    throw new Error("API payload missing fullRotation array");
  }

  const mapEvents = JSON.parse(await readFile(targetPath, "utf8"));
  const schedule = buildSchedule(payload.fullRotation, mapEvents.eventTypes);
  const eventTypes = mergeEventLocalizations(
    mapEvents.eventTypes,
    payload.eventTypes
  );
  const nextData = {
    ...mapEvents,
    eventTypes,
    schedule
  };

  await writeFile(targetPath, `${JSON.stringify(nextData, null, 2)}\n`);
  console.log(
    `Updated map-events.json with ${payload.fullRotation.length} schedule entries`
  );
}

function buildSchedule(fullRotation, eventTypes = {}) {
  // Seed every map with empty major/minor buckets so missing rotations do not
  // erase prior maps from the file.
  const schedule = Object.values(prefixToMapId).reduce((acc, mapId) => {
    acc[mapId] = { major: {}, minor: {} };
    return acc;
  }, {});

  for (const entry of fullRotation) {
    const hour = entry.hour;
    if (typeof hour !== "number") {
      continue;
    }

    for (const [key, rawName] of Object.entries(entry)) {
      if (key === "hour") {
        continue;
      }

      const match = /^([a-zA-Z]+)(Minor|Major)$/.exec(key);
      if (!match) {
        continue;
      }

      const [, prefix, tierRaw] = match;
      const mapId = prefixToMapId[prefix];
      if (!mapId) {
        throw new Error(`Unexpected map prefix "${prefix}" in API response`);
      }

      const tier = tierRaw.toLowerCase();
      const eventName =
        typeof rawName === "string" ? rawName.trim() : String(rawName || "");

      if (!eventName || eventName.toLowerCase() === "none") {
        continue;
      }

      const slug = slugify(eventName);
      if (!eventTypes[slug]) {
        throw new Error(
          `Event type "${eventName}" (${slug}) missing from eventTypes`
        );
      }

      // Each hour slot only stores the slug so we inherit the rich metadata
      // (icons, descriptions, rewards) from eventTypes on the frontend.
      schedule[mapId][tier][hour.toString()] = slug;
    }
  }

  return schedule;
}

function mergeEventLocalizations(eventTypes = {}, remoteEventTypes = {}) {
  const next = { ...eventTypes };

  for (const [slug, config] of Object.entries(eventTypes)) {
    const localizations = remoteEventTypes?.[slug]?.localizations;
    if (!localizations || typeof localizations !== "object") {
      continue;
    }

    // Replace the localization blob wholesale so the languages stay aligned
    // with whatever production currently exposes.
    next[slug] = {
      ...config,
      localizations
    };
  }

  return next;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
