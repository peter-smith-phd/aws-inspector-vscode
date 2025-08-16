import { Focus, loadStandardModel, RegionFocus, StandardModel } from '../../models/focusModel';
import assert from 'assert';

suite('Everything in default profile focus model', () => {
  let f: Focus;

  suiteSetup(() => {
    f = loadStandardModel(StandardModel.EVERYTHING_IN_DEFAULT_PROFILE);
  });
  
  test('Has the supported version (1.0)', () => {
    assert.strictEqual(f.version, '1.0');
  });

  test('Has a single default profile', () => {
    assert.strictEqual(f.profiles.length, 1);
    assert.strictEqual(f.profiles[0].id, 'default');
  });

  test('Has a single region entry with a wildcard name', () => {
    const regions: RegionFocus[] = f.profiles[0].regions;
    
    assert.strictEqual(regions.length, 1);
    assert.strictEqual(regions[0].id, "*");
  });

  test('Has a single service entry with a wildcard name', () => {
    const services = f.profiles[0].regions[0].services;

    assert.strictEqual(services.length, 1);
    assert.strictEqual(services[0].id, "*");
  });

  test('Has a single resource type entry with a wildcard name', () => {
    const resourceTypes = f.profiles[0].regions[0].services[0].resourcetypes;

    assert.strictEqual(resourceTypes.length, 1);
    assert.strictEqual(resourceTypes[0].id, "*");
  });

  test('Has a single resource entry with a wildcard ARN', () => {
    const arns = f.profiles[0].regions[0].services[0].resourcetypes[0].arns;

    assert.strictEqual(arns.length, 1);
    assert.strictEqual(arns[0], "*");
  });
});