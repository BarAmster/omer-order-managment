// Default concrete parameter additions (per m³)
export const DEFAULT_STRENGTH_PARAMS = [
  { param_value: 'b20', label: 'ב20', price_addition: 0 },
  { param_value: 'b30', label: 'ב30', price_addition: 10 },
  { param_value: 'b40', label: 'ב40', price_addition: 20 },
  { param_value: 'b50', label: 'ב50', price_addition: 30 },
  { param_value: 'b60', label: 'ב60', price_addition: 40 },
]

export const DEFAULT_CONCRETE_TYPE_PARAMS = [
  { param_value: 'adash', label: 'עדש', price_addition: 0 },
  { param_value: 'maico', label: 'מייקו', price_addition: 30 },
  { param_value: 'dachus', label: 'דחוס', price_addition: 40 },
]

export const DEFAULT_SLUMP_PARAMS = [
  { param_value: '4', label: 'שקיעה 4', price_addition: -10 },
  { param_value: '5', label: 'שקיעה 5', price_addition: 0 },
  { param_value: '6', label: 'שקיעה 6', price_addition: 10 },
  { param_value: '7', label: 'שקיעה 7', price_addition: 20 },
]

export const DEFAULT_CONCRETE_PARAMS = [
  ...DEFAULT_STRENGTH_PARAMS.map(p => ({ ...p, param_type: 'strength' })),
  ...DEFAULT_CONCRETE_TYPE_PARAMS.map(p => ({ ...p, param_type: 'concrete_type' })),
  ...DEFAULT_SLUMP_PARAMS.map(p => ({ ...p, param_type: 'slump' })),
]

// Calculate concrete price using factory-specific params
export function calcConcretePrice(basePrice, strength, concreteType, slump, factoryParams) {
  const get = (type, value) => {
    const param = factoryParams?.find(p => p.param_type === type && p.param_value === value)
    return param?.price_addition ?? 0
  }
  return basePrice + get('strength', strength) + get('concrete_type', concreteType) + get('slump', slump)
}

// Pump pricing config (fixed, not per factory)
export const PUMP_CONFIG = {
  '36': { base: 1000, extra: 30 },
  '42': { base: 1500, extra: 40 },
  '52': { base: 2000, extra: 50 },
  maico: { base: 1500, extra: 40, pipeIncluded: 20, pipeExtra: 40 },
}

// pumpItem = row from price_list_items
export function calcPumpPrice(pumpItem, cubicMeters, pipeMeters) {
  if (!pumpItem) return 0
  const extraCubic = Math.max(0, cubicMeters - 10)
  let total = pumpItem.base_price + extraCubic * pumpItem.extra_per_unit
  if (pumpItem.pipe_included_meters != null) {
    const usedPipe = pipeMeters ?? pumpItem.pipe_included_meters
    const extraPipe = Math.max(0, usedPipe - pumpItem.pipe_included_meters)
    total += extraPipe * (pumpItem.pipe_extra_per_meter ?? 0)
  }
  return total
}
