import * as THREE from "three";

export default class AudioManager {
  private waterFlowingSound: THREE.Audio;
  private waterBubblesSound: THREE.Audio;
  private listener: THREE.AudioListener;
  private isUnderwater: boolean = false;
  private fadeDuration: number = 1.0;
  private fadeStartTime: number = 0;
  private isFading: boolean = false;

  constructor(camera: THREE.Camera) {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);

    this.waterFlowingSound = new THREE.Audio(this.listener);
    this.waterBubblesSound = new THREE.Audio(this.listener);

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load("water_flowing.mp3", (buffer) => {
      this.waterFlowingSound.setBuffer(buffer);
      this.waterFlowingSound.setLoop(true);
      this.waterFlowingSound.setVolume(0.5);
      this.waterFlowingSound.play();
    });

    audioLoader.load("water_bubbles.mp3", (buffer) => {
      this.waterBubblesSound.setBuffer(buffer);
      this.waterBubblesSound.setLoop(true);
      this.waterBubblesSound.setVolume(0);
      this.waterBubblesSound.play();
    });
  }

  public update(_delta: number): void {
    if (this.isFading) {
      const elapsedTime = (Date.now() - this.fadeStartTime) / 1000;
      const fadeProgress = Math.min(elapsedTime / this.fadeDuration, 1);

      const volumeFlowing = this.isUnderwater
        ? 0.5 * (1 - fadeProgress)
        : 0.5 * fadeProgress;
      const volumeBubbles = this.isUnderwater
        ? 0.5 * fadeProgress
        : 0.5 * (1 - fadeProgress);

      this.waterFlowingSound.setVolume(volumeFlowing);
      this.waterBubblesSound.setVolume(volumeBubbles);

      if (fadeProgress >= 1) {
        this.isFading = false;
      }
    }
  }

  public setUnderwater(isUnderwater: boolean): void {
    if (this.isUnderwater !== isUnderwater) {
      this.isUnderwater = isUnderwater;
      this.isFading = true;
      this.fadeStartTime = Date.now();
    }
  }
}
