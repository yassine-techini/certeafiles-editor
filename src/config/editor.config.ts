import type { EditorThemeClasses } from 'lexical';
import { editorTheme } from '../theme';
import { A4_CONSTANTS } from '../utils/a4-constants';

export interface EditorConfiguration {
  namespace: string;
  theme: EditorThemeClasses;
  editable: boolean;
  a4: {
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    zoom: number;
  };
}

export const defaultEditorConfig: EditorConfiguration = {
  namespace: 'CerteafilesEditor',
  theme: editorTheme,
  editable: true,
  a4: {
    orientation: 'portrait',
    margins: {
      top: A4_CONSTANTS.MARGIN_TOP,
      right: A4_CONSTANTS.MARGIN_RIGHT,
      bottom: A4_CONSTANTS.MARGIN_BOTTOM,
      left: A4_CONSTANTS.MARGIN_LEFT,
    },
    zoom: A4_CONSTANTS.ZOOM_DEFAULT,
  },
};
