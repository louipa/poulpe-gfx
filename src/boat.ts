import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

export default class BoatManager {
  private boat: THREE.Group;
  private collisionBox: THREE.Box3;
  private scene: THREE.Scene;
  private targetPosition: THREE.Vector3;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.boat = new THREE.Group();
    this.collisionBox = new THREE.Box3();
    this.targetPosition = new THREE.Vector3();
    this.scene.add(this.boat);
    this.loadBoat();
  }

  private loadBoat(): void {
    const loader = new FBXLoader();
    loader.load(
      "/poulpe-gfx/ship.fbx",
      (fbx) => {
        const scale = 0.003;
        fbx.scale.set(scale, scale, scale);

        fbx.position.set(10, 0, 0);
        this.targetPosition.copy(fbx.position);

        fbx.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              const originalMaterial = child.material;
              if (originalMaterial instanceof THREE.MeshStandardMaterial) {
                originalMaterial.roughness = 0.7;
                originalMaterial.metalness = 0.3;
              } else if (originalMaterial instanceof THREE.MeshPhongMaterial) {
                const newMaterial = new THREE.MeshStandardMaterial({
                  color: originalMaterial.color,
                  map: originalMaterial.map,
                  normalMap: originalMaterial.normalMap,
                  roughness: 0.7,
                  metalness: 0.3,
                });
                child.material = newMaterial;
              }
            }
          }
        });

        this.boat.add(fbx);
        this.collisionBox.setFromObject(this.boat);
      },
      (xhr) => {
        console.log("boat " + (xhr.loaded / xhr.total) * 100 + "% chargé");
      },
      (error) => {
        console.error("Erreur lors du chargement du modèle:", error);
      }
    );
  }

  public update(_delta: number): void {}

  public getBoat(): THREE.Group {
    return this.boat;
  }

  public getCollisionBox(): THREE.Box3 {
    return this.collisionBox;
  }

  public setVisible(visible: boolean): void {
    this.boat.visible = visible;
  }
}
