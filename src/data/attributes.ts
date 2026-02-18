export const ATTRIBUTES = [
  { category: "元素属性", ja: "火属性", en: "Fire", image: "fire.png" },
  { category: "元素属性", ja: "水属性", en: "Water", image: "water.png" },
  { category: "元素属性", ja: "雷属性", en: "Thunder", image: "thunder.png" },
  { category: "元素属性", ja: "氷属性", en: "Ice", image: "ice.png" },
  { category: "元素属性", ja: "龍属性", en: "Dragon", image: "dragon.png" },
  { category: "状態異常", ja: "毒", en: "Poison", image: "poison.png" },
  { category: "状態異常", ja: "麻痺", en: "Paralysis", image: "paralysis.png" },
  { category: "状態異常", ja: "睡眠", en: "Sleep", image: "sleep.png" },
  { category: "状態異常", ja: "爆破", en: "Blast", image: "bomb.png" },
] as const;

export const ATTRIBUTE_IMAGE_MAP: Record<string, string> = Object.fromEntries(
  ATTRIBUTES.map((a) => [a.ja, `/assets/attributes/${a.image}`]),
);
