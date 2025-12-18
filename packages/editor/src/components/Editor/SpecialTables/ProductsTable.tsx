/**
 * ProductsTable - Produits concernés par groupe
 * Per Constitution Section 3 - Special Tables
 */
import { useState, useCallback } from 'react';
import { Package, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { ProductsTableData, ProductGroup } from '../../../types/specialTables';
import { SPECIAL_TABLE_COLORS } from '../../../types/specialTables';

export interface ProductsTableProps {
  /** Table data */
  data: ProductsTableData;
  /** Callback when data changes */
  onChange?: (data: ProductsTableData) => void;
  /** Whether the table is editable */
  editable?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * ProductsTable - Displays products organized by groups
 */
export function ProductsTable({
  data,
  onChange,
  editable = true,
  className = '',
}: ProductsTableProps): JSX.Element {
  const [editingGroup, setEditingGroup] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<{ groupIndex: number; productIndex: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  const colors = SPECIAL_TABLE_COLORS.products_by_group;

  /**
   * Add a new group
   */
  const handleAddGroup = useCallback(() => {
    if (!onChange) return;

    const newGroup: ProductGroup = {
      groupName: `Groupe ${data.groups.length + 1}`,
      products: [],
    };

    onChange({
      ...data,
      groups: [...data.groups, newGroup],
    });
  }, [data, onChange]);

  /**
   * Remove a group
   */
  const handleRemoveGroup = useCallback(
    (index: number) => {
      if (!onChange) return;

      onChange({
        ...data,
        groups: data.groups.filter((_, i) => i !== index),
      });
    },
    [data, onChange]
  );

  /**
   * Start editing a group name
   */
  const handleStartEditGroup = useCallback((index: number, currentName: string) => {
    setEditingGroup(index);
    setEditValue(currentName);
  }, []);

  /**
   * Save group name edit
   */
  const handleSaveGroupEdit = useCallback(() => {
    if (!onChange || editingGroup === null) return;

    const newGroups = [...data.groups];
    newGroups[editingGroup] = {
      ...newGroups[editingGroup],
      groupName: editValue,
    };

    onChange({ ...data, groups: newGroups });
    setEditingGroup(null);
    setEditValue('');
  }, [data, onChange, editingGroup, editValue]);

  /**
   * Add a product to a group
   */
  const handleAddProduct = useCallback(
    (groupIndex: number) => {
      if (!onChange) return;

      const newGroups = [...data.groups];
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        products: [...newGroups[groupIndex].products, 'Nouveau produit'],
      };

      onChange({ ...data, groups: newGroups });
    },
    [data, onChange]
  );

  /**
   * Remove a product from a group
   */
  const handleRemoveProduct = useCallback(
    (groupIndex: number, productIndex: number) => {
      if (!onChange) return;

      const newGroups = [...data.groups];
      newGroups[groupIndex] = {
        ...newGroups[groupIndex],
        products: newGroups[groupIndex].products.filter((_, i) => i !== productIndex),
      };

      onChange({ ...data, groups: newGroups });
    },
    [data, onChange]
  );

  /**
   * Start editing a product
   */
  const handleStartEditProduct = useCallback(
    (groupIndex: number, productIndex: number, currentValue: string) => {
      setEditingProduct({ groupIndex, productIndex });
      setEditValue(currentValue);
    },
    []
  );

  /**
   * Save product edit
   */
  const handleSaveProductEdit = useCallback(() => {
    if (!onChange || !editingProduct) return;

    const newGroups = [...data.groups];
    const newProducts = [...newGroups[editingProduct.groupIndex].products];
    newProducts[editingProduct.productIndex] = editValue;
    newGroups[editingProduct.groupIndex] = {
      ...newGroups[editingProduct.groupIndex],
      products: newProducts,
    };

    onChange({ ...data, groups: newGroups });
    setEditingProduct(null);
    setEditValue('');
  }, [data, onChange, editingProduct, editValue]);

  /**
   * Cancel editing
   */
  const handleCancelEdit = useCallback(() => {
    setEditingGroup(null);
    setEditingProduct(null);
    setEditValue('');
  }, []);

  return (
    <div
      className={`special-table products-table ${className}`}
      style={{
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '16px',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: colors.header,
          color: 'white',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
        }}
      >
        <Package size={18} />
        <span>{data.title}</span>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderBottom: `2px solid ${colors.border}`,
                  fontWeight: 600,
                  color: colors.header,
                }}
              >
                Groupe
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderBottom: `2px solid ${colors.border}`,
                  fontWeight: 600,
                  color: colors.header,
                }}
              >
                Produits
              </th>
              {editable && (
                <th
                  style={{
                    width: '80px',
                    padding: '8px 12px',
                    borderBottom: `2px solid ${colors.border}`,
                  }}
                />
              )}
            </tr>
          </thead>
          <tbody>
            {data.groups.map((group, groupIndex) => (
              <tr key={groupIndex}>
                <td
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #e2e8f0',
                    verticalAlign: 'top',
                    fontWeight: 500,
                  }}
                >
                  {editingGroup === groupIndex ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveGroupEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          flex: 1,
                        }}
                      />
                      <button
                        onClick={handleSaveGroupEdit}
                        style={{
                          padding: '4px',
                          background: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          padding: '4px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{group.groupName}</span>
                      {editable && (
                        <button
                          onClick={() => handleStartEditGroup(groupIndex, group.groupName)}
                          style={{
                            padding: '2px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280',
                          }}
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #e2e8f0',
                    verticalAlign: 'top',
                  }}
                >
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {group.products.map((product, productIndex) => (
                      <li
                        key={productIndex}
                        style={{
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        {editingProduct?.groupIndex === groupIndex &&
                        editingProduct?.productIndex === productIndex ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveProductEdit();
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              autoFocus
                              style={{
                                padding: '2px 6px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                flex: 1,
                                fontSize: '14px',
                              }}
                            />
                            <button
                              onClick={handleSaveProductEdit}
                              style={{
                                padding: '2px',
                                background: '#22c55e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              style={{
                                padding: '2px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span>{product}</span>
                            {editable && (
                              <>
                                <button
                                  onClick={() =>
                                    handleStartEditProduct(groupIndex, productIndex, product)
                                  }
                                  style={{
                                    padding: '2px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                  }}
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleRemoveProduct(groupIndex, productIndex)}
                                  style={{
                                    padding: '2px',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#ef4444',
                                  }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                  {editable && (
                    <button
                      onClick={() => handleAddProduct(groupIndex)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        marginTop: '8px',
                        background: 'transparent',
                        border: '1px dashed #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#6b7280',
                        fontSize: '12px',
                      }}
                    >
                      <Plus size={12} />
                      Ajouter un produit
                    </button>
                  )}
                </td>
                {editable && (
                  <td
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #e2e8f0',
                      verticalAlign: 'top',
                    }}
                  >
                    <button
                      onClick={() => handleRemoveGroup(groupIndex)}
                      style={{
                        padding: '4px 8px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fecaca',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {editable && (
          <button
            onClick={handleAddGroup}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              marginTop: '12px',
              background: 'white',
              border: `1px dashed ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              color: colors.header,
              fontWeight: 500,
            }}
          >
            <Plus size={16} />
            Ajouter un groupe
          </button>
        )}
      </div>
    </div>
  );
}

export default ProductsTable;
