/**
 * Copyright Microsoft Corporation. All rights reserved.
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

import type { Expect } from './expectType';

interface SharedConfig {
  timeout?: number;
  retries?: number;
  repeatEach?: number;
  outputDir?: string;
}

export interface Config extends SharedConfig {
  forbidOnly?: boolean;
  globalTimeout?: number;
  grep?: string | RegExp | (string | RegExp)[];
  maxFailures?: number;
  quiet?: boolean;
  shard?: { total: number, current: number } | null;
  snapshotDir?: string;
  testDir?: string;
  testIgnore?: string | RegExp | (string | RegExp)[];
  testMatch?: string | RegExp | (string | RegExp)[];
  updateSnapshots?: boolean;
  workers?: number;
}
export type FullConfig = Required<Config>;

interface TestModifier {
  skip(): void;
  skip(condition: boolean): void;
  skip(description: string): void;
  skip(condition: boolean, description: string): void;

  fixme(): void;
  fixme(condition: boolean): void;
  fixme(description: string): void;
  fixme(condition: boolean, description: string): void;

  fail(): void;
  fail(condition: boolean): void;
  fail(description: string): void;
  fail(condition: boolean, description: string): void;
}

export type TestStatus = 'passed' | 'failed' | 'timedOut' | 'skipped';

export interface WorkerInfo {
  config: FullConfig;
  workerIndex: number;
}

export interface TestInfo extends WorkerInfo, TestModifier {
  // Declaration
  title: string;
  file: string;
  line: number;
  column: number;
  fn: Function;

  // Modifiers
  expectedStatus: TestStatus;
  timeout: number;
  annotations: { type: string, description?: string }[];
  testOptions: any;  // TODO: support tag in testOptions.
  repeatEachIndex: number;
  retry: number;

  // Results
  duration: number;
  status?: TestStatus;
  error?: any;
  stdout: (string | Buffer)[];
  stderr: (string | Buffer)[];
  data: { [key: string]: any };

  // Paths
  snapshotPathSegment: string;
  snapshotPath: (...pathSegments: string[]) => string;
  outputPath: (...pathSegments: string[]) => string;
}

interface SuiteFunction {
  (name: string, inner: () => void): void;
}

interface TestFunction<TestArgs, TestOptions> {
  (name: string, inner: (args: TestArgs, testInfo: TestInfo) => Promise<void> | void): void;
  (name: string, options: TestOptions, fn: (args: TestArgs, testInfo: TestInfo) => any): void;
}

export interface TestType<TestArgs, TestOptions, DeclaredTestArgs> extends TestFunction<TestArgs, TestOptions>, TestModifier {
  only: TestFunction<TestArgs, TestOptions>;
  describe: SuiteFunction & {
    only: SuiteFunction;
  };

  beforeEach(inner: (args: TestArgs, testInfo: TestInfo) => Promise<any> | any): void;
  afterEach(inner: (args: TestArgs, testInfo: TestInfo) => Promise<any> | any): void;
  beforeAll(inner: (workerInfo: WorkerInfo) => Promise<any> | any): void;
  afterAll(inner: (workerInfo: WorkerInfo) => Promise<any> | any): void;

  expect: Expect;

  extend(): TestType<TestArgs, TestOptions, DeclaredTestArgs>;
  extend<T>(env: Env<T, TestArgs>): TestType<TestArgs & T, TestOptions, DeclaredTestArgs>;
  declare<T>(): TestType<TestArgs & T, TestOptions, DeclaredTestArgs & T>;
  declareTestOptions<O>(): TestType<TestArgs, TestOptions & O, DeclaredTestArgs>;

  runWith(config: RunWithConfig, env: OptionalEnv<DeclaredTestArgs>): void;
  runWith<Args1>(config: RunWithConfig, env1: Env<Args1>, env2: Env<Diff<DeclaredTestArgs, Args1>>): void;
  runWith<Args1, Args2>(config: RunWithConfig, env1: Env<Args1>, env2: Env<Args2>, env3: Env<Diff<DeclaredTestArgs, Args1 & Args2>>): void;
  runWith<Args1, Args2, Args3>(config: RunWithConfig, env1: Env<Args1>, env2: Env<Args2>, env3: Env<Args3>, env4: Env<Diff<DeclaredTestArgs, Args1 & Args2 & Args3>>): void;
}

type Diff<A, B> = A extends object ? (B extends object ? Omit<A, keyof B> : never) : never;

export type RunWithConfig = SharedConfig & {
  tag?: string | string[];
};
interface EnvBeforeEach<TestArgs, PreviousTestArgs> {
  beforeEach(args: PreviousTestArgs, testInfo: TestInfo): TestArgs | Promise<TestArgs>;
}
interface EnvOptionalBeforeEach<TestArgs, PreviousTestArgs> {
  beforeEach?(args: PreviousTestArgs, testInfo: TestInfo): void | TestArgs | Promise<TestArgs>;
}
type EnvDetectBeforeEach<TestArgs, PreviousTestArgs> = {} extends TestArgs ? EnvOptionalBeforeEach<TestArgs, PreviousTestArgs> : EnvBeforeEach<TestArgs, PreviousTestArgs>;
type OptionalEnv<TestArgs> = {} extends TestArgs ? Env<TestArgs> | void : Env<TestArgs>;

export type Env<TestArgs, PreviousTestArgs = {}> = EnvDetectBeforeEach<TestArgs, PreviousTestArgs> & {
  beforeAll?(workerInfo: WorkerInfo): any | Promise<any>;
  afterEach?(testInfo: TestInfo): any | Promise<any>;
  afterAll?(workerInfo: WorkerInfo): any | Promise<any>;
}

// ---------- Reporters API -----------

export interface Suite {
  title: string;
  file: string;
  line: number;
  column: number;
  suites: Suite[];
  specs: Spec[];
  findTest(fn: (test: Test) => boolean | void): boolean;
  findSpec(fn: (spec: Spec) => boolean | void): boolean;
  totalTestCount(): number;
}
export interface Spec {
  title: string;
  file: string;
  line: number;
  column: number;
  tests: Test[];
  fullTitle(): string;
  ok(): boolean;
}
export interface Test {
  spec: Spec;
  results: TestResult[];
  skipped: boolean;
  expectedStatus: TestStatus;
  timeout: number;
  annotations: { type: string, description?: string }[];
  tags: string[];
  retries: number;
  status(): 'skipped' | 'expected' | 'unexpected' | 'flaky';
  ok(): boolean;
}
export interface TestResult {
  retry: number;
  workerIndex: number,
  duration: number;
  status?: TestStatus;
  error?: TestError;
  stdout: (string | Buffer)[];
  stderr: (string | Buffer)[];
  data: { [key: string]: any };
}
export interface TestError {
  message?: string;
  stack?: string;
  value?: string;
}
export interface Reporter {
  onBegin(config: FullConfig, suite: Suite): void;
  onTestBegin(test: Test): void;
  onStdOut(chunk: string | Buffer, test?: Test): void;
  onStdErr(chunk: string | Buffer, test?: Test): void;
  onTestEnd(test: Test, result: TestResult): void;
  onTimeout(timeout: number): void;
  onError(error: TestError): void;
  onEnd(): void;
}
