/**
 * ExportDemo - Demo panel for export feature
 */
import { Download, FileText, File } from 'lucide-react';

export function ExportDemo() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Export</h3>

      <p className="text-xs text-gray-600">
        Exportez votre document en PDF ou DOCX avec fidélité complète.
        Utilisez <kbd className="bg-gray-100 px-1 rounded">/export</kbd> dans l'éditeur.
      </p>

      {/* Export Formats */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Formats
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center gap-2 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            <FileText size={20} className="text-red-600" />
            <div className="text-left">
              <div className="text-sm font-medium text-red-700">PDF</div>
              <div className="text-xs text-red-500">Portrait/Paysage</div>
            </div>
          </button>
          <button className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <File size={20} className="text-blue-600" />
            <div className="text-left">
              <div className="text-sm font-medium text-blue-700">DOCX</div>
              <div className="text-xs text-blue-500">Microsoft Word</div>
            </div>
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Options PDF
        </h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
            <input type="checkbox" defaultChecked className="rounded" />
            <span>Inclure en-têtes/pieds de page</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
            <input type="checkbox" defaultChecked className="rounded" />
            <span>Numérotation des pages</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs">
            <input type="checkbox" className="rounded" />
            <span>Inclure les commentaires</span>
          </div>
        </div>
      </div>

      {/* Quick Export */}
      <button className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
        <Download size={16} />
        <span>Exporter maintenant</span>
      </button>
    </div>
  );
}

export default ExportDemo;
