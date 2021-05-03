/**
 * Copyright 2019 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { TestType, Config } from './types';
import { rootTestType, RunList, RunListConfig } from './testType';
import { currentlyLoadingConfigFile } from './globals';
import { errorWithCallLocation } from './util';

export * from './types';
export { expect } from './expect';
export const test: TestType<{}, {}, {}, {}, {}, {}> = rootTestType.test;

export function setConfig(config: Config) {
  const configFile = currentlyLoadingConfigFile();
  if (!configFile)
    throw errorWithCallLocation(`setConfig() can only be called in a configuration file.`);
  configFile.setConfig(config);
}

export function globalSetup(globalSetupFunction: () => any) {
  const configFile = currentlyLoadingConfigFile();
  if (!configFile)
    throw errorWithCallLocation(`globalSetup() can only be called in a configuration file.`);
  configFile.globalSetup(globalSetupFunction);
}

export function globalTeardown(globalTeardownFunction: () => any) {
  const configFile = currentlyLoadingConfigFile();
  if (!configFile)
    throw errorWithCallLocation(`globalTeardown() can only be called in a configuration file.`);
  configFile.globalTeardown(globalTeardownFunction);
}

type WorkerOptionsForEnv<T> = T extends TestType<infer T, infer W, infer TO, infer WO, infer DT, infer DW> ? WO : never;
export function runTests<T = typeof test>(config?: RunListConfig<WorkerOptionsForEnv<T>>) {
  const configFile = currentlyLoadingConfigFile();
  if (!configFile)
    throw errorWithCallLocation(`runTests() can only be called in a configuration file.`);
  configFile.addRunList(new RunList(config || {}));
}
