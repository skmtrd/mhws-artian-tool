export const WEAPONS = [
  { ja: "大剣", en: "Great Sword", image: "taiken.avif" },
  { ja: "太刀", en: "Long Sword", image: "tati.avif" },
  { ja: "片手剣", en: "Sword & Shield", image: "katetekenn.avif" },
  { ja: "双剣", en: "Dual Blades", image: "souken.avif" },
  { ja: "ハンマー", en: "Hammer", image: "hannmar.avif" },
  { ja: "狩猟笛", en: "Hunting Horn", image: "syuryobue.avif" },
  { ja: "ランス", en: "Lance", image: "ransu.avif" },
  { ja: "ガンランス", en: "Gunlance", image: "ganransu.avif" },
  { ja: "スラッシュアックス", en: "Switch Axe", image: "suraaku.avif" },
  { ja: "チャージアックス", en: "Charge Blade", image: "tyaaku.avif" },
  { ja: "操虫棍", en: "Insect Glaive", image: "soutyuukonn.avif" },
  { ja: "ライトボウガン", en: "Light Bowgun", image: "raitobougan.avif" },
  { ja: "重弓銃", en: "Heavy Bowgun", image: "hibi-bougan.avif" },
  { ja: "弓", en: "Bow", image: "yumi.avif" },
] as const;

export const WEAPON_IMAGE_MAP: Record<string, string> = Object.fromEntries(
  WEAPONS.map((w) => [w.ja, `/assets/weapons/${w.image}`]),
);
