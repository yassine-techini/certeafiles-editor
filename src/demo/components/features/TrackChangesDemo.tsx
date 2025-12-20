/**
 * TrackChangesDemo - Demo panel for track changes feature
 */

interface TrackChangesDemoProps {
  trackingEnabled: boolean;
  toggleTracking: () => void;
}

export function TrackChangesDemo({ trackingEnabled, toggleTracking }: TrackChangesDemoProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Suivi des Modifications</h3>

      {/* Toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="text-sm">Suivi actif</span>
        <button
          onClick={toggleTracking}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            trackingEnabled ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              trackingEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Légende
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 bg-green-50 border-l-4 border-green-500 rounded">
            <span className="text-green-700 text-xs">Insertion</span>
            <span className="text-xs text-gray-500">Texte ajouté</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-red-50 border-l-4 border-red-500 rounded">
            <span className="text-red-700 line-through text-xs">Suppression</span>
            <span className="text-xs text-gray-500">Texte supprimé</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Actions
        </h4>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">
            Accepter tout
          </button>
          <button className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
            Rejeter tout
          </button>
        </div>
      </div>

      <div className="p-3 bg-yellow-50 rounded-lg">
        <p className="text-xs text-yellow-700">
          <strong>Note :</strong> Le suivi des modifications enregistre toutes les
          insertions et suppressions pour révision ultérieure.
        </p>
      </div>
    </div>
  );
}

export default TrackChangesDemo;
