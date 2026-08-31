interface ServiceWorkerRegistration {
  pushManager: PushManager;
}

interface PushManager {
  subscribe(options: { userVisibleOnly: boolean; applicationServerKey?: BufferSource }): Promise<PushSubscription>;
  getSubscription(): Promise<PushSubscription | null>;
}
