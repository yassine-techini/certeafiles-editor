/**
 * DemoHeader - Application header for the demo
 */
import { Link } from 'react-router-dom';
import { FileText, RotateCw, Home, ChevronRight } from 'lucide-react';
import { ZoomControl } from '../../components/Editor/ZoomControl';
import type { Orientation } from '../../utils/a4-constants';

interface DemoHeaderProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  orientation: Orientation;
  onOrientationToggle: () => void;
  wordCount: number;
  slotsCount: number;
  commentsCount: number;
  trackingEnabled: boolean;
}

export function DemoHeader({
  zoom,
  onZoomChange,
  orientation,
  onOrientationToggle,
  wordCount,
  slotsCount,
  commentsCount,
  trackingEnabled,
}: DemoHeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0">
      {/* Home Link */}
      <Link
        to="/"
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Retour à l'accueil"
      >
        <Home className="w-5 h-5 text-gray-600" />
      </Link>

      {/* Logo & Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Link to="/" className="text-gray-500 hover:text-gray-700">
            CerteaFiles
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-800">Éditeur</span>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">
          Demo
        </span>
      </div>

      {/* Orientation Toggle */}
      <button
        onClick={onOrientationToggle}
        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        title="Changer l'orientation"
      >
        <RotateCw size={14} />
        <span className="hidden sm:inline">
          {orientation === 'portrait' ? 'Portrait' : 'Paysage'}
        </span>
      </button>

      {/* Zoom Control */}
      <div className="flex items-center bg-gray-100 rounded-lg">
        <ZoomControl
          zoom={zoom}
          onZoomChange={onZoomChange}
          showPercentage={true}
          showSlider={true}
        />
      </div>

      {/* Stats */}
      <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
        <span>{wordCount} mots</span>
        <span>Slots: {slotsCount}</span>
        <span>Commentaires: {commentsCount}</span>
        <span
          className={`px-2 py-0.5 rounded ${
            trackingEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100'
          }`}
        >
          Track Changes: {trackingEnabled ? 'ON' : 'OFF'}
        </span>
      </div>
    </header>
  );
}

export default DemoHeader;
