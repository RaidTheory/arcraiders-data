// Please note, changes in this file may require restarting your IDE.
// VSCode needs to be restarted so the prettier server can pick up changes.
// See the 'OUTPUT' -> 'Prettier' in VSCode to confirm that it keeps re-reading the old config.

import { configure } from "safe-stable-stringify";

function stable_stringify(obj) {
  const key_order = Object.keys(obj);
  const stringify = configure({
    deterministic: (lhs, rhs) => {
      const lhs_idx = key_order.indexOf(lhs);
      const rhs_idx = key_order.indexOf(rhs);

      return lhs_idx > rhs_idx ? 1 : -1;
    }
  });

  return stringify(obj);
}

// json-sort-order for each folder as specified in:
// https://github.com/Gudahtt/prettier-plugin-sort-json?tab=readme-ov-file#json-sort-order
const json_sort_orders = {
  directories: [
    {
      name: "items",
      rules: {
        id: null,
        name: null,
        description: null,
        type: null,
        rarity: null,
        foundIn: null,
        value: null,
        weightKg: null,
        stackSize: null,
        craftQuantity: null,
        isWeapon: null,
        questItem: null,
        compatibleWith: null,
        blueprintLocked: null,
        effects: null,
        craftBench: null,
        stationLevelRequired: null,
        recipe: null,
        recyclesInto: null,
        salvagesInto: null,
        upgradeCost: null,
        imageFilename: null,
        updatedAt: null,
        "/.*/": "caseInsensitiveLexical"
      }
    },
    {
      name: "hideout",
      rules: {
        id: null,
        name: null,
        maxLevel: null,
        levels: null,
        "/.*/": "caseInsensitiveLexical"
      }
    },
    {
      name: "quests",
      rules: {
        id: null,
        name: null,
        map: null,
        trader: null,
        requiredItemIds: null,
        otherRequirements: null,
        grantedItemIds: null,
        description: null,
        objectivesOneRound: null,
        objectives: null,
        rewardItemIds: null,
        xp: null,
        previousQuestIds: null,
        nextQuestIds: null,
        videoUrl: null,
        updatedAt: null,
        "/.*/": "caseInsensitiveLexical"
      }
    }
  ],
  standalone_files: [
    {
      name: "bots",
      rules: {
        id: null,
        name: null,
        type: null,
        threat: null,
        description: null,
        weakness: null,
        maps: null,
        destroyXp: null,
        lootXp: null,
        drops: null,
        image: null,
        "/.*/": "caseInsensitiveLexical"
      }
    },
    {
      name: "maps",
      rules: {
        id: null,
        name: null,
        image: null,
        "/.*/": "caseInsensitiveLexical"
      }
    },
    {
      name: "projects",
      rules: {
        id: null,
        disabled: null,
        name: null,
        description: null,
        phases: null,
        "/.*/": "caseInsensitiveLexical"
      }
    },
    {
      name: "skillNodes",
      rules: {
        id: null,
        name: null,
        category: null,
        isMajor: null,
        description: null,
        maxPoints: null,
        impactedSkill: null,
        knownValue: null,
        position: null,
        prerequisiteNodeIds: null,
        iconName: null,
        "/.*/": "caseInsensitiveLexical"
      }
    },
    {
      name: "trades",
      rules: {
        trader: null,
        itemId: null,
        quantity: null,
        cost: null,
        dailyLimit: null,
        "/.*/": "caseInsensitiveLexical"
      }
    }
  ]
};

function directory_rules_to_override(dir) {
  return {
    files: `./${dir.name}/*.json`,
    options: {
      plugins: ["prettier-plugin-sort-json"],
      jsonSortOrder: stable_stringify(dir.rules),
      jsonRecursiveSort: true
    }
  };
}

function standalone_file_rules_to_override(file) {
  return {
    files: `./${file.name}.json`,
    options: {
      plugins: ["prettier-plugin-sort-json"],
      jsonSortOrder: stable_stringify(file.rules),
      jsonRecursiveSort: true
    }
  };
}

/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  useTabs: false,
  tabWidth: 2,
  trailingComma: "none",
  singleQuote: false,
  printWidth: 80,
  overrides: [
    ...json_sort_orders.directories.map(directory_rules_to_override),
    ...json_sort_orders.standalone_files.map(standalone_file_rules_to_override)
  ]
};

export default config;
