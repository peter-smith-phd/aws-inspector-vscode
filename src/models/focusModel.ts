/*
 * This file contains the models for a "focus" object, which describes a
 * specific configuration of which profiles, regions, services, resource types,
 * and resources should be shown in the UI.
 */
import * as fs from 'fs';
import path from 'path';
import * as z from "zod";
import { InternalError } from '../shared/errors';
import { memoize } from '../shared/memoize';

const ResourceTypeFocus = z.object({
  id: z.string(),
  get arns() {
    return z.array(z.string());
  }
});

const ServiceFocus = z.object({
  id: z.string(),
  get resourcetypes() {
    return z.array(ResourceTypeFocus);
  }
});

const RegionFocus = z.object({
  id: z.string(),
  get services() {
    return z.array(ServiceFocus);
  }
});

const ProfileFocus = z.object({
  id: z.string(),
  get regions() {
    return z.array(RegionFocus);
  }
});

export const Focus = z.object({
  version: z.string(),
  get profiles() {
    return z.array(ProfileFocus);
  }
});

export type Focus = z.infer<typeof Focus>;
export type ProfileFocus = z.infer<typeof ProfileFocus>;
export type RegionFocus = z.infer<typeof RegionFocus>;
export type ServiceFocus = z.infer<typeof ServiceFocus>;
export type ResourceTypeFocus = z.infer<typeof ResourceTypeFocus>;

/**
 * Standard focuses that are always available by default,
 * and can never be modified.
 */
type StandardModelType = {
  key: string;
  name: string;
}
export class StandardModel {
  static EVERYTHING_IN_DEFAULT_PROFILE: StandardModelType = {
    key: "everything-in-default-profile",
    name: "All Regions/Services in Default Profile"
  };
  static EVERYTHING_IN_DEFAULT_REGION: StandardModelType = {
    key: "everything-in-default-region",
    name: "All Services in Default Region"
  };
  static all = [
    StandardModel.EVERYTHING_IN_DEFAULT_PROFILE,
    StandardModel.EVERYTHING_IN_DEFAULT_REGION
  ];
}

/**
 * Load one of the standard (pre-defined, unmodifiable) focuses. The
 * result is memoized since the data will not change.
 */
export const loadStandardModel = memoize((model: StandardModelType, extensionPath: string = './' ) => {
  const jsonString: string = fs.readFileSync(
    path.resolve(extensionPath, 'resources', 'focuses', `${model.key}.focus.json`),
    'utf-8');

  let json: any;
  try {
    json = JSON.parse(jsonString);
  } catch (error) {
    throw new InternalError(`Loading standard Focus: '${model}': ${error}`);
  }

  const result = Focus.safeParse(json);
  if (!result.success) {
    throw new InternalError(`Loading standard Focus: '${model}': ${z.prettifyError(result.error)}`);
  }
  return result.data;
});