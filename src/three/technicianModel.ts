import * as THREE from 'three';
import {
  DEFAULT_TECHNICIAN_APPEARANCE,
  TECHNICIAN_COLORWAYS,
  TECHNICIAN_HAIR_COLORS,
  TechnicianAppearance,
} from '../types/game';
import { buildHumanCharacter, OfficeOutfitStyle } from './humanCharacterBuilder';

export interface DetailedTechnicianRig {
  group: THREE.Group;
  hips: THREE.Group;
  pelvis: THREE.Mesh;
  hasSkirt: boolean;
  torso: THREE.Group;
  leftLeg: THREE.Group;
  leftShin: THREE.Group;
  rightLeg: THREE.Group;
  rightShin: THREE.Group;
  leftArm: THREE.Group;
  leftForearm: THREE.Group;
  rightArm: THREE.Group;
  rightForearm: THREE.Group;
  headGroup: THREE.Group;
  heldCableGroup: THREE.Group;
}

export function buildDetailedTechnician(
  appearance: TechnicianAppearance = DEFAULT_TECHNICIAN_APPEARANCE
): DetailedTechnicianRig {
  const palette =
    TECHNICIAN_COLORWAYS.find((c) => c.id === appearance.colorway) ?? TECHNICIAN_COLORWAYS[0];
  const hairPalette =
    TECHNICIAN_HAIR_COLORS.find((h) => h.id === appearance.hairColor) ?? TECHNICIAN_HAIR_COLORS[0];
  const isFemale = appearance.gender === 'female';

  const outfitMap: Record<TechnicianAppearance['outfit'], OfficeOutfitStyle> = {
    tech_jacket: 'tech_jacket',
    street_hoodie: 'street_hoodie',
    smart_vest: 'smart_vest',
    suit_tie: 'suit_tie',
    blazer_blouse: 'blazer_blouse',
  };

  // For female character in suit_tie or blazer_blouse, allow tailored skirt or trousers
  const useSkirt = isFemale && appearance.skirt;

  // Contrast inner shirt for hoodie vs crisp light shirt for tailored looks
  const innerShirtHex =
    appearance.outfit === 'street_hoodie' ? 0xe2e8f0 : palette.shirtHex;

  const human = buildHumanCharacter({
    skinHex: isFemale ? 0xf9d8be : 0xf5cca8,
    hairHex: hairPalette.hex,
    shirtHex: innerShirtHex,
    overshirtHex: palette.outerHex,
    tieHex: palette.tieOrAccentHex,
    accentHex: palette.tieOrAccentHex,
    pantsHex: palette.pantsHex,
    shoeHex: palette.shoeHex,
    hairStyle: appearance.hairStyle,
    outfitStyle: outfitMap[appearance.outfit],
    female: isFemale,
    skirt: useSkirt,
    earrings: isFemale,
    idBadgeHex: palette.badgeHex,
    idRoleLabel: 'IT LEAD',
    glasses: appearance.glasses,
    headset: appearance.headset,
    watch: true,
    lanyard: appearance.outfit !== 'blazer_blouse',
    irisHex: '#2b1712',
    lipHex: isFemale ? '#e6584f' : '#a45b48',
    browStyle: isFemale ? 'arched' : 'straight',
    expression: 'warm_smile',
    beautyMark: false,
    jawScale: isFemale ? 0.96 : 0.94,
    seated: false,
  });

  // Soft ground contact shadow under feet
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.36, 24),
    new THREE.MeshBasicMaterial({
      color: 0x090d14,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  human.group.add(shadow);

  // Carried Cat6 Cable Spool & RJ45 Plug in Right Hand
  const heldCableGroup = new THREE.Group();
  heldCableGroup.visible = false;

  const cableCoil = new THREE.Mesh(
    new THREE.TorusGeometry(0.085, 0.014, 8, 22),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.44 })
  );
  cableCoil.rotation.y = Math.PI / 2;
  heldCableGroup.add(cableCoil);

  const plugHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.02, 0.036),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
  );
  plugHead.position.set(0, 0.03, 0.08);
  heldCableGroup.add(plugHead);
  human.heldAnchor.add(heldCableGroup);

  return {
    group: human.group,
    hips: human.hips,
    pelvis: human.pelvis,
    hasSkirt: human.hasSkirt,
    torso: human.torso,
    leftLeg: human.leftLeg!,
    leftShin: human.leftShin!,
    rightLeg: human.rightLeg!,
    rightShin: human.rightShin!,
    leftArm: human.leftArm,
    leftForearm: human.leftForearm,
    rightArm: human.rightArm,
    rightForearm: human.rightForearm,
    headGroup: human.headGroup,
    heldCableGroup,
  };
}
