import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

export default class FishManager {
  private material: THREE.MeshStandardMaterial;
  private gravity: number = 9.8;
  private velocities: THREE.Vector3[] = [];
  private fishes: THREE.Group[] = [];
  private rotations: THREE.Euler[] = [];
  private waterLevel: number = 0.0;
  private splashForce: number = 5.0;
  private attractionForce: number = 2.0;
  private maxDistance: number = 25.0;
  private groupCohesion: number = 0.2;
  private groupSeparation: number = 0.4;
  private groupAlignment: number = 0.1;
  private groupRadius: number = 3.0;
  private separationRadius: number = 1.0;
  private groupTimer: number = 0;
  private groupDuration: number = 3.0;
  private isGrouped: boolean = true;
  private randomForce: number = 0.4;
  private jumpProbability: number = 0.02;
  private diveProbability: number = 0.01;
  private bounds: { min: THREE.Vector3; max: THREE.Vector3 } = {
    min: new THREE.Vector3(-10, -1, -10),
    max: new THREE.Vector3(10, 4, 10),
  };
  private scene: THREE.Scene;
  private fishModel: THREE.Group | null = null;
  private octopusBox: THREE.Box3 | null = null;
  private fishBoxes: THREE.Box3[] = [];
  private projectionForce: number = 15.0;

