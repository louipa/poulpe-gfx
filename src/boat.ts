import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import ObstacleManager from "./obstacles";

export default class BoatManager {
  private boat: THREE.Group;
  private collisionBox: THREE.Box3;
  private water: Water;
  private scene: THREE.Scene;
  private velocity: THREE.Vector3;
  private buoyancy: number = 0;
  private obstacleManager: ObstacleManager;
  private currentTarget: THREE.Vector3 | null = null;
  private speed: number = 1.0;
  private targetReachedDistance: number = 0.1;
  private targetPosition: THREE.Vector3;
  private targetRotation: number;
  private moveLerpFactor: number = 0.05;
  private rotationLerpFactor: number = 0.1;

  constructor(
    scene: THREE.Scene,
    water: Water,
    obstacleManager: ObstacleManager
  ) {
    this.scene = scene;
    this.water = water;
    this.obstacleManager = obstacleManager;
    this.velocity = new THREE.Vector3();
    this.boat = new THREE.Group();
    this.collisionBox = new THREE.Box3();
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = 0;
    this.scene.add(this.boat);
    this.loadBoat();
  }

  private loadBoat(): void {
    const loader = new FBXLoader();
    loader.load(
      "ship.fbx",
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
        this.selectNewTarget();
      },
      (xhr) => {
        console.log("boat " + (xhr.loaded / xhr.total) * 100 + "% chargé");
      },
      (error) => {
        console.error("Erreur lors du chargement du modèle:", error);
      }
    );
  }

  private selectNewTarget(): void {
    const obstacles = this.obstacleManager.getObstacles().children;
    if (obstacles.length > 0) {
      const randomObstacle =
        obstacles[Math.floor(Math.random() * obstacles.length)];
      this.currentTarget = randomObstacle.position.clone();
    }
  }

  public update(delta: number): void {}

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
