import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import type { AvatarConfig } from "../../hooks/useQueries";
import { getAvatarVariants } from "./avatarVariants";

interface AvatarPreview3DProps {
  avatarConfig: AvatarConfig;
}

/**
 * Build a true 3D blocky avatar from the variant data.
 *
 * Each variant provides { color, size:[w,h,d], type }. The size values are in
 * "head-relative" units; we scale them up to world units (1 unit ~= 0.5 world)
 * so the whole figure fits comfortably in the camera view. The depth (d)
 * dimension — ignored by the previous flat implementation — is now applied to
 * every mesh, giving the avatar real volume.
 *
 * Layout (world units, y-up, origin at the figure's vertical center):
 *   shoes  -> y = -2.0   (two boxes side by side)
 *   legs   -> y = -1.4   (two boxes, pants color)
 *   body   -> y = -0.3   (one box, body color)
 *   arms   -> y = -0.3   (two boxes flanking the body, body color)
 *   head   -> y =  0.95  (one box, head color)
 *   hair   -> y =  1.25  (shape depends on hair type)
 *   headwear -> y = 1.4+ (shape depends on headwear type)
 */
const SCALE = 0.5;

function Part({
  position,
  size,
  color,
  rotation,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  rotation?: [number, number, number];
}) {
  // Guard against zero-size parts (e.g. hair "none") so we never emit a
  // degenerate box — those simply render nothing.
  if (size[0] <= 0 || size[1] <= 0 || size[2] <= 0) return null;
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} />
    </mesh>
  );
}

