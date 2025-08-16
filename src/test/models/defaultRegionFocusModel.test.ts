import { Focus, loadStandardModel, RegionFocus, StandardModel } from '../../models/focusModel';
import assert from 'assert';

suite('Everything in default profile focus model', () => {
  let f: Focus;

  suiteSetup(() => {
    f = loadStandardModel(StandardModel.EVERYTHING_IN_DEFAULT_REGION);
  });
  
  test('Has the supported version (1.0)', () => {
    assert.strictEqual(f.version, '1.0');
  });

  test('Has a single default profile', () => {
    assert.strictEqual(f.profiles.length, 1);
    assert.strictEqual(f.profiles[0].id, 'default');
  });

  test('Has a single region entry with a default name', () => {
    const regions: RegionFocus[] = f.profiles[0].regions;
    
    assert.strictEqual(regions.length, 1);
    assert.strictEqual(regions[0].id, "default");
  });
});