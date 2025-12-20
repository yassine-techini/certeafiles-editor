/**
 * ShortcutsDemo - Demo panel for keyboard shortcuts
 */

const SHORTCUTS = [
  { category: 'Menus Contextuels', items: [
    { key: '/', description: 'Ouvrir le menu slash (commandes)' },
    { key: '@', description: 'Mentions (utilisateurs, documents)' },
    { key: '+', description: 'Insertion rapide' },
  ]},
  { category: 'Formatage', items: [
    { key: 'Ctrl+B', description: 'Gras' },
    { key: 'Ctrl+I', description: 'Italique' },
    { key: 'Ctrl+U', description: 'Souligné' },
    { key: 'Ctrl+Shift+X', description: 'Barré' },
  ]},
  { category: 'Actions', items: [
    { key: 'Ctrl+Z', description: 'Annuler' },
    { key: 'Ctrl+Y', description: 'Rétablir' },
    { key: 'Ctrl+S', description: 'Sauvegarder' },
  ]},
];

export function ShortcutsDemo() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Raccourcis Clavier</h3>

      {SHORTCUTS.map((group) => (
        <div key={group.category} className="space-y-2">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {group.category}
          </h4>
          <div className="space-y-1">
            {group.items.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-mono shadow-sm">
                  {shortcut.key}
                </kbd>
                <span className="text-xs text-gray-600">{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Astuce :</strong> Tapez <kbd className="bg-white px-1 rounded">/</kbd> dans
          l'éditeur pour voir toutes les commandes disponibles.
        </p>
      </div>
    </div>
  );
}

export default ShortcutsDemo;
