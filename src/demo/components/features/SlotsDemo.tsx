/**
 * SlotsDemo - Demo panel for dynamic slots feature
 */
import { useSlotStore } from '../../../stores/slotStore';

const SLOT_TYPES = [
  { type: 'text', label: 'Texte', color: 'blue' },
  { type: 'date', label: 'Date', color: 'green' },
  { type: 'number', label: 'Nombre', color: 'purple' },
  { type: 'select', label: 'Liste', color: 'orange' },
  { type: 'signature', label: 'Signature', color: 'red' },
];

export function SlotsDemo() {
  const { slots } = useSlotStore();

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Slots Dynamiques</h3>

      <p className="text-xs text-gray-600">
        Les slots sont des champs dynamiques qui peuvent être remplis automatiquement
        ou manuellement. Utilisez <kbd className="bg-gray-100 px-1 rounded">+</kbd> pour
        en insérer.
      </p>

      {/* Slot Types */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Types de Slots
        </h4>
        <div className="flex flex-wrap gap-1">
          {SLOT_TYPES.map((slotType) => (
            <span
              key={slotType.type}
              className={`px-2 py-0.5 rounded text-xs bg-${slotType.color}-100 text-${slotType.color}-700`}
            >
              {slotType.label}
            </span>
          ))}
        </div>
      </div>

      {/* Active Slots */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Slots Actifs ({slots.size})
        </h4>
        {slots.size === 0 ? (
          <div className="text-xs text-gray-400 italic p-2 bg-gray-50 rounded">
            Aucun slot créé
          </div>
        ) : (
          <div className="space-y-1">
            {Array.from(slots.values()).map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
              >
                <span className="font-medium">{slot.metadata.label || slot.type}</span>
                <span
                  className={`px-1.5 py-0.5 rounded ${
                    slot.isFilled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {slot.isFilled ? 'rempli' : 'vide'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Astuce :</strong> Les slots peuvent être liés à des sources de données
          externes pour un remplissage automatique.
        </p>
      </div>
    </div>
  );
}

export default SlotsDemo;
