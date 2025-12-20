/**
 * CollaborationDemo - Demo panel for collaboration feature
 */
import { useState } from 'react';
import type { UseCollaborationReturn } from '../../../hooks/useCollaboration';

interface CollaborationDemoProps {
  collaboration: UseCollaborationReturn;
}

export function CollaborationDemo({ collaboration }: CollaborationDemoProps) {
  const { state, currentUser, otherUsers, isConnected, isSynced, isOffline, setUserName } = collaboration;
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(currentUser.name);

  const handleSaveName = () => {
    setUserName(tempName);
    setEditingName(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Collaboration Temps Réel</h3>

      <p className="text-xs text-gray-600">
        Travaillez à plusieurs sur le même document avec synchronisation en temps réel.
      </p>

      {/* Connection Status */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-xs font-medium text-gray-500 mb-2">STATUT DE CONNEXION</div>
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              isOffline
                ? 'bg-gray-400'
                : isConnected
                  ? 'bg-green-500'
                  : 'bg-yellow-500 animate-pulse'
            }`}
          />
          <span className="text-sm font-medium">
            {isOffline ? 'Hors ligne' : isConnected ? 'Connecté' : 'Connexion...'}
          </span>
          {isConnected && (
            <span className="text-xs text-gray-500">
              {isSynced ? '(synchronisé)' : '(synchronisation...)'}
            </span>
          )}
        </div>
      </div>

      {/* Current User */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="text-xs font-medium text-blue-600 mb-2">VOUS</div>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: currentUser.color }}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          {editingName ? (
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border rounded"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="flex-1">
              <div className="font-medium">{currentUser.name}</div>
              <button
                onClick={() => setEditingName(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                Modifier le nom
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connected Users */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500">
          COLLABORATEURS ({otherUsers.length})
        </div>
        {otherUsers.length === 0 ? (
          <div className="text-xs text-gray-400 italic p-2 bg-gray-50 rounded">
            Aucun autre utilisateur connecté
          </div>
        ) : (
          <div className="space-y-2">
            {otherUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm">{user.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500">FONCTIONNALITÉS</div>
        <div className="space-y-1">
          {[
            'Édition simultanée (Yjs/CRDT)',
            'Curseurs des collaborateurs',
            'Indicateurs de présence',
            'Persistance hors ligne (IndexedDB)',
            'Reconnexion automatique',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
              <span className="text-green-600">✓</span>
              {feature}
            </div>
          ))}
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded text-xs">
            <span className="text-orange-600">☁</span>
            Cloudflare Durable Objects
          </div>
        </div>
      </div>

      {/* Technical Info */}
      <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
        <div className="text-gray-500 mb-1"># Room Info</div>
        <div>roomId: "{state.status === 'connected' ? 'certeafiles-demo' : '...'}"</div>
        <div>status: "{state.status}"</div>
        <div>users: {otherUsers.length + 1}</div>
        <div>synced: {isSynced ? 'true' : 'false'}</div>
      </div>
    </div>
  );
}

export default CollaborationDemo;
