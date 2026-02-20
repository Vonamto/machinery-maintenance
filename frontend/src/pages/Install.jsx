// frontend/src/pages/Install.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function InstallPage() {
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    // Detect iOS
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    // Capture Android install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
    });
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-6 py-10">

      {/* Logo */}
      <img src="/logo.png" alt="App Logo" className="h-20 w-auto mb-6" />

      {/* Title */}
      <h1 className="text-2xl font-bold text-cyan-400 mb-2 text-center">
        Install the App
      </h1>
      <p className="text-gray-400 text-sm text-center mb-8">
        Add this app to your home screen for quick access anytime.
      </p>

      {/* Already installed */}
      {installed && (
        <div className="bg-green-700 rounded-xl px-6 py-4 text-center mb-6">
          <p className="text-lg font-semibold">✅ App already installed!</p>
          <p className="text-sm text-green-200 mt-1">You can close this page and open the app from your home screen.</p>
        </div>
      )}

      {/* Android install button */}
      {!installed && installPrompt && (
        <button
          onClick={handleInstall}
          className="w-full max-w-sm bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-6 rounded-xl text-lg transition mb-4"
        >
          📲 Tap to Install
        </button>
      )}

      {/* iOS instructions */}
      {!installed && isIOS && (
        <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-xl p-5 text-sm text-gray-300 mb-4">
          <p className="font-semibold text-white mb-3">📱 To install on iPhone / iPad:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Tap the <strong className="text-cyan-400">Share</strong> button at the bottom of Safari</li>
            <li>Scroll down and tap <strong className="text-cyan-400">"Add to Home Screen"</strong></li>
            <li>Tap <strong className="text-cyan-400">"Add"</strong> in the top right corner</li>
          </ol>
        </div>
      )}

      {/* Fallback for desktop or unsupported */}
      {!installed && !installPrompt && !isIOS && (
        <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-xl p-5 text-sm text-gray-300 mb-4 text-center">
          <p>Open this link on your <strong className="text-cyan-400">Android or iPhone</strong> to install the app.</p>
        </div>
      )}

      {/* Go to app button */}
      <button
        onClick={() => navigate("/login")}
        className="w-full max-w-sm mt-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl text-base transition"
      >
        Go to App →
      </button>
    </div>
  );
}
