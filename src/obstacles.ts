import * as THREE from "three";

export default class ObstacleManager {
  private scene: THREE.Scene;
  private obstacles: THREE.Group;
  private collisionBoxes: THREE.Box3[];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.obstacles = new THREE.Group();
    this.collisionBoxes = [];
    this.scene.add(this.obstacles);
    this.createObstacles();
  }

  public setVisible(visible: boolean): void {
    this.obstacles.visible = visible;
  }

  private createObstacles(): void {
    const islandGeometry = new THREE.CylinderGeometry(10, 12, 2, 32);
    const islandMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.7,
      metalness: 0.1,
      flatShading: true,
    });
    const island = new THREE.Mesh(islandGeometry, islandMaterial);
    island.position.set(20, 0, 20);
    island.receiveShadow = true;
    island.castShadow = true;
    this.obstacles.add(island);
    this.collisionBoxes.push(new THREE.Box3().setFromObject(island));

    const dockGeometry = new THREE.BoxGeometry(15, 0.5, 5);
    const dockMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.6,
      metalness: 0.1,
    });
    const dock = new THREE.Mesh(dockGeometry, dockMaterial);
    dock.position.set(-15, 0, -15);
    dock.receiveShadow = true;
    dock.castShadow = true;
    this.obstacles.add(dock);
    this.collisionBoxes.push(new THREE.Box3().setFromObject(dock));

    for (let i = 0; i < 5; i++) {
      const rockGeometry = new THREE.DodecahedronGeometry(2, 0);
      const rockMaterial = new THREE.MeshStandardMaterial({
        color: 0x9e9e9e,
        roughness: 0.8,
        metalness: 0.2,
        flatShading: true,
      });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);

      let positionFound = false;
      let attempts = 0;
      const maxAttempts = 50;

      while (!positionFound && attempts < maxAttempts) {
        const testPosition = new THREE.Vector3(
          Math.random() * 40 - 20,
          0,
          Math.random() * 40 - 20
        );
        rock.position.copy(testPosition);
        const testBox = new THREE.Box3().setFromObject(rock);

        let hasCollision = false;
        for (const box of this.collisionBoxes) {
          if (testBox.intersectsBox(box)) {
            hasCollision = true;
            break;
          }
        }

        if (!hasCollision) {
          positionFound = true;
        }
        attempts++;
      }

      if (positionFound) {
        rock.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        rock.receiveShadow = true;
        rock.castShadow = true;
        this.obstacles.add(rock);
        this.collisionBoxes.push(new THREE.Box3().setFromObject(rock));
      }
    }

    const obstacleLight = new THREE.PointLight(0xffffff, 1, 50);
    obstacleLight.position.set(0, 10, 0);
    this.obstacles.add(obstacleLight);
  }

  public checkCollision(objectBox: THREE.Box3): boolean {
    for (const box of this.collisionBoxes) {
      if (box.intersectsBox(objectBox)) {
        return true;
      }
    }
    return false;
  }

  public update(_delta: number): void {
    this.collisionBoxes.forEach((box, index) => {
      const obstacle = this.obstacles.children[index];
      box.setFromObject(obstacle);
    });
  }

  public getObstacles(): THREE.Group {
    return this.obstacles;
  }
}
