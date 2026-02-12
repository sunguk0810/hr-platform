import type { DepartmentTreeNode } from '@hr-platform/shared-types';

/**
 * Filter tree by search keyword
 * @param nodes - The tree nodes to filter
 * @param keyword - The search keyword
 * @returns The filtered tree nodes
 */
export const filterTree = (
  nodes: DepartmentTreeNode[],
  keyword: string
): DepartmentTreeNode[] => {
  if (!keyword) return nodes;
  const lower = keyword.toLowerCase();
  return nodes.reduce<DepartmentTreeNode[]>((acc, node) => {
    const filteredChildren = filterTree(node.children || [], keyword);
    if (
      node.name.toLowerCase().includes(lower) ||
      filteredChildren.length > 0
    ) {
      acc.push({
        ...node,
        children:
          filteredChildren.length > 0
            ? filteredChildren
            : node.children || [],
      });
    }
    return acc;
  }, []);
};
