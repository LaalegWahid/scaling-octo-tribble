let releasePromise: Promise<void> = Promise.resolve();

export function setCameraRelease(p: Promise<void>) {
  releasePromise = p;
}

export function waitForCamera(): Promise<void> {
  return releasePromise;
}