"use client";

class AudioManager {
  private context: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private activeSources = new Set<AudioBufferSourceNode>();
  private loadPromises = new Map<string, Promise<AudioBuffer>>();

  constructor() {
    if (typeof window !== "undefined") {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.context = new AudioContextClass();
      }
    }
  }

  public getContext(): AudioContext | null {
    return this.context;
  }

  public async resume(): Promise<void> {
    if (!this.context) return;
    if (this.context.state === "suspended") {
      try {
        await this.context.resume();
      } catch (error) {
        console.error("Failed to resume AudioContext:", error);
      }
    }
  }

  public async load(url: string): Promise<AudioBuffer> {
    if (!this.context) {
      // Return a dummy buffer or throw? Throwing is better to signal failure.
      // But for robustness, maybe we just log and return nothing?
      // Let's throw so the caller knows.
      throw new Error("AudioContext not supported");
    }

    const normalizedUrl = url.trim();
    if (this.buffers.has(normalizedUrl)) {
      return this.buffers.get(normalizedUrl)!;
    }

    if (this.loadPromises.has(normalizedUrl)) {
      return this.loadPromises.get(normalizedUrl)!;
    }

    const promise = (async () => {
      try {
        const response = await fetch(normalizedUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        // decodeAudioData can be callback-based in old browsers, but Promise-based in modern.
        // We assume modern environment (Next.js targets).
        const audioBuffer = await this.context!.decodeAudioData(arrayBuffer);
        this.buffers.set(normalizedUrl, audioBuffer);
        return audioBuffer;
      } catch (error) {
        console.error(`Failed to load audio from ${normalizedUrl}:`, error);
        throw error;
      } finally {
        this.loadPromises.delete(normalizedUrl);
      }
    })();

    this.loadPromises.set(normalizedUrl, promise);
    return promise;
  }

  public preload(urls: string[]): void {
    urls.forEach((url) => {
      // Trigger load without waiting
      this.load(url).catch(() => {
        // Suppress errors for preloading
      });
    });
  }

  public play(
    url: string,
    options: {
      volume?: number;
      loop?: boolean;
      onEnded?: () => void;
    } = {}
  ): AudioBufferSourceNode | null {
    if (!this.context) return null;

    // Ensure context is running (best effort)
    if (this.context.state === "suspended") {
      this.context.resume().catch(() => {});
    }

    const normalizedUrl = url.trim();
    const buffer = this.buffers.get(normalizedUrl);

    if (!buffer) {
      // If not loaded, load and play later
      this.load(normalizedUrl)
        .then(() => {
          // Check if we should still play? Maybe the user navigated away.
          // For simple SFX, it's usually fine to play when loaded.
          this.play(normalizedUrl, options);
        })
        .catch(() => {});
      return null;
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop ?? false;

    // Create gain node for volume control
    const gainNode = this.context.createGain();
    gainNode.gain.value = options.volume ?? 1.0;

    source.connect(gainNode);
    gainNode.connect(this.context.destination);

    source.onended = () => {
      this.activeSources.delete(source);
      if (options.onEnded) {
        options.onEnded();
      }
    };

    source.start(0);
    this.activeSources.add(source);

    return source;
  }

  public stop(source: AudioBufferSourceNode | null): void {
    if (!source) return;
    try {
      source.stop();
    } catch {
      // Ignore if already stopped
    }
    this.activeSources.delete(source);
  }

  public stopAll(): void {
    this.activeSources.forEach((source) => {
      this.stop(source);
    });
    this.activeSources.clear();
  }
}

// Singleton instance
export const audioManager = new AudioManager();
