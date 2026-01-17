
class AudioManager {
  private volume: number = 0.5;
  private muted: boolean = false;
  private sounds: { [key: string]: HTMLAudioElement } = {};

  constructor() {
    // Using placeholder synth sounds if local assets are missing
    this.sounds.tick = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    this.sounds.win = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    this.sounds.spin = new Audio('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3');
    this.sounds.cheer = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'); // Crowd cheering sound
    this.sounds.spin.loop = true;
  }

  setVolume(v: number) {
    this.volume = v;
    Object.values(this.sounds).forEach(s => s.volume = v);
  }

  toggleMute() {
    this.muted = !this.muted;
    Object.values(this.sounds).forEach(s => s.muted = this.muted);
    return this.muted;
  }

  play(name: string) {
    const sound = this.sounds[name];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {}); // Browser might block until user interact
    }
  }

  stop(name: string) {
    const sound = this.sounds[name];
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }
}

export const audioManager = new AudioManager();
