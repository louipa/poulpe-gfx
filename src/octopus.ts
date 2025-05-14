import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

type TentaculeControl = {
  bones: {
    bone: THREE.Object3D;
    restRotation: THREE.Euler;
    index: number;
  }[];
  phaseOffset: number;
};

class OctopusManager {
  private model: THREE.Object3D | null = null;
  private tentacules: TentaculeControl[] = [];
  private time: number = 0;
  private readonly speed: number = 0.2;

  constructor(scene: THREE.Scene) {
    this.loadModel(scene);
  }

  private loadModel(scene: THREE.Scene): void {
    const loader = new GLTFLoader();
    loader.load(
      "octopus.glb",
      (gltf) => {
        this.model = gltf.scene;
        scene.add(this.model);
        this.setupEyes();
        this.setupTentacles();
      },
      (progress) => {
        console.log(`${(progress.loaded / progress.total) * 100}% loaded`);
      },
      (error) => {
        console.error("Error loading model:", error);
      }
    );
  }

  private setupEyes(): void {
    if (!this.model) return;
    const eyeL = this.model.getObjectByName("EyeL");
    const eyeR = this.model.getObjectByName("EyeR");

    if (eyeL && eyeR) {
      [eyeL, eyeR].forEach((eye) => {
        const dir = new THREE.Vector3(0, 0, 1);
        eye.localToWorld(dir);
        dir.sub(eye.getWorldPosition(new THREE.Vector3())).normalize();
      });
    }
  }

  private setupTentacles(): void {
    if (!this.model) return;
    const object = this.model.getObjectByName("Armature");
    if (!object) {
      console.error("Object for bones not found");
      return;
    }

    const corpsBones = object.children.filter((child) =>
      child.name.startsWith("Corps")
    );
    const corps = corpsBones.map((child) => child.children[0]);

    corps.forEach((tentacule) => {
      const bones: THREE.Object3D[] = [];
      let queue: THREE.Object3D[] = [];
      let currentObject: THREE.Object3D | undefined = tentacule;

      while (currentObject !== undefined) {
        bones.push(currentObject);
        queue.push(...currentObject.children);
        currentObject = queue.shift() || undefined;
      }

      const phaseOffset = Math.random() * Math.PI * 4;

      this.tentacules.push({
        bones: bones.map((bone, index) => ({
          bone,
          restRotation: bone.rotation.clone(),
          index,
        })),
        phaseOffset,
      });
    });
  }

  public update(delta: number): void {
    this.time += delta * this.speed;
    this.updateTentacles();
    this.updateModelPosition();
  }

  private updateTentacles(): void {
    const waveSpeed = 3.5;
    const waveLength = 0.5;
    const amplitude = 0.2;

    this.tentacules.forEach(({ bones, phaseOffset }) => {
      bones.forEach(({ bone, restRotation, index }) => {
        const influenceX = (index + 1) / bones.length + 1;
        const influenceZ = (index * 2 + 1) / bones.length + 1;

        const waveX =
          amplitude *
          Math.sin(this.time * waveSpeed + phaseOffset - index * waveLength) *
          Math.pow(influenceX, 1.5);
        const waveZ =
          amplitude *
          Math.sin(this.time * waveSpeed + phaseOffset - index * waveLength) *
          Math.pow(influenceZ, 3);

        const maxRotationX = Math.PI / 5;
        const minRotationX = -Math.PI / 6;

        const clampedX = THREE.MathUtils.clamp(
          restRotation.x + waveX,
          minRotationX,
          maxRotationX
        );

        bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, clampedX, 0.2);
        const rotationZ = restRotation.z + 0.15 * Math.sin(waveZ) * influenceZ;
        bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, rotationZ, 0.2);
      });
    });
  }

  private updateModelPosition(): void {
    if (!this.model) return;
    const floatSpeed = 10;
    const floatAmplitude = 0.05;
    this.model.position.y =
      -0.1 + Math.sin(this.time * floatSpeed) * floatAmplitude;
  }

  public getTentaclePositions(): THREE.Vector3[] {
    if (!this.model) return [];

    const positions: THREE.Vector3[] = [];
    this.tentacules.forEach(({ bones }) => {
      bones.forEach(({ bone }) => {
        const position = new THREE.Vector3();
        bone.getWorldPosition(position);
        positions.push(position);
      });
    });
    return positions;
  }

  public getCollisionBox(): THREE.Box3 {
    if (!this.model) return new THREE.Box3();

    const box = new THREE.Box3().setFromObject(this.model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    size.multiplyScalar(0.5);
    box.setFromCenterAndSize(center, size);

    return box;
  }
}

export default OctopusManager;
