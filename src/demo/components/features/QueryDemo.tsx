/**
 * QueryDemo - Demo panel for query builder feature
 */

export function QueryDemo() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Query Builder</h3>

      <p className="text-xs text-gray-600">
        Créez des requêtes SQL visuellement.
        Utilisez <kbd className="bg-gray-100 px-1 rounded">/query</kbd> pour ouvrir.
      </p>

      {/* Features */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Fonctionnalités
        </h4>
        <div className="space-y-1">
          {[
            'Construction visuelle de conditions',
            'Opérateurs AND/OR',
            'Groupes imbriqués',
            'Prévisualisation SQL',
            'Sauvegarde des requêtes',
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
              <span className="text-green-600">✓</span>
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Field Types */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Types de Champs
        </h4>
        <div className="flex flex-wrap gap-1">
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">string</span>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">number</span>
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">date</span>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">boolean</span>
          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">enum</span>
        </div>
      </div>

      {/* Example SQL */}
      <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
        <pre>{`SELECT *
FROM documents
WHERE status = 'published'
ORDER BY created_at DESC`}</pre>
      </div>
    </div>
  );
}

export default QueryDemo;
