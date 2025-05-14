import { Water } from "three/examples/jsm/Addons.js";
import * as THREE from "three";
import { TextureLoader, RepeatWrapping } from "three";

class WaterManager {
  private water: Water;
  private time: number = 0;

  constructor(scene: THREE.Scene) {
    const waterGeometry = new THREE.PlaneGeometry(1000, 1000, 512, 512);
    this.water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new TextureLoader().load("waternormals.jpg", (texture) => {
        texture.wrapS = texture.wrapT = RepeatWrapping;
      }),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x545aa8,
      distortionScale: 1.0,
      fog: scene.fog !== undefined,
      alpha: 0.9,
      time: 0,
    });
    this.water.rotation.x = -Math.PI / 2;
    scene.add(this.water);
  }

  public update(delta: number): void {
    this.time += delta * 0.5;
    this.water.material.uniforms["time"].value = this.time;
  }

  public getWater(): Water {
    return this.water;
  }
}
export default WaterManager;
