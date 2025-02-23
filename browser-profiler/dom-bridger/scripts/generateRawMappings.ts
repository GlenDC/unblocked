import '@ulixee/commons/lib/SourceMapSupport';
import * as Fs from 'fs';
import * as Path from 'path';
import BrowserProfiler from '@ulixee/unblocked-browser-profiler';
import deepDiff from '@ulixee/unblocked-browser-profiler/lib/deepDiff';
import IBridgeType from '../interfaces/IBridgeType';
import foreachBridgeSet from '../lib/foreachBridgeSet';

const devtoolsToNodevtools = generateRawMappings(['nodevtools', 'devtools']);
const devtoolsToNodevtoolsPath = Path.resolve(
  BrowserProfiler.dataDir,
  'dom-bridges/raw-mappings/nodevtools-to-devtools.json',
);
Fs.writeFileSync(devtoolsToNodevtoolsPath, JSON.stringify(devtoolsToNodevtools, null, 2));

const headlessToHeaded = generateRawMappings(['headed', 'headless']);
const headlessToHeadedPath = Path.resolve(
  BrowserProfiler.dataDir,
  'dom-bridges/raw-mappings/headed-to-headless.json',
);
Fs.writeFileSync(headlessToHeadedPath, JSON.stringify(headlessToHeaded, null, 2));

const instanceToInstance = generateRawMappings(['instance', 'instance']);
const instanceToInstancePath = Path.resolve(
  BrowserProfiler.dataDir,
  'dom-bridges/raw-mappings/instance-to-instance.json',
);
Fs.writeFileSync(instanceToInstancePath, JSON.stringify(instanceToInstance, null, 2));

const localToBrowserstack = generateRawMappings(['local', 'browserstack']);
const localToBrowserstackPath = Path.resolve(
  BrowserProfiler.dataDir,
  'dom-bridges/raw-mappings/local-to-browserstack.json',
);
Fs.writeFileSync(localToBrowserstackPath, JSON.stringify(localToBrowserstack, null, 2));

// HELPERS /////////////////////////////////////////////////////////////

function generateRawMappings(bridge: [IBridgeType, IBridgeType]): IFinalRawMapping {
  console.log('\nGENERATING ', bridge.join(' to '));
  console.log('--------------------------------------------------------------');
  const startingMap: IRawMapping = {
    allFileKeys: [],
    added: {},
    removed: {},
    changed: {},
    changedOrder: {},
  };

  const finalMap: IFinalRawMapping = {
    allFileKeys: startingMap.allFileKeys,
    added: {},
    removed: {},
    changed: {},
    changedOrder: {},
  };

  foreachBridgeSet('https', bridge, (fileKey, dom1, dom2) => {
    const diff = deepDiff(dom1, dom2);
    processBridgeDiff(fileKey, diff, startingMap);
  });

  for (const path of Object.keys(startingMap.added)) {
    const rhs = extractDiffValue(startingMap.added[path].rhsKeysByValue, startingMap.allFileKeys);
    finalMap.added[path] = { rhs };
  }

  for (const path of Object.keys(startingMap.removed)) {
    const rhs = extractDiffValue(startingMap.removed[path].rhsKeysByValue, startingMap.allFileKeys);
    finalMap.removed[path] = { rhs };
  }

  for (const path of Object.keys(startingMap.changed)) {
    const lhs = extractDiffValue(startingMap.changed[path].lhsKeysByValue, startingMap.allFileKeys);
    const rhs = extractDiffValue(startingMap.changed[path].rhsKeysByValue, startingMap.allFileKeys);
    finalMap.changed[path] = { lhs, rhs };
  }

  for (const path of Object.keys(startingMap.changedOrder)) {
    const lhs = extractDiffValue(
      startingMap.changedOrder[path].lhsKeysByValue,
      startingMap.allFileKeys,
    );
    finalMap.changedOrder[path] = { lhs };
  }

  return finalMap;
}

function extractDiffValue(
  keysByValue,
  allFileKeys,
): { fileKeys: string[]; value: any } | { fileKeys: string[]; value: any }[] {
  const values = Object.keys(keysByValue);
  if (values.length === 1) {
    const value = values[0];
    const keys = keysByValue[value];
    return {
      fileKeys: keys.length === allFileKeys.length ? 'ALL' : keys,
      value: JSON.parse(value),
    };
  }
  return values.map(value => {
    const fileKeys = keysByValue[value];
    return {
      fileKeys,
      value: JSON.parse(value),
    };
  });
}

function ignorePath(path: string): boolean {
  return path !== 'window.DomExtractor';
}

function processBridgeDiff(fileKey: string, diff, startingMap): void {
  console.log(`DIFFED ${fileKey}`);
  startingMap.allFileKeys.push(fileKey);

  diff.added.forEach(added => {
    const path = added.path;
    if (ignorePath(path)) return;
    const rhsValue = JSON.stringify(added.rhs);
    startingMap.added[path] ??= { rhsKeysByValue: {} };
    startingMap.added[path].rhsKeysByValue[rhsValue] ??= [];
    startingMap.added[path].rhsKeysByValue[rhsValue].push(fileKey);
  });

  diff.removed.forEach(removed => {
    const path = removed.path;
    if (ignorePath(path)) return;
    const rhsValue = JSON.stringify(path);
    startingMap.removed[path] ??= { rhsKeysByValue: {} };
    startingMap.removed[path].rhsKeysByValue[rhsValue] ??= [];
    startingMap.removed[path].rhsKeysByValue[rhsValue].push(fileKey);
  });

  diff.changed.forEach(change => {
    const path = change.path;
    if (ignorePath(path)) return;
    const lhsValue = JSON.stringify(change.lhs);
    const rhsValue = JSON.stringify(change.rhs);
    startingMap.changed[change.path] ??= {
      lhsKeysByValue: {},
      rhsKeysByValue: {},
    };
    startingMap.changed[path].lhsKeysByValue[lhsValue] ??= [];
    startingMap.changed[path].lhsKeysByValue[lhsValue].push(fileKey);
    startingMap.changed[path].rhsKeysByValue[rhsValue] ??= [];
    startingMap.changed[path].rhsKeysByValue[rhsValue].push(fileKey);
  });

  diff.changedOrder.forEach(changedOrder => {
    const path = changedOrder.path;
    if (ignorePath(path)) return;
    const lhsValue = JSON.stringify(changedOrder.lhs);
    startingMap.changedOrder[path] ??= { lhsKeysByValue: {} };
    startingMap.changedOrder[path].lhsKeysByValue[lhsValue] ??= [];
    startingMap.changedOrder[path].lhsKeysByValue[lhsValue].push(fileKey);
  });
}

interface IRawMapping {
  allFileKeys: string[];
  added: {
    [path: string]: {
      rhsKeysByValue: { [value: string]: string[] };
    };
  };
  removed: {
    [path: string]: {
      rhsKeysByValue: { [value: string]: string[] };
    };
  };
  changed: {
    [path: string]: {
      lhsKeysByValue: { [value: string]: string[] };
      rhsKeysByValue: { [value: string]: string[] };
    };
  };
  changedOrder: {
    [path: string]: {
      lhsKeysByValue: { [value: string]: string[] };
    };
  };
}

interface IFinalRawMapping {
  allFileKeys: string[];
  added: {
    [path: string]: {
      rhs: any[] | any;
    };
  };
  removed: {
    [path: string]: {
      rhs: any[] | any;
    };
  };
  changed: {
    [path: string]: {
      lhs: any[] | any;
      rhs: any[] | any;
    };
  };
  changedOrder: {
    [path: string]: {
      lhs: any[] | any;
    };
  };
}