function HairMesh({
  color,
  size,
  type,
  headTopY,
  headSize,
}: {
  color: string;
  size: [number, number, number];
  type: string;
  headTopY: number;
  headSize: [number, number, number];
}) {
  const [w, h, d] = size.map((v) => v * SCALE);
  if (type === "none" || w <= 0) return null;

  // Sit the hair just above the head, slightly wrapped over the top.
  const baseY = headTopY + h / 2 - 0.02;

  if (type === "curly" || type === "full") {
    // A rounded full head of hair — use a sphere scaled to the hair size.
    return (
      <mesh position={[0, baseY - h * 0.15, 0]} castShadow>
        <sphereGeometry args={[Math.max(w, d) / 2, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    );
  }

  if (type === "spiky" || type === "mohawk") {
    // Tall narrow strip — a stack of small boxes for a jagged look.
    const spikes = 5;
    const stripW = w;
    const spikeW = stripW / spikes;
    return (
      <group position={[0, baseY, 0]}>
        {Array.from({ length: spikes }).map((_, i) => {
          const sx = -stripW / 2 + spikeW * (i + 0.5);
          const sh = h * (0.7 + (i % 3) * 0.18);
          return (
            <mesh
              key={`spike-${sx.toFixed(3)}`}
              position={[sx, sh / 2, 0]}
              castShadow
            >
              <boxGeometry args={[spikeW * 0.8, sh, d]} />
              <meshStandardMaterial color={color} roughness={0.7} />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (type === "long") {
    // Hair that extends down the sides/back — a tall box plus two side panels.
    return (
      <group position={[0, baseY - h * 0.25, 0]}>
        <mesh castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh position={[-headSize[0] / 2, -h * 0.1, 0]} castShadow>
          <boxGeometry args={[0.04, h * 0.7, d * 0.8]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh position={[headSize[0] / 2, -h * 0.1, 0]} castShadow>
          <boxGeometry args={[0.04, h * 0.7, d * 0.8]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      </group>
    );
  }

  if (type === "ponytail") {
    // Cap of hair on top + a tail hanging off the back.
    return (
      <group>
        <mesh position={[0, baseY, 0]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh
          position={[0, baseY - h * 0.6, -headSize[2] / 2 - 0.05]}
          castShadow
        >
          <cylinderGeometry args={[0.05, 0.06, 0.35, 12]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      </group>
    );
  }

  // Default "top" — a simple box cap.
  return (
    <mesh position={[0, baseY, 0]} castShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

function HeadwearMesh({
  color,
  size,
  type,
  headTopY,
}: {
  color: string;
  size: [number, number, number];
  type: string;
  headTopY: number;
}) {
  const [w, h, d] = size.map((v) => v * SCALE);
  if (type === "none" || w <= 0) return null;

  const baseY = headTopY + h / 2;

  if (type === "tophat") {
    // Cylinder crown + flat brim.
    return (
      <group position={[0, baseY, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[w / 2, w / 2, h, 16]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh position={[0, -h / 2 + 0.01, 0]} castShadow>
          <cylinderGeometry args={[w * 0.85, w * 0.85, 0.04, 16]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      </group>
    );
  }

  if (type === "sunhat") {
    // Wide flat brim + low crown.
    return (
      <group position={[0, baseY, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[w / 2, w / 2, h, 16]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh position={[0, h / 2, 0]} castShadow>
          <cylinderGeometry args={[w * 0.6, w * 0.6, 0.04, 16]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </group>
    );
  }

  if (type === "crown") {
    // Short golden band with spike teeth.
    const spikes = 6;
    const toothW = w / spikes;
    return (
      <group position={[0, baseY, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[w / 2, w / 2, h * 0.5, 16]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
        </mesh>
        {Array.from({ length: spikes }).map((_, i) => {
          const angle = (i / spikes) * Math.PI * 2;
          const r = w / 2;
          return (
            <mesh
              key={`tooth-${angle.toFixed(3)}`}
              position={[Math.cos(angle) * r, h * 0.4, Math.sin(angle) * r]}
              castShadow
            >
              <boxGeometry args={[toothW * 0.6, h * 0.6, toothW * 0.6]} />
              <meshStandardMaterial
                color={color}
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (type === "cap") {
    // Baseball cap — rounded crown + visor in front.
    return (
      <group position={[0, baseY, 0]}>
        <mesh castShadow>
          <sphereGeometry
            args={[w / 2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]}
          />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh
          position={[0, -h * 0.1, d / 2 + 0.08]}
          rotation={[0.2, 0, 0]}
          castShadow
        >
          <boxGeometry args={[w * 0.9, 0.03, d * 0.7]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      </group>
    );
  }

  if (type === "beanie") {
    // Snug rounded shape covering the top of the head.
    return (
      <mesh position={[0, baseY, 0]} castShadow>
        <sphereGeometry
          args={[w / 2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.6]}
        />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    );
  }

  // Fallback: a simple box.
  return (
    <mesh position={[0, baseY, 0]} castShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
}

/**
 * Renders the avatar's face — two eyes and a mouth — on the +Z (front) face
 * of the head box. All positions and sizes are derived from the head's
 * world-space dimensions so the features scale correctly across every head
 * skin-tone variant (head1..head8 have slightly different sizes).
 *
 * Coordinate convention: the head box is centered at (0, headY, 0) with
 * half-extents (hw, hh, hd). The front face sits at z = +hd. We push the
 * facial features a hair in front of that face (z = hd + epsilon) so they
 * never z-fight with the head material.
 *
 * Eyes sit at roughly 1/3 and 2/3 of the head width, slightly above center.
 * The mouth sits below center, centered on x.
 */
const FACE_COLOR = "#1a1a2e";

function FaceFeatures({
  headSize,
  headY,
}: {
  headSize: [number, number, number];
  headY: number;
}) {
  const [hw, , hd] = headSize;

  // Eye geometry — small dark boxes, sized relative to head width.
  const eyeW = hw * 0.14;
  const eyeH = hw * 0.14;
  const eyeD = 0.02;
  // Eyes at 1/3 and 2/3 across the head width, slightly above center.
  const eyeX = hw * 0.22;
  const eyeY = headY + hw * 0.08;
  // Slightly in front of the head's front face to avoid z-fighting.
  const eyeZ = hd / 2 + eyeD / 2 + 0.001;

  // Mouth — a wider, flatter dark box below the eyes.
  const mouthW = hw * 0.32;
  const mouthH = hw * 0.06;
  const mouthD = 0.02;
  const mouthY = headY - hw * 0.18;
  const mouthZ = hd / 2 + mouthD / 2 + 0.001;

  return (
    <group>
      {/* Left eye (from the avatar's perspective — negative x on screen). */}
      <mesh position={[-eyeX, eyeY, eyeZ]} castShadow>
        <boxGeometry args={[eyeW, eyeH, eyeD]} />
        <meshStandardMaterial color={FACE_COLOR} roughness={0.5} />
      </mesh>
      {/* Right eye. */}
      <mesh position={[eyeX, eyeY, eyeZ]} castShadow>
        <boxGeometry args={[eyeW, eyeH, eyeD]} />
        <meshStandardMaterial color={FACE_COLOR} roughness={0.5} />
      </mesh>
      {/* Mouth. */}
      <mesh position={[0, mouthY, mouthZ]} castShadow>
        <boxGeometry args={[mouthW, mouthH, mouthD]} />
        <meshStandardMaterial color={FACE_COLOR} roughness={0.5} />
      </mesh>
    </group>
  );
}

function AvatarFigure({
  variants,
}: {
  variants: ReturnType<typeof getAvatarVariants>;
}) {
  // Convert variant sizes (head-relative units) to world units.
  const body: [number, number, number] = variants.body.size.map(
    (v) => v * SCALE,
  ) as [number, number, number];
  const head: [number, number, number] = variants.head.size.map(
    (v) => v * SCALE,
  ) as [number, number, number];
  const pants: [number, number, number] = variants.pants.size.map(
    (v) => v * SCALE,
  ) as [number, number, number];
  const shoes: [number, number, number] = variants.shoes.size.map(
    (v) => v * SCALE,
  ) as [number, number, number];

  // Vertical layout (y-up). The figure is centered around y=0.
  const shoeY = -2.0;
  const legY = shoeY + shoes[1] / 2 + pants[1] / 2;
  const bodyY = legY + pants[1] / 2 + body[1] / 2;
  const headY = bodyY + body[1] / 2 + head[1] / 2;
  const headTopY = headY + head[1] / 2;

  // Arms flank the body, slightly offset on x and a touch forward.
  const armW = body[0] * 0.28;
  const armH = body[1] * 0.85;
  const armD = body[2] * 0.7;
  const armX = body[0] / 2 + armW / 2 + 0.01;

  // Legs are split into two columns matching the pants width.
  const legW = pants[0];
  const legGap = 0.02;

  return (
    <group>
      {/* Shoes — two boxes side by side, length along z (front/back). */}
      <Part
        position={[-legW / 2 - legGap / 2, shoeY, 0]}
        size={[shoes[2], shoes[1], shoes[0]]}
        color={variants.shoes.color}
      />
      <Part
        position={[legW / 2 + legGap / 2, shoeY, 0]}
        size={[shoes[2], shoes[1], shoes[0]]}
        color={variants.shoes.color}
      />

      {/* Legs / pants — two boxes. */}
      <Part
        position={[-legW / 2 - legGap / 2, legY, 0]}
        size={[legW, pants[1], pants[2]]}
        color={variants.pants.color}
      />
      <Part
        position={[legW / 2 + legGap / 2, legY, 0]}
        size={[legW, pants[1], pants[2]]}
        color={variants.pants.color}
      />

      {/* Body / torso — single box, full depth. */}
      <Part position={[0, bodyY, 0]} size={body} color={variants.body.color} />

      {/* Arms — two boxes flanking the body. */}
      <Part
        position={[-armX, bodyY + body[1] * 0.05, 0]}
        size={[armW, armH, armD]}
        color={variants.body.color}
      />
      <Part
        position={[armX, bodyY + body[1] * 0.05, 0]}
        size={[armW, armH, armD]}
        color={variants.body.color}
      />

      {/* Head — single box. */}
      <Part position={[0, headY, 0]} size={head} color={variants.head.color} />

      {/* Face — eyes + mouth on the front (+Z) face of the head. */}
      <FaceFeatures headSize={head} headY={headY} />

      {/* Hair — shape depends on type. */}
      <HairMesh
        color={variants.hair.color}
        size={variants.hair.size}
        type={variants.hair.type ?? "top"}
        headTopY={headTopY}
        headSize={head}
      />

      {/* Headwear — shape depends on type. */}
      <HeadwearMesh
        color={variants.headwear.color}
        size={variants.headwear.size}
        type={variants.headwear.type ?? "none"}
        headTopY={headTopY}
      />
    </group>
  );
}

export default function AvatarPreview3D({
  avatarConfig,
}: AvatarPreview3DProps) {
  const variants = useMemo(
    () => getAvatarVariants(avatarConfig),
    [avatarConfig],
  );

  return (
    <div className="relative w-full h-full">
      <div className="avatar-3d-container w-full h-full aspect-square rounded-lg border-4 border-primary overflow-hidden">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, -0.2, 5.5], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: "100%", height: "100%", display: "block" }}
        >
          <color attach="background" args={["#f5e9f7"]} />
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[4, 6, 4]}
            intensity={1.1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-4, 3, -2]} intensity={0.3} />

          <Suspense fallback={null}>
            <AvatarFigure variants={variants} />
            <ContactShadows
              position={[0, -2.25, 0]}
              opacity={0.45}
              scale={6}
              blur={2.4}
              far={3}
            />
            <Environment preset="city" />
          </Suspense>

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.6}
            rotateSpeed={0.8}
            target={[0, -0.2, 0]}
          />
        </Canvas>
      </div>
    </div>
  );
}