  constructor(scene: THREE.Scene, envMap: THREE.Texture) {
    this.scene = scene;
    this.material = new THREE.MeshStandardMaterial({
      color: 0x4a90e2,
      metalness: 0.1,
      roughness: 0.2,
      envMap: envMap,
      envMapIntensity: 1.0,
    });

    this.loadFishModel();

    window.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        if (this.fishes.length === 0) {
          this.createFishes();
        } else {
          this.deleteFishes();
        }
      }
    });
  }

  private deleteFishes(): void {
    this.fishes.forEach((fish) => {
      this.scene.remove(fish);
    });
    this.fishes = [];
  }

  private loadFishModel(): void {
    const loader = new GLTFLoader();
    loader.load(
      "fish.glb",
      (glb) => {
        glb.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const newMaterial = new THREE.MeshStandardMaterial({
              color: 0x4a90e2,
              metalness: 0.3,
              roughness: 0.7,
              envMap: this.material.envMap,
              envMapIntensity: this.material.envMapIntensity,
            });
            if (child.material) {
              const originalMaterial = child.material;
              if (originalMaterial.map) newMaterial.map = originalMaterial.map;
              if (originalMaterial.normalMap)
                newMaterial.normalMap = originalMaterial.normalMap;
              if (originalMaterial.aoMap)
                newMaterial.aoMap = originalMaterial.aoMap;
              if (originalMaterial.roughnessMap)
                newMaterial.roughnessMap = originalMaterial.roughnessMap;
              if (originalMaterial.metalnessMap)
                newMaterial.metalnessMap = originalMaterial.metalnessMap;
            }

            child.material = newMaterial;
          }
        });

        this.fishModel = glb.scene;
      },
      (xhr) => {
        console.log("fish " + (xhr.loaded / xhr.total) * 100 + "% chargé");
      },
      (error) => {
        console.error("Erreur lors du chargement du modèle:", error);
      }
    );
  }

  private createFishes(): void {
    if (!this.fishModel) return;

    for (let i = 0; i < 50; i++) {
      const fish = this.fishModel.clone();
      const scale = 0.05;
      fish.scale.set(scale, scale, scale);
      fish.position.set(
        (Math.random() - 0.5) * 10,
        -0.2 + Math.random() * 0.5,
        (Math.random() - 0.5) * 10
      );

      this.fishes.push(fish);
      this.velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          0,
          (Math.random() - 0.5) * 1.5
        )
      );
      this.rotations.push(new THREE.Euler());
      this.fishBoxes.push(new THREE.Box3().setFromObject(fish));
      this.scene.add(fish);
    }
  }

  public update(delta: number, tentaclePositions: THREE.Vector3[]): void {
    if (this.fishes.length === 0) return;

    this.fishes.forEach((fish, index) => {
      this.fishBoxes[index].setFromObject(fish);
    });

    if (this.octopusBox) {
      this.fishes.forEach((fish, index) => {
        if (this.fishBoxes[index].intersectsBox(this.octopusBox!)) {
          const fishPos = fish.position.clone();
          const octopusPos = this.octopusBox!.getCenter(new THREE.Vector3());
          const direction = fishPos.sub(octopusPos).normalize();

          this.velocities[index].set(
            direction.x * this.projectionForce,
            Math.abs(direction.y) * this.projectionForce + 2.0,
            direction.z * this.projectionForce
          );

          this.rotations[index].x += (Math.random() - 0.5) * 0.3;
          this.rotations[index].z += (Math.random() - 0.5) * 0.3;
        }
      });
    }

    this.groupTimer += delta;
    if (this.groupTimer > this.groupDuration) {
      this.isGrouped = !this.isGrouped;
      this.groupTimer = 0;
    }

    this.fishes.forEach((fish, index) => {
      this.velocities[index].y -= this.gravity * delta * 0.8;

      const groupForce = new THREE.Vector3();
      if (this.isGrouped) {
        const centerOfMass = new THREE.Vector3();
        let neighborCount = 0;

        this.fishes.forEach((otherFish, otherIndex) => {
          if (index !== otherIndex) {
            const distance = fish.position.distanceTo(otherFish.position);
            if (distance < this.groupRadius) {
              centerOfMass.add(otherFish.position);
              neighborCount++;
            }
          }
        });

        if (neighborCount > 0) {
          centerOfMass.divideScalar(neighborCount);
          const cohesionForce = centerOfMass
            .sub(fish.position)
            .multiplyScalar(this.groupCohesion);
          groupForce.add(cohesionForce);
        }

        this.fishes.forEach((otherFish, otherIndex) => {
          if (index !== otherIndex) {
            const distance = fish.position.distanceTo(otherFish.position);
            if (distance < this.separationRadius) {
              const separationForce = fish.position
                .clone()
                .sub(otherFish.position)
                .normalize()
                .multiplyScalar(this.groupSeparation / distance);
              groupForce.add(separationForce);
            }
          }
        });

        const averageVelocity = new THREE.Vector3();
        let velocityCount = 0;

        this.fishes.forEach((otherFish, otherIndex) => {
          if (index !== otherIndex) {
            const distance = fish.position.distanceTo(otherFish.position);
            if (distance < this.groupRadius) {
              averageVelocity.add(this.velocities[otherIndex]);
              velocityCount++;
            }
          }
        });

        if (velocityCount > 0) {
          averageVelocity.divideScalar(velocityCount);
          const alignmentForce = averageVelocity
            .sub(this.velocities[index])
            .multiplyScalar(this.groupAlignment);
          groupForce.add(alignmentForce);
        }
      }

      const randomDirection = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();
      groupForce.add(randomDirection.multiplyScalar(this.randomForce));

      if (fish.position.y <= this.waterLevel + 0.1) {
        if (Math.random() < this.jumpProbability) {
          const jumpForce = this.splashForce * (0.5 + Math.random() * 0.3);
          const horizontalForce = (Math.random() - 0.5) * 2;
          this.velocities[index].set(
            horizontalForce,
            jumpForce,
            (Math.random() - 0.5) * 2
          );
        } else if (Math.random() < this.diveProbability) {
          this.velocities[index].y = -this.splashForce * 0.3;
        }
      }

      if (fish.position.y > this.waterLevel) {
        this.velocities[index].multiplyScalar(0.98);
      }

      if (fish.position.x < this.bounds.min.x) {
        groupForce.add(new THREE.Vector3(1, 0, 0).multiplyScalar(2));
      } else if (fish.position.x > this.bounds.max.x) {
        groupForce.add(new THREE.Vector3(-1, 0, 0).multiplyScalar(2));
      }
      if (fish.position.z < this.bounds.min.z) {
        groupForce.add(new THREE.Vector3(0, 0, 1).multiplyScalar(2));
      } else if (fish.position.z > this.bounds.max.z) {
        groupForce.add(new THREE.Vector3(0, 0, -1).multiplyScalar(2));
      }
      if (fish.position.y < this.bounds.min.y) {
        groupForce.add(new THREE.Vector3(0, 1, 0).multiplyScalar(2));
      } else if (fish.position.y > this.bounds.max.y) {
        groupForce.add(new THREE.Vector3(0, -1, 0).multiplyScalar(2));
      }

      const attraction = new THREE.Vector3();
      tentaclePositions.forEach((tentaclePos) => {
        const direction = new THREE.Vector3().subVectors(
          tentaclePos,
          fish.position
        );
        const distance = direction.length();

        if (distance > this.maxDistance) {
          const force =
            (this.attractionForce * (distance - this.maxDistance)) /
            this.maxDistance;
          direction.normalize().multiplyScalar(force * delta);
          attraction.add(direction);
        }
      });

      this.velocities[index].add(attraction);
      this.velocities[index].add(groupForce.multiplyScalar(delta));

      fish.position.add(this.velocities[index].clone().multiplyScalar(delta));

      const direction = this.velocities[index].clone().normalize();
      const targetRotation = new THREE.Euler(
        Math.atan2(
          direction.y,
          Math.sqrt(direction.x * direction.x + direction.z * direction.z)
        ),
        Math.atan2(direction.x, direction.z),
        0
      );

      this.rotations[index].y +=
        (targetRotation.y - this.rotations[index].y) * 0.1;
      this.rotations[index].x = THREE.MathUtils.lerp(
        this.rotations[index].x,
        targetRotation.x,
        0.05
      );

      fish.rotation.copy(this.rotations[index]);

      const time = performance.now() * 0.001;
      fish.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.name.toLowerCase().includes("fin")) {
            const finAngle = Math.sin(time * 5 + index) * 0.3;
            child.rotation.x = finAngle;
          } else if (child.name.toLowerCase().includes("tail")) {
            const tailAngle = Math.sin(time * 3 + index) * 0.2;
            child.rotation.z = tailAngle;
          }
        }
      });

      if (fish.position.y < this.waterLevel) {
        this.velocities[index].y = Math.max(
          this.velocities[index].y,
          -this.splashForce * 0.2
        );
      }
    });
  }

  public handleCollision(fishIndex: number, normal: THREE.Vector3): void {
    const velocity = this.velocities[fishIndex];
    const dot = velocity.dot(normal);
    velocity.sub(normal.multiplyScalar(2 * dot * 0.01));

    this.rotations[fishIndex].x += (Math.random() - 0.5) * 0.5;
    this.rotations[fishIndex].z += (Math.random() - 0.5) * 0.5;

    velocity.multiplyScalar(0.1);
  }

  public setVisible(visible: boolean): void {
    this.fishes.forEach((fish) => {
      fish.visible = visible;
    });
  }

  public setOctopusBox(box: THREE.Box3): void {
    this.octopusBox = box;
  }
}
