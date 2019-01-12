import { SF2Chunk } from '~/chunk';
import { ParseError } from '~/riff';
import { SF_BAG_SIZE } from '~/constants';
import { Generator, GeneratorType, Modulator, Zone, ZoneItems } from '~/types';

/**
 * Get the preset or instrument zones from a chunk.
 *
 * @param {SF2Chunk} chunk - The input chunk
 * @param {string} type - The type of chunk ('pbag' or 'ibag')
 */
export const getZones = (chunk: SF2Chunk, type: 'pbag' | 'ibag'): Zone[] => {
  if (chunk.id !== type) {
    throw new ParseError('Unexpected chunk ID', `'${type}'`, `'${chunk.id}'`);
  }

  if (chunk.length % SF_BAG_SIZE) {
    throw new ParseError(`Invalid size for the '${type}' sub-chunk`);
  }

  return chunk.iterate<Zone>(iterator => ({
    generatorIndex: iterator.getInt16(),
    modulatorIndex: iterator.getInt16()
  }));
};

/**
 * Get all modulators and generators in a preset or instrument.
 *
 * @template T
 * @param {T} headers - The preset or instrument headers
 * @param {Zone[]} zones - All zones for the preset or instrument
 * @param {Modulator[]} modulators - All modulators for the preset or instrument
 * @param {Generator[]} generators - All generators for the preset or instrument
 */
export const getItemsInZone = <T extends { bagIndex: number }>(
  headers: T[],
  zones: Zone[],
  modulators: Modulator[],
  generators: Generator[]
): { header: T; zones: ZoneItems[] }[] => {
  const items: { header: T; zones: ZoneItems[] }[] = [];

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const next = headers[i + 1];

    const start = header.bagIndex;
    const end = next ? next.bagIndex : zones.length;

    const zoneItems: ZoneItems[] = [];

    for (let j = start; j < end; j++) {
      zoneItems.push({
        modulators: getModulators(j, zones, modulators),
        generators: getGenerators(j, zones, generators)
      });
    }

    items.push({
      header,
      zones: zoneItems
    });
  }

  return items;
};

/**
 * Get all modulators from a zone, based on the index. The end index is the modulator index of the
 * next zone, or the total zone length if the current zone is the last one.
 *
 * @param {number} index - The index
 * @param {Zone[]} zones - ALl zones for the preset or instrument
 * @param {Modulator[]} modulators - All modulators for the preset or instrument
 */
const getModulators = (index: number, zones: Zone[], modulators: Modulator[]) => {
  const zone = zones[index];
  const next = zones[index + 1];

  const start = zone.modulatorIndex;
  const end = next ? next.modulatorIndex : zones.length;

  return getZone(start, end, modulators);
};

/**
 * Get all generators from a zone, based on the index. The end index is the generators index of the
 * next zone, or the total zone length if the current zone is the last one.
 *
 * @param {number} index - The index
 * @param {Zone[]} zones - ALl zones for the preset or instrument
 * @param {Generator[]} generators - All generators for the preset or instrument
 */
const getGenerators = (index: number, zones: Zone[], generators: Generator[]) => {
  const zone = zones[index];
  const next = zones[index + 1];

  const start = zone.generatorIndex;
  const end = next ? next.generatorIndex : zones.length;

  return getZone(start, end, generators);
};

/**
 * Returns all modulators or generators as a key-value object, where the key is the `GeneratorType`
 * of the modulator or generator.
 *
 * @template T
 * @param {number} start - The start index
 * @param {number} end - The end index
 * @param {T[]} items - The modulators or generators
 */
const getZone = <T extends { id: GeneratorType }>(
  start: number,
  end: number,
  items: T[]
): { [key in GeneratorType]?: T } => {
  const itemsObject: { [key in GeneratorType]?: T } = {};

  for (let i = start; i < end; i++) {
    const item = items[i];
    if (item) {
      itemsObject[item.id] = item;
    }
  }

  return itemsObject;
};