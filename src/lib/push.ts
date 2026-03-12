
export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('Push notifications are not supported in this browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if we already have a subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      const response = await fetch('/api/push/public-key');
      const data = await response.json();
      
      if (!response.ok || !data.publicKey) {
        throw new Error(data.error || "La clé publique VAPID n'a pas été trouvée sur le serveur. Vérifiez vos variables d'environnement Vercel.");
      }
      
      const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);
      console.log('Requesting subscription with public key:', data.publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      console.log('Push subscription object:', subscription);
    }

    console.log('Sending subscription to server...');
    const subResponse = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    if (!subResponse.ok) {
      const errorData = await subResponse.json();
      throw new Error(`Server failed to save subscription: ${errorData.error}`);
    }

    console.log('Successfully subscribed to push notifications');
    return true;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    alert(`Erreur d'abonnement : ${error instanceof Error ? error.message : 'Inconnue'}`);
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
