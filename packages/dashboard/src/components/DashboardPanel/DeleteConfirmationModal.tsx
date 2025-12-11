/**
 * DeleteConfirmationModal Component
 *
 * Session silme işlemini onaylamak için modal dialog.
 * Açık onay uyarısı ile yanlışlıkla silmeyi önler.
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * DeleteConfirmationModal props'ları
 */
export interface DeleteConfirmationModalProps {
  /** Silinen session ID'si */
  sessionId: string;
  /** Modal'ın açık olup olmadığı */
  isOpen: boolean;
  /** Silme onaylanınca çağrılacak callback */
  onConfirm: () => void;
  /** İptal edilince çağrılacak callback */
  onCancel: () => void;
}

/**
 * DeleteConfirmationModal - Session silmek için onay dialog'u
 *
 * Silmeyi onaylama veya iptal etme seçenekleriyle uyarı gösterir.
 *
 * @component
 */
export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Delete Session?</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Are you sure you want to delete this session? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-900/20 flex items-center gap-2"
            type="button"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" />
            </svg>
            Delete Session
          </button>
        </div>
      </div>
    </div>
  );
};
