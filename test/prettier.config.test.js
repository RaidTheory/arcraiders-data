import config from "../prettier.config.js";
import { test, expect } from "bun:test";

test("Use spaces instead of tabs", () => {
  expect(config.useTabs).toBe(false);
});

test("Use two spaces for a tab", () => {
  expect(config.tabWidth).toBe(2);
});
